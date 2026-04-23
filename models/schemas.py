"""
models/schemas.py
Pydantic models for request/response validation across all endpoints.
"""

from pydantic import BaseModel
from typing import Any


# ── Request Schemas ──────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Input for bias analysis and fix endpoints."""
    target_column: str
    sensitive_column: str
    privileged_value: str
    unprivileged_value: str


class ExplainRequest(BaseModel):
    """Input for the Gemini explanation endpoint."""
    DIR: float
    SPD: float
    target_column: str
    sensitive_column: str
    privileged_value: str
    unprivileged_value: str
    risk: str


# ── Response Schemas ──────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    columns: list[str]
    preview: list[dict[str, Any]]
    row_count: int


class BiasMetrics(BaseModel):
    DIR: float
    SPD: float
    risk: str
    privileged_rate: float
    unprivileged_rate: float


class ExplainResponse(BaseModel):
    explanation: str


class FixResponse(BaseModel):
    before: dict[str, float]
    after: dict[str, float]
    improvement: dict[str, float]
    minority_group: str
    rows_added: int
