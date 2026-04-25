"""
routes/analysis.py
POST /analyze — compute bias metrics on the uploaded CSV.
POST /explain  — generate a plain-English explanation via Gemini.
"""

from fastapi import APIRouter
from models.schemas import AnalyzeRequest, ExplainRequest, BiasMetrics, ExplainResponse
from services.bias_metrics import compute_metrics
from services.explanation import generate_explanation
from utils.helpers import load_dataframe, require_columns, require_values

router = APIRouter()


@router.post("/analyze", response_model=BiasMetrics, tags=["Analysis"])
async def analyze_bias(body: AnalyzeRequest) -> BiasMetrics:
    """
    Compute Disparate Impact Ratio (DIR) and Statistical Parity Difference (SPD)
    for the uploaded dataset.

    - DIR < 0.8  → HIGH risk
    - 0.8 ≤ DIR < 0.9 → MEDIUM risk
    - DIR ≥ 0.9  → LOW risk
    """
    df = load_dataframe()

    # ── Validate columns and group values exist ───────────────────────────────
    require_columns(df, body.target_column, body.sensitive_column)
    require_values(
        df, body.sensitive_column,
        body.privileged_value, body.unprivileged_value,
    )

    try:
        metrics = compute_metrics(
            df=df,
            target_column=body.target_column,
            sensitive_column=body.sensitive_column,
            privileged_value=body.privileged_value,
            unprivileged_value=body.unprivileged_value,
        )
    except ValueError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(exc))

    return BiasMetrics(**metrics)


@router.post("/explain", response_model=ExplainResponse, tags=["Analysis"])
async def explain_bias(body: ExplainRequest) -> ExplainResponse:
    """
    Generate a plain-English explanation of the bias metrics using Gemini.
    Falls back to a template-based explanation if the API is unavailable.
    """
    text = await generate_explanation(
        DIR=body.DIR,
        SPD=body.SPD,
        target_column=body.target_column,
        sensitive_column=body.sensitive_column,
        privileged_value=body.privileged_value,
        unprivileged_value=body.unprivileged_value,
        risk=body.risk,
    )
    return ExplainResponse(explanation=text)
