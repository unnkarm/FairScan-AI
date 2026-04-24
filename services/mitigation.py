"""
services/mitigation.py
Bias mitigation via random oversampling of the disadvantaged minority group.

Strategy:
  1. Identify which group (privileged / unprivileged) has fewer positive
     outcomes in absolute terms.
  2. Duplicate rows from that group until both groups are balanced.
  3. Return the augmented DataFrame along with metadata.
"""

import pandas as pd
from utils.helpers import round4


def oversample_minority(
    df: pd.DataFrame,
    target_column: str,
    sensitive_column: str,
    privileged_value: str,
    unprivileged_value: str,
) -> tuple[pd.DataFrame, dict]:
    """
    Oversample the minority group and return (augmented_df, metadata).

    metadata keys:
        minority_group  – which sensitive value was oversampled
        rows_added      – how many synthetic rows were appended
    """
    sensitive = df[sensitive_column].astype(str)

    # ── Positive-outcome rows per group ───────────────────────────────────────
    # We compare raw counts (not rates) to decide who to oversample.
    target = df[target_column]

    # Binarize if not already binary
    unique_vals = target.dropna().unique()
    if not set(map(str, unique_vals)).issubset({"0", "1", "True", "False", "true", "false"}):
        if len(unique_vals) != 2:
            median_val = target.median()
            target = (target >= median_val).astype(int)
        else:
            sorted_vals = sorted(unique_vals, key=str)
            target = target.map({sorted_vals[0]: 0, sorted_vals[1]: 1})
    priv_positive = df[(sensitive == str(privileged_value)) & (target == 1)]
    unpriv_positive = df[(sensitive == str(unprivileged_value)) & (target == 1)]

    priv_count = len(priv_positive)
    unpriv_count = len(unpriv_positive)

    # ── Decide minority group ─────────────────────────────────────────────────
    if unpriv_count >= priv_count:
        # Already balanced (or unprivileged group is actually larger)
        return df.copy(), {
            "minority_group": "none (already balanced)",
            "rows_added": 0,
        }

    minority_group = str(unprivileged_value)
    majority_count = priv_count
    minority_positive_rows = unpriv_positive

    # ── Oversample ────────────────────────────────────────────────────────────
    shortfall = majority_count - unpriv_count

    if shortfall <= 0 or len(minority_positive_rows) == 0:
        return df.copy(), {
            "minority_group": minority_group,
            "rows_added": 0,
        }

    # Sample with replacement to fill the shortfall
    oversampled = minority_positive_rows.sample(
        n=shortfall, replace=True, random_state=42
    )

    augmented_df = pd.concat([df, oversampled], ignore_index=True)

    return augmented_df, {
        "minority_group": minority_group,
        "rows_added": shortfall,
    }
