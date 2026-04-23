"""
services/bias_metrics.py
Core bias computation: Disparate Impact Ratio (DIR) and
Statistical Parity Difference (SPD), plus risk classification.
"""

import pandas as pd
from utils.helpers import safe_divide, round4


def compute_metrics(
    df: pd.DataFrame,
    target_column: str,
    sensitive_column: str,
    privileged_value: str,
    unprivileged_value: str,
) -> dict:
    """
    Compute DIR and SPD for a binary-outcome dataset.

    Returns a dict with:
        DIR             – unprivileged_rate / privileged_rate
        SPD             – unprivileged_rate - privileged_rate
        risk            – "HIGH" | "MEDIUM" | "LOW"
        privileged_rate – P(Y=1 | privileged group)
        unprivileged_rate – P(Y=1 | unprivileged group)
    """
    # ── 1. Coerce target column to binary (0/1) ───────────────────────────────
    # Handles boolean, string "True"/"False", or already-numeric columns.
    target = df[target_column].copy()
    unique_vals = target.dropna().unique()

    if set(map(str, unique_vals)).issubset({"0", "1", "True", "False", "true", "false"}):
        target = target.astype(str).str.lower().map(
            {"1": 1, "true": 1, "0": 0, "false": 0}
        )
    else:
        # Treat the majority value as 1 (positive outcome) only if exactly 2 classes
        if len(unique_vals) != 2:
            raise ValueError(
                f"Target column '{target_column}' must be binary "
                f"(2 unique values). Found: {list(unique_vals)}"
            )
        sorted_vals = sorted(unique_vals, key=str)
        target = target.map({sorted_vals[0]: 0, sorted_vals[1]: 1})

    # Cast sensitive column to string for reliable comparison
    sensitive = df[sensitive_column].astype(str)

    # ── 2. Isolate groups ─────────────────────────────────────────────────────
    priv_mask = sensitive == str(privileged_value)
    unpriv_mask = sensitive == str(unprivileged_value)

    priv_group = target[priv_mask]
    unpriv_group = target[unpriv_mask]

    # ── 3. Conditional positive-outcome rates ────────────────────────────────
    privileged_rate = safe_divide(priv_group.sum(), len(priv_group))
    unprivileged_rate = safe_divide(unpriv_group.sum(), len(unpriv_group))

    # ── 4. Metrics ────────────────────────────────────────────────────────────
    DIR = safe_divide(unprivileged_rate, privileged_rate, fallback=0.0)
    SPD = unprivileged_rate - privileged_rate

    # ── 5. Risk classification (80% rule from US EEOC guidelines) ────────────
    if DIR < 0.8:
        risk = "HIGH"
    elif DIR < 0.9:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "DIR": round4(DIR),
        "SPD": round4(SPD),
        "risk": risk,
        "privileged_rate": round4(float(privileged_rate)),
        "unprivileged_rate": round4(float(unprivileged_rate)),
    }
