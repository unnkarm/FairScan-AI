"""
main.py
FairScan — Bias Audit & Fix Tool
FastAPI application entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import router as upload_router
from routes.analysis import router as analysis_router
from routes.fix import router as fix_router

# ── App init ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FairScan — Bias Audit & Fix API",
    description=(
        "Upload a CSV dataset, measure algorithmic bias with Disparate Impact Ratio "
        "and Statistical Parity Difference, generate plain-English explanations via "
        "Gemini, and apply oversampling mitigation — all in one REST API."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow any origin for hackathon / React dev server) ──────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload_router)
app.include_router(analysis_router)
app.include_router(fix_router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health() -> dict:
    """Quick liveness probe — useful for deployment platforms."""
    return {"status": "ok", "service": "FairScan API"}


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root() -> dict:
    return {
        "message": "Welcome to FairScan Bias Audit API 🔍",
        "docs": "/docs",
        "endpoints": ["/upload", "/analyze", "/explain", "/fix"],
    }
