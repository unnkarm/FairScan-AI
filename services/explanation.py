"""
services/explanation.py
Plain-English bias explanations powered by Google Gemini API.
Falls back to a template-based explanation if the API is unavailable.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-pro:generateContent"
)


def _build_prompt(
    DIR: float,
    SPD: float,
    target_column: str,
    sensitive_column: str,
    privileged_value: str,
    unprivileged_value: str,
    risk: str,
) -> str:
    """Construct the prompt sent to Gemini."""
    return (
        f"You are a bias auditor explaining algorithmic fairness to a non-technical audience.\n\n"
        f"Dataset context:\n"
        f"- Outcome column: '{target_column}' (1 = positive outcome)\n"
        f"- Sensitive attribute: '{sensitive_column}'\n"
        f"- Privileged group: '{privileged_value}'\n"
        f"- Unprivileged group: '{unprivileged_value}'\n\n"
        f"Bias metrics:\n"
        f"- Disparate Impact Ratio (DIR): {DIR:.4f}\n"
        f"- Statistical Parity Difference (SPD): {SPD:.4f}\n"
        f"- Risk level: {risk}\n\n"
        f"Write a plain-English explanation of what these numbers mean. "
        f"Rules: no jargon, max 3 sentences, explain concretely what the bias means "
        f"for people in the '{unprivileged_value}' group."
    )


def _fallback_explanation(
    DIR: float,
    SPD: float,
    unprivileged_value: str,
    privileged_value: str,
    risk: str,
) -> str:
    """
    Template-based explanation used when Gemini is unavailable.
    Always returns a meaningful, human-readable string.
    """
    spd_pct = abs(round(SPD * 100, 1))
    direction = "less" if SPD < 0 else "more"

    risk_phrases = {
        "HIGH": "This is a serious fairness concern that should be addressed before deployment.",
        "MEDIUM": "This represents a moderate disparity worth investigating and mitigating.",
        "LOW": "The difference is small, but monitoring is still recommended.",
    }

    return (
        f"People in the '{unprivileged_value}' group receive a positive outcome "
        f"{spd_pct}% {direction} often than people in the '{privileged_value}' group. "
        f"The Disparate Impact Ratio of {DIR:.2f} means the system treats these groups "
        f"differently — a score below 0.8 is considered discriminatory under US EEOC guidelines. "
        f"{risk_phrases.get(risk, '')}"
    )


async def generate_explanation(
    DIR: float,
    SPD: float,
    target_column: str,
    sensitive_column: str,
    privileged_value: str,
    unprivileged_value: str,
    risk: str,
) -> str:
    """
    Call Gemini to generate an explanation.
    Returns fallback text if the API key is missing or the call fails.
    """
    # ── No API key → skip network call ────────────────────────────────────────
    if not GEMINI_API_KEY:
        return _fallback_explanation(DIR, SPD, unprivileged_value, privileged_value, risk)

    prompt = _build_prompt(
        DIR, SPD, target_column, sensitive_column,
        privileged_value, unprivileged_value, risk
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 200,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GEMINI_URL,
                params={"key": GEMINI_API_KEY},
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()

        # Extract text from Gemini's nested response structure
        explanation = (
            data["candidates"][0]["content"]["parts"][0]["text"].strip()
        )
        return explanation

    except (httpx.HTTPError, KeyError, IndexError, Exception):
        # Any failure → graceful fallback
        return _fallback_explanation(DIR, SPD, unprivileged_value, privileged_value, risk)
