# FairScan — Bias Audit & Fix API

> A production-ready FastAPI backend for detecting and mitigating algorithmic bias in tabular datasets.

---

## 🚀 Quick Start

```bash
# 1. Clone / copy this folder
cd backend

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional — fallback works without it)

# 5. Run
uvicorn main:app --reload
```

The API is now live at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

## 📁 Project Structure

```
backend/
├── main.py                  # App entrypoint, CORS, router registration
├── routes/
│   ├── upload.py            # POST /upload
│   ├── analysis.py          # POST /analyze, POST /explain
│   └── fix.py               # POST /fix
├── services/
│   ├── bias_metrics.py      # DIR / SPD computation
│   ├── mitigation.py        # Oversampling logic
│   └── explanation.py       # Gemini API integration + fallback
├── models/
│   └── schemas.py           # Pydantic request/response models
├── utils/
│   └── helpers.py           # In-memory store, validation, safe math
├── sample_data.csv          # Ready-to-use test dataset
├── requirements.txt
└── .env.example
```

---

## 📡 API Reference

### `GET /health`
Liveness probe.

---

### `POST /upload`
Upload a CSV file.

**Form field:** `file` (multipart/form-data)

**Response:**
```json
{
  "columns": ["age", "gender", "hired"],
  "preview": [{ "age": 34, "gender": "male", "hired": 1 }, ...],
  "row_count": 30
}
```

---

### `POST /analyze`
Compute bias metrics.

**Request:**
```json
{
  "target_column": "hired",
  "sensitive_column": "gender",
  "privileged_value": "male",
  "unprivileged_value": "female"
}
```

**Response:**
```json
{
  "DIR": 0.6154,
  "SPD": -0.2692,
  "risk": "HIGH",
  "privileged_rate": 0.8667,
  "unprivileged_rate": 0.5333
}
```

---

### `POST /explain`
Generate a plain-English explanation via Gemini.

**Request:**
```json
{
  "DIR": 0.6154,
  "SPD": -0.2692,
  "target_column": "hired",
  "sensitive_column": "gender",
  "privileged_value": "male",
  "unprivileged_value": "female",
  "risk": "HIGH"
}
```

**Response:**
```json
{
  "explanation": "Women in this dataset are hired 26.9% less often than men..."
}
```

---

### `POST /fix`
Apply oversampling mitigation and return before/after comparison.

**Request:** Same as `/analyze`

**Response:**
```json
{
  "before": { "DIR": 0.6154, "SPD": -0.2692 },
  "after":  { "DIR": 0.9231, "SPD": -0.0577 },
  "improvement": { "DIR": 0.3077, "SPD": 0.2115 },
  "minority_group": "female",
  "rows_added": 8
}
```

---

## 🧮 Bias Metrics Explained

| Metric | Formula | Fair range |
|--------|---------|------------|
| **DIR** | P(Y=1 \| unprivileged) / P(Y=1 \| privileged) | ≥ 0.8 (80% rule) |
| **SPD** | P(Y=1 \| unprivileged) − P(Y=1 \| privileged) | Close to 0 |

Risk classification:
- **HIGH**: DIR < 0.8
- **MEDIUM**: 0.8 ≤ DIR < 0.9
- **LOW**: DIR ≥ 0.9

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini Pro API key. If omitted, template fallback is used. |

---

## 🎯 Full Flow (React Integration)

```
POST /upload         → store CSV, get column names
POST /analyze        → get DIR, SPD, risk
POST /explain        → get plain-English description
POST /fix            → get before/after mitigation comparison
```

All endpoints are stateless except for the in-memory CSV store — upload must be called before analyze/explain/fix.
