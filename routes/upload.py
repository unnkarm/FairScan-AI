"""
routes/upload.py
POST /upload — accept a CSV file, store it in memory, return preview metadata.
"""

import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import UploadResponse
from utils.helpers import save_dataframe

router = APIRouter()


@router.post("/upload", response_model=UploadResponse, tags=["Upload"])
async def upload_csv(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a CSV file.

    - Validates that the file is a CSV (by extension and parsability).
    - Stores the DataFrame in memory for subsequent analysis calls.
    - Returns column names, row count, and a 5-row preview.
    """
    # ── Extension check ───────────────────────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are accepted.",
        )

    # ── Read bytes and parse ──────────────────────────────────────────────────
    raw = await file.read()

    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse CSV: {exc}",
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    # ── Persist for later endpoints ───────────────────────────────────────────
    save_dataframe(df)

    # ── Build preview (first 5 rows, NaN → None for JSON serialisation) ───────
    preview = df.head(50).where(pd.notnull(df.head(50)), other=None).to_dict(orient="records")

    return UploadResponse(
        columns=list(df.columns),
        preview=preview,
        row_count=len(df),
    )
