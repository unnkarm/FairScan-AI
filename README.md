# ⚖️ FairScan — Unbiased AI Decision Platform
> Detect, explain, and fix hidden bias in AI datasets

![FairScan](https://img.shields.io/badge/FairScan-v1.0.0-7c3aed?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 What is FairScan?

FairScan is a full-featured **AI Bias Detection and Fairness Auditing Platform**. Upload any CSV dataset and get:

- ✅ Automatic detection of sensitive attributes (gender, age, race, etc.)
- 📐 Fairness metrics: Disparate Impact Ratio (DIR) & Statistical Parity Difference (SPD)
- 🤖 AI-generated plain-English explanations via Gemini
- 🔧 Automated bias mitigation (resampling + reweighting)
- 📊 Before vs. After visual comparison
- 📄 Downloadable PDF audit report

---

## 🗂️ Project Structure

```
fairscan/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Navbar.js          ← Fixed navbar with route highlighting
│   ├── pages/
│   │   ├── LandingPage.js     ← Hero, features, workflow overview
│   │   ├── UploadPage.js      ← CSV drag-and-drop uploader with preview
│   │   ├── AnalysisPage.js    ← Animated step-by-step processing view
│   │   └── ResultsPage.js     ← Full dashboard: metrics, charts, AI insights
│   ├── App.js                 ← Router setup
│   ├── index.js               ← Entry point
│   └── index.css              ← Global design system & variables
├── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ How to Run Locally

### Prerequisites
- **Node.js** v16 or higher → https://nodejs.org
- **npm** (comes with Node.js)

### Step-by-Step

```bash
# 1. Navigate into the project folder
cd fairscan

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

The app will open at **http://localhost:3000** automatically.

> **Build for production:**
> ```bash
> npm run build
> ```
> This creates a `build/` folder with optimized static files.

---

## 🔗 Backend Integration

The frontend is designed to connect to your backend API. Here's where to add your API calls:

### In `UploadPage.js` — File Upload
Replace the mock `handleAnalyze` function with a real API call:

```javascript
const handleAnalyze = async () => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  sessionStorage.setItem('jobId', data.job_id);
  navigate('/analysis');
};
```

### In `AnalysisPage.js` — Poll for Progress
Replace the `setTimeout` loop with real polling:

```javascript
const pollStatus = async (jobId) => {
  const response = await fetch(`http://localhost:8000/api/status/${jobId}`);
  const data = await response.json();
  setCurrentStep(data.current_step);
  if (data.status === 'complete') {
    sessionStorage.setItem('fairscanResults', JSON.stringify(data.results));
    navigate('/results');
  }
};
```

### In `ResultsPage.js` — Display Results
The results are read from `sessionStorage.getItem('fairscanResults')`.
Your backend should store results in this format:

```json
{
  "fileName": "dataset.csv",
  "totalRows": 15000,
  "totalColumns": 12,
  "targetColumn": "hired",
  "sensitiveAttributes": ["gender", "age", "race"],
  "overallRisk": "HIGH",
  "analysisDate": "April 24, 2025",
  "biasResults": [
    {
      "attribute": "gender",
      "dir": 0.61,
      "spd": -0.18,
      "fixedDir": 0.84,
      "fixedSpd": -0.04,
      "risk": "HIGH",
      "explanation": "Plain English explanation from Gemini AI..."
    }
  ]
}
```

---

## 🌿 GitHub Workflow (For Team)

### Initial Setup (One-time)
```bash
# Clone the repo
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO

# See existing branches
git branch -a
```

### Pushing Frontend to a New Branch

```bash
# 1. Create and switch to your frontend branch
git checkout -b frontend

# 2. Copy the fairscan folder into the repo
# (or run these commands from inside the repo)

# 3. Stage all frontend files
git add .

# 4. Commit with a message
git commit -m "feat: add FairScan frontend (React, routing, upload, analysis, results)"

# 5. Push to GitHub
git push origin frontend
```

### Merging into Main (Team Lead does this)
```bash
# Switch to main
git checkout main

# Merge frontend branch
git merge frontend

# Push merged main
git push origin main
```

### Staying in Sync with Backend Branch
```bash
# See what's in the backend branch
git fetch origin
git checkout backend
git pull origin backend
```

---

## 🎨 Design System

The app uses CSS custom properties defined in `index.css`:

| Variable | Value | Use |
|---|---|---|
| `--gradient-btn` | Purple → Blue | Primary buttons |
| `--gradient-accent` | Purple → Cyan | Gradient text |
| `--bg-deep` | `#08081a` | Page background |
| `--bg-glass` | rgba white 4% | Glass cards |
| `--font-display` | Syne | Headings & labels |
| `--font-body` | DM Sans | Body text |

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` | Multi-page routing |
| `recharts` | Bar, Radar charts for metrics |
| `react-dropzone` | CSV file drag-and-drop |
| `axios` | HTTP requests to backend |
| `framer-motion` | Animations (optional enhancement) |

---

## 🤝 Team Responsibilities

| Person | Branch | Responsibility |
|---|---|---|
| **You (Frontend)** | `frontend` | This entire React app |
| **Backend Dev** | `backend` | FastAPI/Django + bias analysis endpoints |
| **ML Dev** | `ml` or `main` | Bias metrics, Gemini AI, mitigation algorithms |

---

## 📄 License

MIT © 2025 FairScan Team
