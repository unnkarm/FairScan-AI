"""
routes/fix.py
POST /fix — apply oversampling mitigation and return before/after comparison.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import AnalyzeRequest, FixResponse
from services.bias_metrics import compute_metrics
from services.mitigation import oversample_minority
from utils.helpers import load_dataframe, require_columns, require_values

router = APIRouter()


@router.post("/fix", response_model=FixResponse, tags=["Mitigation"])
async def fix_bias(body: AnalyzeRequest) -> FixResponse:
    """
    Mitigate dataset bias by oversampling the disadvantaged minority group,
    then return a before/after comparison of DIR and SPD.

    Steps:
      1. Compute bias metrics on original data (before).
      2. Oversample positive-outcome rows from the minority group.
      3. Recompute metrics on augmented data (after).
      4. Return both results plus improvement deltas.
    """
    df = load_dataframe()

    # ── Validate ──────────────────────────────────────────────────────────────
    require_columns(df, body.target_column, body.sensitive_column)
    require_values(
        df, body.sensitive_column,
        body.privileged_value, body.unprivileged_value,
    )

    kwargs = dict(
        target_column=body.target_column,
        sensitive_column=body.sensitive_column,
        privileged_value=body.privileged_value,
        unprivileged_value=body.unprivileged_value,
    )

    # ── Step 1: Before metrics ────────────────────────────────────────────────
    try:
        before_metrics = compute_metrics(df=df, **kwargs)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # ── Step 2: Oversample ───────────────────────────────────────────────────
    augmented_df, meta = oversample_minority(df=df, **kwargs)

    # ── Step 3: After metrics ─────────────────────────────────────────────────
    try:
        after_metrics = compute_metrics(df=augmented_df, **kwargs)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # ── Step 4: Delta (positive = improvement) ────────────────────────────────
    improvement = {
        "DIR": round(after_metrics["DIR"] - before_metrics["DIR"], 4),
        "SPD": round(after_metrics["SPD"] - before_metrics["SPD"], 4),
    }

    return FixResponse(
        before={"DIR": before_metrics["DIR"], "SPD": before_metrics["SPD"]},
        after={"DIR": after_metrics["DIR"], "SPD": after_metrics["SPD"]},
        improvement=improvement,
        minority_group=meta["minority_group"],
        rows_added=meta["rows_added"],
    )
