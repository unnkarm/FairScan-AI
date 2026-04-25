"""
utils/helpers.py
Shared utilities: in-memory CSV store, column validation, and safe math.
"""

import pandas as pd
from fastapi import HTTPException

# ── In-memory "session" store ─────────────────────────────────────────────────
# Single-user MVP: stores the last uploaded DataFrame.
# Replace with Redis / DB for multi-user production use.
_store: dict[str, pd.DataFrame] = {}

DATAFRAME_KEY = "current_df"


def save_dataframe(df: pd.DataFrame) -> None:
    """Persist a DataFrame in the in-memory store."""
    _store[DATAFRAME_KEY] = df


def load_dataframe() -> pd.DataFrame:
    """
    Retrieve the stored DataFrame.
    Raises 400 if no CSV has been uploaded yet.
    """
    df = _store.get(DATAFRAME_KEY)
    if df is None:
        raise HTTPException(
            status_code=400,
            detail="No CSV uploaded yet. Please POST to /upload first.",
        )
    return df


# ── Validation helpers ────────────────────────────────────────────────────────

def require_columns(df: pd.DataFrame, *columns: str) -> None:
    """
    Raise a descriptive 400 error when any required column is missing.
    """
    missing = [c for c in columns if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Column(s) not found in CSV: {missing}. "
                   f"Available columns: {list(df.columns)}",
        )


def require_values(
    df: pd.DataFrame,
    column: str,
    *values: str,
) -> None:
    """
    Raise a 400 error when any expected value is absent in a column.
    """
    present = set(df[column].astype(str).unique())
    for val in values:
        if val not in present:
            raise HTTPException(
                status_code=400,
                detail=f"Value '{val}' not found in column '{column}'. "
                       f"Available values: {sorted(present)}",
            )


# ── Safe math ─────────────────────────────────────────────────────────────────

def safe_divide(numerator: float, denominator: float, fallback: float = 0.0) -> float:
    """Division that returns `fallback` instead of ZeroDivisionError."""
    if denominator == 0:
        return fallback
    return numerator / denominator


def round4(value: float) -> float:
    """Round to 4 decimal places for consistent API output."""
    return round(value, 4)
