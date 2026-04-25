# FairScan AI — Integrated Project

**Bias Audit & Fix Tool** — Upload a CSV dataset, measure algorithmic bias (Disparate Impact Ratio + Statistical Parity Difference), get AI-powered explanations via Gemini, and apply bias mitigation — all through a polished React frontend backed by a FastAPI + ML model.

---

## Project Structure

```
FairScan-AI-integrated/
├── backend/                  # FastAPI backend + ML model
│   ├── main.py               # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── render.yaml           # Render deployment config
│   ├── .env.example
│   ├── sample_data.csv       # Example dataset to test with
│   ├── ml/                   # ML model (bias_metrics + bias_fix)
│   │   ├── bias_metrics.py   # Core DIR/SPD computation
│   │   └── bias_fix.py       # Reweighting-based mitigation
│   ├── routes/
│   │   ├── upload.py         # POST /upload
│   │   ├── analysis.py       # POST /analyze, POST /explain
│   │   └── fix.py            # POST /fix
│   ├── services/
│   │   ├── bias_metrics.py   # Wraps ml/bias_metrics.py
│   │   ├── mitigation.py     # Oversampling mitigation
│   │   └── explanation.py    # Gemini AI explanation
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   └── utils/
│       └── helpers.py        # In-memory store, validation, math
│
└── frontend/                 # React frontend (Create React App)
    ├── src/
    │   ├── App.js
    │   ├── index.js / index.css
    │   ├── pages/
    │   │   ├── LandingPage.js
    │   │   ├── UploadPage.js
    │   │   ├── AnalysisPage.js  # Calls real backend API
    │   │   └── ResultsPage.js
    │   └── components/
    │       └── Navbar.js
    ├── public/index.html
    ├── package.json
    ├── vercel.json           # Vercel deployment config
    └── .env.example
```

---

## Running Locally

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # macOS/Linux
# OR: venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your Gemini API key (optional — app works without it)
# GEMINI_API_KEY=your_key_here

# Start the backend
uvicorn main:app --reload --port 8000
```

Backend will be live at: **http://localhost:8000**
API docs available at: **http://localhost:8000/docs**

---

### 2. Frontend Setup

Open a **new terminal tab**:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# .env already contains: REACT_APP_BACKEND_URL=http://localhost:8000

# Start the frontend
npm start
```

Frontend will open at: **http://localhost:3000**

---

### 3. Usage Flow

1. Open **http://localhost:3000**
2. Click **"Get Started"** → Upload a CSV file (use `backend/sample_data.csv` to test)
3. The app uploads to the backend, runs bias analysis, and displays results
4. View **Disparate Impact Ratio**, **Statistical Parity Difference**, risk levels, and before/after mitigation comparison

---

## Deployment

### Backend → Render (Free Tier)

1. Push the `backend/` folder to a GitHub repository

2. Go to [render.com](https://render.com) → **New Web Service**

3. Connect your GitHub repo

4. Fill in:
   - **Root directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Python 3

5. Under **Environment Variables**, add:
   ```
   GEMINI_API_KEY = your_gemini_api_key_here
   ```
   *(Skip if you don't have a key — the app uses a fallback explanation.)*

6. Click **Deploy** — Render will give you a URL like `https://fairscan-backend.onrender.com`

---

### Frontend → Vercel

1. Push the `frontend/` folder to a GitHub repository (can be the same repo)

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo

3. Set the **Root Directory** to `frontend`

4. Under **Environment Variables**, add:
   ```
   REACT_APP_BACKEND_URL = https://fairscan-backend.onrender.com
   ```
   *(Replace with your actual Render URL from the step above.)*

5. Click **Deploy** — Vercel will give you a URL like `https://fairscan.vercel.app`

---

### Post-Deployment: Update CORS (Optional Hardening)

Once deployed, update `backend/main.py` to restrict CORS to your Vercel domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fairscan.vercel.app"],  # your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy the backend on Render.

---

## API Reference

| Method | Endpoint  | Description |
|--------|-----------|-------------|
| POST   | /upload   | Upload CSV, returns columns + preview |
| POST   | /analyze  | Compute DIR, SPD, risk for a sensitive attribute |
| POST   | /explain  | Generate Gemini AI explanation of bias metrics |
| POST   | /fix      | Apply oversampling mitigation, return before/after |
| GET    | /health   | Liveness check |
| GET    | /docs     | Interactive Swagger UI |

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `GEMINI_API_KEY` | backend `.env` | Google Gemini API key (optional) |
| `REACT_APP_BACKEND_URL` | frontend `.env` | Backend API base URL |
