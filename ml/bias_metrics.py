import pandas as pd
import numpy as np


def _to_binary(series: pd.Series) -> pd.Series:
    """Convert target column to binary 1/0."""

    series = series.dropna()
    unique_vals = sorted(series.unique())

    if len(unique_vals) != 2:
        raise ValueError(f"Target column must have exactly 2 unique values, found: {unique_vals}")

    # If numeric, ensure it's binary
    if pd.api.types.is_numeric_dtype(series):
        if set(unique_vals) != {0, 1}:
            raise ValueError("Numeric target must be binary (0/1).")
        return series.astype(float)

    # Otherwise handle categorical
    positive_keywords = {"yes", "approved", "true", "1", "positive", "accept", "granted"}

    positive_label = None
    for v in unique_vals:
        if str(v).strip().lower() in positive_keywords:
            positive_label = v
            break

    if positive_label is None:
        positive_label = unique_vals[0]

    # Convert manually without lambda
    binary_series = []
    for val in series:
        if val == positive_label:
            binary_series.append(1)
        else:
            binary_series.append(0)

    return pd.Series(binary_series, index=series.index).astype(float)


def _positive_rate(target: pd.Series) -> float:
    """Return positive rate for a group, handling empty series."""
    if len(target) == 0:
        return np.nan
    return float(target.mean())


def _compute_dir(privileged_rate: float, unprivileged_rate: float) -> float:
    """Disparate Impact Ratio = unprivileged_rate / privileged_rate."""
    if np.isnan(privileged_rate) or np.isnan(unprivileged_rate):
        return np.nan
    if privileged_rate == 0:
        return np.nan  # division by zero
    return round(unprivileged_rate / privileged_rate, 4)


def _compute_spd(privileged_rate: float, unprivileged_rate: float) -> float:
    """Statistical Parity Difference = unprivileged_rate - privileged_rate."""
    if np.isnan(privileged_rate) or np.isnan(unprivileged_rate):
        return np.nan
    return round(unprivileged_rate - privileged_rate, 4)


def _assign_risk(dir_val: float, spd_val: float) -> str:
    """Assign risk level based on DIR and SPD thresholds."""
    if np.isnan(dir_val) or np.isnan(spd_val):
        return "Unknown"
    if dir_val < 0.8 or abs(spd_val) > 0.2:
        return "High"
    if (0.8 <= dir_val < 0.9) or (-0.2 <= spd_val < -0.1):
        return "Medium"
    return "Low"


def _clean(value):
    return None if pd.isna(value) else value


def run_analysis(df: pd.DataFrame, target_col: str, sensitive_col: str, privileged_value) -> dict:
    """
    Analyze bias in a dataset for a given sensitive column.

    Args:
        df               : Input DataFrame
        target_col       : Name of the outcome/label column
        sensitive_col    : Name of the sensitive attribute column (e.g., 'sex', 'race')
        privileged_value : The value in sensitive_col considered privileged (e.g., 'Male')

    Returns:
        dict with DIR, SPD, privileged_rate, unprivileged_rate, risk_level
    """
    # --- Validate columns exist ---
    for col in [target_col, sensitive_col]:
        if col not in df.columns:
            raise KeyError(f"Column '{col}' not found in DataFrame.")

    # --- Drop rows where either column is missing ---
    working = df[[target_col, sensitive_col]].dropna().copy()

    if working.empty:
        return {
            "DIR": None,
            "SPD": None,
            "privileged_rate": None,
            "unprivileged_rate": None,
            "risk_level": "Unknown"
        }
    
    if working[sensitive_col].nunique() != 2:
        raise ValueError("Sensitive attribute must have exactly 2 groups for this version.")

    # --- Convert target to binary ---
    working[target_col] = _to_binary(working[target_col])

    # --- Split into privileged / unprivileged groups ---
    if privileged_value not in working[sensitive_col].unique():
        raise ValueError(f"Privileged value '{privileged_value}' not found in column '{sensitive_col}'")
    
    privileged_mask   = working[sensitive_col] == privileged_value
    unprivileged_mask = ~privileged_mask
    
    priv_target   = working.loc[privileged_mask,   target_col]
    unpriv_target = working.loc[unprivileged_mask, target_col]

    # --- Compute rates ---
    privileged_rate   = _positive_rate(priv_target)
    unprivileged_rate = _positive_rate(unpriv_target)

    # --- Compute metrics ---
    dir_val = _compute_dir(privileged_rate, unprivileged_rate)
    spd_val = _compute_spd(privileged_rate, unprivileged_rate)

    # --- Assign risk ---
    risk = _assign_risk(dir_val, spd_val)

    return {
        "DIR":               _clean(dir_val),
        "SPD":               _clean(spd_val),
        "privileged_rate":   _clean(round(privileged_rate, 4)) if not pd.isna(privileged_rate) else None,
        "unprivileged_rate": _clean(round(unprivileged_rate, 4)) if not pd.isna(unprivileged_rate) else None,
        "risk_level":        risk
    }