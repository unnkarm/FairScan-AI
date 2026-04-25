# bias_fix.py
import pandas as pd
import numpy as np

from ml.bias_metrics import _to_binary, _compute_dir, _compute_spd, _assign_risk, _clean


# ─────────────────────────────────────────────
# Helper: weighted positive rate
# ─────────────────────────────────────────────

def _weighted_positive_rate(target: pd.Series, weights: pd.Series) -> float:
    """Compute weighted mean of target using provided weights."""
    if len(target) == 0 or weights.sum() == 0:
        return np.nan
    return float((weights * target).sum() / weights.sum())


# ─────────────────────────────────────────────
# Core: compute reweighting weights
# ─────────────────────────────────────────────

def compute_weights(df: pd.DataFrame, target_col: str, sensitive_col: str) -> pd.DataFrame:
    """
    Compute reweighting fairness weights for each row.

    Formula per row:
        weight = (P(group) * P(outcome)) / P(group, outcome)

    Args:
        df            : Input DataFrame
        target_col    : Binary or categorical outcome column
        sensitive_col : Sensitive attribute column (e.g., 'sex')

    Returns:
        DataFrame with original index and added 'weight' column.
    """
    for col in [target_col, sensitive_col]:
        if col not in df.columns:
            raise KeyError(f"Column '{col}' not found in DataFrame.")

    working = df[[target_col, sensitive_col]].dropna().copy()

    if working.empty:
        working["weight"] = pd.Series(dtype=float)
        return working

    # Convert target to binary
    working[target_col] = _to_binary(working[target_col])

    n = len(working)

    # ── P(group) ──────────────────────────────
    group_counts = working[sensitive_col].value_counts()
    group_prob = group_counts / n

    # ── P(outcome) ────────────────────────────
    outcome_counts = working[target_col].value_counts()
    outcome_prob = outcome_counts / n

    # ── P(group, outcome) ─────────────────────
    joint_counts = working.groupby([sensitive_col, target_col]).size()
    joint_prob = joint_counts / n

    # ── Assign weight per row ─────────────────
    weight_list = []

    for idx, row in working.iterrows():
        group   = row[sensitive_col]
        outcome = row[target_col]

        p_group   = group_prob.get(group, np.nan)
        p_outcome = outcome_prob.get(outcome, np.nan)

        try:
            p_joint = joint_prob.loc[(group, outcome)]
        except KeyError:
            p_joint = np.nan

        if np.isnan(p_group) or np.isnan(p_outcome) or np.isnan(p_joint) or p_joint == 0:
            weight_list.append(np.nan)
        else:
            weight_list.append((p_group * p_outcome) / p_joint)

    working["weight"] = weight_list

    total_weight = working["weight"].sum()
    if not np.isnan(total_weight) and total_weight != 0:
        working["weight"] = working["weight"] / total_weight
    return working


# ─────────────────────────────────────────────
# Core: weighted fairness analysis
# ─────────────────────────────────────────────

def run_weighted_analysis(
    df: pd.DataFrame,
    target_col: str,
    sensitive_col: str,
    privileged_value
) -> dict:
    """
    Run bias analysis using reweighted samples.

    Mirrors run_analysis() from bias_metrics.py but uses
    weighted means instead of simple means.

    Args:
        df               : Input DataFrame
        target_col       : Outcome column name
        sensitive_col    : Sensitive attribute column name
        privileged_value : The privileged group value (e.g., 'Male')

    Returns:
        dict with weighted DIR, SPD, privileged_rate,
        unprivileged_rate, and risk_level.
    """
    null_result = {
        "DIR":               None,
        "SPD":               None,
        "privileged_rate":   None,
        "unprivileged_rate": None,
        "risk_level":        "Unknown"
    }

    for col in [target_col, sensitive_col]:
        if col not in df.columns:
            raise KeyError(f"Column '{col}' not found in DataFrame.")

    # compute_weights handles dropna + binarization internally
    working = compute_weights(df, target_col, sensitive_col)

    if working.empty:
        return null_result

    # Fill rows where weight could not be computed
    working["weight"] = working["weight"].fillna(0)

    if working.empty:
        return null_result

    if working[sensitive_col].nunique() != 2:
        raise ValueError("Sensitive attribute must have exactly 2 groups for this version.")

    if privileged_value not in working[sensitive_col].unique():
        raise ValueError(
            f"Privileged value '{privileged_value}' not found in column '{sensitive_col}'."
        )

    # ── Split groups ──────────────────────────
    priv_mask   = working[sensitive_col] == privileged_value
    unpriv_mask = ~priv_mask

    priv_target     = working.loc[priv_mask,   target_col]
    unpriv_target   = working.loc[unpriv_mask, target_col]
    priv_weights    = working.loc[priv_mask,   "weight"]
    unpriv_weights  = working.loc[unpriv_mask, "weight"]

    # ── Weighted rates ────────────────────────
    privileged_rate   = _weighted_positive_rate(priv_target,   priv_weights)
    unprivileged_rate = _weighted_positive_rate(unpriv_target, unpriv_weights)

    # ── Metrics ───────────────────────────────
    dir_val = _compute_dir(privileged_rate, unprivileged_rate)
    spd_val = _compute_spd(privileged_rate, unprivileged_rate)
    risk    = _assign_risk(dir_val, spd_val)

    return {
        "DIR":               _clean(dir_val),
        "SPD":               _clean(spd_val),
        "privileged_rate":   _clean(round(privileged_rate,   4)) if not pd.isna(privileged_rate)   else None,
        "unprivileged_rate": _clean(round(unprivileged_rate, 4)) if not pd.isna(unprivileged_rate) else None,
        "risk_level":        risk
    }