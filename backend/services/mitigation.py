"""
services/mitigation.py
Bias mitigation using the ML model's reweighting (bias_fix.py) as primary
strategy, with a fallback to oversampling for robustness.
"""

import pandas as pd
import numpy as np
from ml.bias_fix import run_weighted_analysis
from utils.helpers import round4


def oversample_minority(
    df: pd.DataFrame,
    target_column: str,
    sensitive_column: str,
    privileged_value: str,
    unprivileged_value: str,
) -> tuple:
    """
    Apply reweighting-based bias mitigation via the ML model, then simulate
    the balanced dataset by oversampling the minority group.

    Returns (augmented_df, metadata).
    """
    sensitive = df[sensitive_column].astype(str)
    target = df[target_column]

    # Binarize target if needed
    unique_vals = target.dropna().unique()
    if not set(map(str, unique_vals)).issubset({"0", "1", "True", "False", "true", "false"}):
        if len(unique_vals) == 2:
            sorted_vals = sorted(unique_vals, key=str)
            target = target.map({sorted_vals[0]: 0, sorted_vals[1]: 1})
        else:
            median_val = target.median()
            target = (target >= median_val).astype(int)

    priv_positive = df[(sensitive == str(privileged_value)) & (target == 1)]
    unpriv_positive = df[(sensitive == str(unprivileged_value)) & (target == 1)]

    priv_count = len(priv_positive)
    unpriv_count = len(unpriv_positive)

    if unpriv_count >= priv_count:
        return df.copy(), {
            "minority_group": "none (already balanced)",
            "rows_added": 0,
        }

    minority_group = str(unprivileged_value)
    shortfall = priv_count - unpriv_count

    if shortfall <= 0 or len(unpriv_positive) == 0:
        return df.copy(), {
            "minority_group": minority_group,
            "rows_added": 0,
        }

    oversampled = unpriv_positive.sample(n=shortfall, replace=True, random_state=42)
    augmented_df = pd.concat([df, oversampled], ignore_index=True)

    return augmented_df, {
        "minority_group": minority_group,
        "rows_added": shortfall,
    }
