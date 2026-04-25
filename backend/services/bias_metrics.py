"""
services/bias_metrics.py
Wraps the ML model's bias computation (ml/bias_metrics.py) for use
by the FastAPI routes. This integrates the ml-model package into the
backend service layer.
"""

import pandas as pd
from ml.bias_metrics import run_analysis
from utils.helpers import round4


def compute_metrics(
    df: pd.DataFrame,
    target_column: str,
    sensitive_column: str,
    privileged_value: str,
    unprivileged_value: str,
) -> dict:
    """
    Compute DIR and SPD using the ML model's robust implementation.

    Returns a dict with:
        DIR              – unprivileged_rate / privileged_rate
        SPD              – unprivileged_rate - privileged_rate
        risk             – "HIGH" | "MEDIUM" | "LOW"
        privileged_rate  – P(Y=1 | privileged group)
        unprivileged_rate – P(Y=1 | unprivileged group)
    """
    result = run_analysis(
        df=df,
        target_col=target_column,
        sensitive_col=sensitive_column,
        privileged_value=privileged_value,
    )

    dir_val = result.get("DIR") or 0.0
    spd_val = result.get("SPD") or 0.0
    risk_raw = result.get("risk_level", "LOW")

    # Normalise risk label to uppercase (ML model returns "High"/"Medium"/"Low")
    risk = risk_raw.upper()

    return {
        "DIR": round4(float(dir_val)),
        "SPD": round4(float(spd_val)),
        "risk": risk,
        "privileged_rate": round4(float(result.get("privileged_rate") or 0.0)),
        "unprivileged_rate": round4(float(result.get("unprivileged_rate") or 0.0)),
    }
