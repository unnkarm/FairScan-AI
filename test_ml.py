from ml.bias_metrics import run_analysis
from ml.bias_fix import run_weighted_analysis

import pandas as pd

df = pd.read_csv("sample_data.csv")

before = run_analysis(df, "hired", "gender", "male")
after = run_weighted_analysis(df, "hired", "gender", "male")

print("BEFORE:", before)
print("AFTER:", after)