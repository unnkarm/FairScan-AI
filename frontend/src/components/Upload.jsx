import { useState, useRef } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${BASE_URL}/upload`, formData);
  return res.data;
};

const analyzeCSV = async (payload) => {
  const res = await axios.post(`${BASE_URL}/analyze`, payload);
  return res.data;
};

const explainBias = async (payload) => {
  const res = await axios.post(`${BASE_URL}/explain`, payload);
  return res.data;
};

const fixBias = async (payload) => {
  const res = await axios.post(`${BASE_URL}/fix`, payload);
  return res.data;
};

const SENSITIVE_PATTERNS = /gender|sex|race|age|ethnicity|caste|religion|nationality|disability/i;
const TARGET_PATTERNS = /target|label|default|risk|output|class|hired|approved|accepted|decision|outcome/i;

function RiskBadge({ risk }) {
  const map = {
    HIGH: { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", label: "HIGH RISK" },
    MEDIUM: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d", label: "MEDIUM RISK" },
    LOW: { bg: "#f0fdf4", color: "#166534", border: "#86efac", label: "LOW RISK" },
  };
  const s = map[risk] || map.LOW;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: "20px", padding: "3px 12px", fontSize: "11px",
      fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace"
    }}>{s.label}</span>
  );
}

function MetricBar({ label, value, max = 2, color }) {
  const pct = Math.min(Math.abs(value) / max * 100, 100);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", fontFamily: "'DM Mono', monospace" }}>{typeof value === "number" ? value.toFixed(4) : value}</span>
      </div>
      <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  );
}

function StepIndicator({ step }) {
  const steps = ["Upload", "Analyze", "Fix", "Report"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "32px" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: i < step ? "#4f46e5" : i === step ? "#4f46e5" : "#e5e7eb",
            color: i <= step ? "white" : "#9ca3af",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 600, flexShrink: 0,
            boxShadow: i === step ? "0 0 0 4px rgba(79,70,229,0.15)" : "none",
            transition: "all 0.3s ease"
          }}>
            {i < step ? "✓" : i + 1}
          </div>
          <div style={{ fontSize: "11px", color: i <= step ? "#4f46e5" : "#9ca3af", marginLeft: "6px", fontWeight: i === step ? 600 : 400, whiteSpace: "nowrap" }}>{s}</div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: "1px", background: i < step ? "#4f46e5" : "#e5e7eb", margin: "0 12px", transition: "background 0.3s ease" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [step, setStep] = useState(0);
  const [columns, setColumns] = useState([]);
  const [preview, setPreview] = useState([]);
  const [targetCol, setTargetCol] = useState("");
  const [sensitiveCol, setSensitiveCol] = useState("");
  const [privVal, setPrivVal] = useState("");
  const [unprivVal, setUnprivVal] = useState("");
  const [availableValues, setAvailableValues] = useState([]);
  const [result, setResult] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f || !f.name.endsWith(".csv")) { setError("Please select a .csv file."); return; }
    setFile(f); setError(""); setResult(null); setFixResult(null); setStep(0);
    setColumns([]); setPreview([]);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file) { setError("Please select a CSV file first."); return; }
    setLoading(true); setError(""); setResult(null); setFixResult(null);
    try {
      const up = await uploadCSV(file);
      setColumns(up.columns);
      setPreview(up.preview || []);

      const detectedTarget = up.columns.find(c => TARGET_PATTERNS.test(c)) || up.columns[up.columns.length - 1];
      const detectedSensitive = up.columns.find(c => SENSITIVE_PATTERNS.test(c)) || up.columns[0];

      setTargetCol(detectedTarget);
      setSensitiveCol(detectedSensitive);

      const vals = [...new Set((up.preview || []).map(r => String(r?.[detectedSensitive] ?? "")).filter(v => v.trim()))];
      setAvailableValues(vals);
      setPrivVal(vals[0] || "");
      setUnprivVal(vals[1] || "");
      setStep(1);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Upload failed.");
    }
    setLoading(false);
  };

  const handleSensitiveChange = (col) => {
    setSensitiveCol(col);
    const vals = [...new Set(preview.map(r => String(r?.[col] ?? "")).filter(v => v.trim()))];
    setAvailableValues(vals);
    setPrivVal(vals[0] || "");
    setUnprivVal(vals[1] || "");
  };

  const handleAnalyze = async () => {
    if (!targetCol || !sensitiveCol || !privVal || !unprivVal) { setError("Please configure all fields."); return; }
    if (privVal === unprivVal) { setError("Privileged and unprivileged values must be different."); return; }
    setLoading(true); setError("");
    try {
      const payload = { target_column: targetCol, sensitive_column: sensitiveCol, privileged_value: privVal, unprivileged_value: unprivVal };
      const metrics = await analyzeCSV(payload);

      let explanation = "";
      try {
        const exp = await explainBias({ ...payload, DIR: metrics.DIR, SPD: metrics.SPD, risk: metrics.risk });
        explanation = exp.explanation;
      } catch (_) {
        explanation = `People in the '${unprivVal}' group receive a positive outcome differently than the '${privVal}' group. DIR of ${metrics.DIR?.toFixed(2)} indicates ${metrics.risk?.toLowerCase()} bias risk.`;
      }

      setResult({ ...metrics, explanation });
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Analysis failed.");
    }
    setLoading(false);
  };

  const handleFix = async () => {
    setFixing(true); setError("");
    try {
      const payload = { target_column: targetCol, sensitive_column: sensitiveCol, privileged_value: privVal, unprivileged_value: unprivVal };
      const fix = await fixBias(payload);
      setFixResult(fix);
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Fix failed.");
    }
    setFixing(false);
  };

  const handleDownloadReport = () => {
    if (!result) return;
    const lines = [
      "FAIRSCAN AI — BIAS AUDIT REPORT",
      "=".repeat(50),
      `Generated: ${new Date().toLocaleString()}`,
      `File: ${file?.name}`,
      "",
      "DATASET CONFIGURATION",
      "-".repeat(30),
      `Target Column: ${targetCol}`,
      `Sensitive Attribute: ${sensitiveCol}`,
      `Privileged Group: ${privVal}`,
      `Unprivileged Group: ${unprivVal}`,
      "",
      "BIAS METRICS (BEFORE FIX)",
      "-".repeat(30),
      `Disparate Impact Ratio (DIR): ${result.DIR}`,
      `Statistical Parity Difference (SPD): ${result.SPD}`,
      `Privileged Group Selection Rate: ${result.privileged_rate}`,
      `Unprivileged Group Selection Rate: ${result.unprivileged_rate}`,
      `Risk Level: ${result.risk}`,
      "",
      "AI EXPLANATION",
      "-".repeat(30),
      result.explanation || "N/A",
      "",
    ];

    if (fixResult) {
      lines.push(
        "BIAS MITIGATION RESULTS",
        "-".repeat(30),
        `Technique Applied: Oversampling (minority group rebalancing)`,
        `Minority Group Resampled: ${fixResult.minority_group}`,
        `Rows Added: ${fixResult.rows_added}`,
        "",
        "BEFORE vs AFTER",
        `DIR:  ${fixResult.before?.DIR?.toFixed(4)}  →  ${fixResult.after?.DIR?.toFixed(4)}  (Δ ${fixResult.improvement?.DIR > 0 ? "+" : ""}${fixResult.improvement?.DIR?.toFixed(4)})`,
        `SPD:  ${fixResult.before?.SPD?.toFixed(4)}  →  ${fixResult.after?.SPD?.toFixed(4)}  (Δ ${fixResult.improvement?.SPD > 0 ? "+" : ""}${fixResult.improvement?.SPD?.toFixed(4)})`,
        "",
      );
    }

    lines.push(
      "=".repeat(50),
      "FairScan AI | Ensuring Fairness in Automated Decisions",
    );

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fairscan-report-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const dirColor = result ? (result.DIR < 0.8 ? "#ef4444" : result.DIR < 0.9 ? "#f59e0b" : "#10b981") : "#4f46e5";
  const afterDirColor = fixResult ? (fixResult.after?.DIR < 0.8 ? "#ef4444" : fixResult.after?.DIR < 0.9 ? "#f59e0b" : "#10b981") : "#10b981";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0f2027 100%)", fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .card { background: rgba(255,255,255,0.97); border-radius: 20px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1); animation: fadeUp 0.4s ease; }
        .btn-primary { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border: none; border-radius: 12px; padding: "12px 28px"; font-size: "14px"; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,70,229,0.4); }
        .btn-primary:active { transform: translateY(0); }
        .btn-secondary { background: white; color: #374151; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: "12px 28px"; font-size: "14px"; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
        .btn-secondary:hover { border-color: #4f46e5; color: #4f46e5; }
        .select-field { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: "10px 14px"; font-size: "14px"; width: "100%"; outline: none; transition: border 0.2s; background: white; color: #111827; }
        .select-field:focus { border-color: #4f46e5; }
        .drop-zone { border: 2px dashed rgba(255,255,255,0.25); border-radius: 16px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s ease; background: rgba(255,255,255,0.05); }
        .drop-zone:hover, .drop-zone.active { border-color: #818cf8; background: rgba(129,140,248,0.1); }
        .metric-card { background: #f8fafc; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; }
        .improvement-badge { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 8px; padding: "4px 10px"; font-size: "12px"; font-weight: 600; font-family: 'DM Mono', monospace; }
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "20px", color: "white", letterSpacing: "-0.02em" }}>FairScan AI</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>Bias Detection & Mitigation</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 40px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: "20px", padding: "6px 16px", marginBottom: "20px" }}>
            <div style={{ width: "6px", height: "6px", background: "#818cf8", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: 500 }}>AI-Powered Fairness Analysis</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Detect & Fix Bias<br />
            <span style={{ background: "linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in Your Datasets</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", maxWidth: "520px", margin: "0 auto", lineHeight: 1.7 }}>
            Upload any CSV. We automatically detect sensitive attributes, measure fairness metrics, and generate an audit report — no code required.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <StepIndicator step={step} />

          {/* STEP 0: Upload */}
          {step === 0 && (
            <div>
              <div
                className={`drop-zone${dragOver ? " active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                <div style={{ marginBottom: "12px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" style={{ margin: "0 auto", display: "block" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                {file ? (
                  <div>
                    <p style={{ color: "white", fontWeight: 600, margin: "0 0 4px" }}>{file.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, margin: "0 0 4px" }}>Drop your CSV here or click to browse</p>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 }}>Supports any CSV with headers</p>
                  </div>
                )}
              </div>

              {error && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>{error}</p>}

              <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={loading || !file}
                  style={{ padding: "13px 36px", fontSize: "15px", fontWeight: 600, opacity: (!file || loading) ? 0.6 : 1, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: "12px", cursor: file && !loading ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {loading ? <><Spinner /> Processing...</> : "Upload & Detect Columns"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Configure */}
          {step === 1 && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 600, color: "#111827" }}>Configure Analysis</h3>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px" }}>We auto-detected your columns. Verify or change them below.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Target Column (Outcome)</label>
                  <select className="select-field" value={targetCol} onChange={e => setTargetCol(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", background: "white", color: "#111827" }}>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sensitive Attribute</label>
                  <select className="select-field" value={sensitiveCol} onChange={e => handleSensitiveChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", background: "white", color: "#111827" }}>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Privileged Group Value</label>
                  <select className="select-field" value={privVal} onChange={e => setPrivVal(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", background: "white", color: "#111827" }}>
                    {availableValues.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unprivileged Group Value</label>
                  <select className="select-field" value={unprivVal} onChange={e => setUnprivVal(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", background: "white", color: "#111827" }}>
                    {availableValues.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div style={{ marginBottom: "24px", overflowX: "auto", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {columns.slice(0, 6).map(c => (
                          <th key={c} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 3).map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          {columns.slice(0, 6).map(c => (
                            <td key={c} style={{ padding: "8px 14px", color: "#6b7280" }}>{String(row[c] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {error && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => { setStep(0); setFile(null); }} style={{ padding: "12px 24px", borderRadius: "12px", border: "1.5px solid #e5e7eb", background: "white", color: "#374151", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>
                  ← Back
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{ flex: 1, padding: "12px 24px", borderRadius: "12px", background: loading ? "#e5e7eb" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: loading ? "#9ca3af" : "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {loading ? <><Spinner /> Analyzing...</> : "Run Bias Analysis →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Results */}
          {step >= 2 && result && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600, color: "#111827" }}>Bias Analysis Results</h3>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>{sensitiveCol} · {privVal} vs {unprivVal}</p>
                </div>
                <RiskBadge risk={result.risk} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "DIR", value: result.DIR?.toFixed(4), sub: "≥0.9 = fair", color: dirColor },
                  { label: "SPD", value: result.SPD?.toFixed(4), sub: "≈0 = fair", color: "#6366f1" },
                  { label: "Privileged Rate", value: (result.privileged_rate * 100)?.toFixed(1) + "%", sub: privVal, color: "#8b5cf6" },
                  { label: "Unprivileged Rate", value: (result.unprivileged_rate * 100)?.toFixed(1) + "%", sub: unprivVal, color: "#ec4899" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: 700, color: m.color, margin: "0 0 4px", fontFamily: "'DM Mono', monospace" }}>{m.value}</p>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>{m.sub}</p>
                  </div>
                ))}
              </div>

              <MetricBar label="Disparate Impact Ratio" value={result.DIR} max={2} color={dirColor} />
              <MetricBar label="Statistical Parity Difference (abs)" value={Math.abs(result.SPD)} max={1} color="#6366f1" />

              {result.explanation && (
                <div style={{ background: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ width: "28px", height: "28px", background: "#4f46e5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#4338ca", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Explanation</p>
                      <p style={{ fontSize: "14px", color: "#3730a3", margin: 0, lineHeight: 1.6 }}>{result.explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Before/After if fix done */}
              {fixResult && step >= 3 && (
                <div style={{ marginTop: "20px", animation: "fadeUp 0.4s ease" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "#111827" }}>Before vs After Mitigation</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "16px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#991b1b", margin: "0 0 10px", textTransform: "uppercase" }}>Before</p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#374151", margin: "0 0 4px" }}>DIR: <strong>{fixResult.before?.DIR?.toFixed(4)}</strong></p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#374151", margin: 0 }}>SPD: <strong>{fixResult.before?.SPD?.toFixed(4)}</strong></p>
                    </div>
                    <div style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: "14px", padding: "16px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#065f46", margin: "0 0 10px", textTransform: "uppercase" }}>After</p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#374151", margin: "0 0 4px" }}>
                        DIR: <strong style={{ color: afterDirColor }}>{fixResult.after?.DIR?.toFixed(4)}</strong>
                        {fixResult.improvement?.DIR > 0 && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#065f46" }}>+{fixResult.improvement?.DIR?.toFixed(4)}</span>}
                      </p>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#374151", margin: 0 }}>
                        SPD: <strong>{fixResult.after?.SPD?.toFixed(4)}</strong>
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", background: "#f0fdf4", borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "#065f46" }}>Technique: <strong>Oversampling</strong></span>
                    <span style={{ fontSize: "13px", color: "#065f46" }}>Group: <strong>{fixResult.minority_group}</strong></span>
                    <span style={{ fontSize: "13px", color: "#065f46" }}>Rows added: <strong>{fixResult.rows_added}</strong></span>
                  </div>
                </div>
              )}

              {error && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px" }}>{error}</p>}

              <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                <button onClick={() => { setStep(0); setFile(null); setResult(null); setFixResult(null); }} style={{ padding: "11px 20px", borderRadius: "12px", border: "1.5px solid #e5e7eb", background: "white", color: "#374151", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>
                  New Analysis
                </button>
                {!fixResult && (
                  <button
                    onClick={handleFix}
                    disabled={fixing}
                    style={{ flex: 1, padding: "11px 20px", borderRadius: "12px", background: fixing ? "#e5e7eb" : "linear-gradient(135deg, #059669, #10b981)", color: fixing ? "#9ca3af" : "white", fontWeight: 600, cursor: fixing ? "not-allowed" : "pointer", fontSize: "14px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    {fixing ? <><Spinner /> Applying Fix...</> : "Apply Bias Mitigation →"}
                  </button>
                )}
                <button
                  onClick={handleDownloadReport}
                  style={{ padding: "11px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #1e1b4b, #312e81)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "14px", border: "none", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "0" }}>
          {[
            { icon: "🔍", title: "Auto-Detection", desc: "Sensitive columns detected automatically" },
            { icon: "📊", title: "DIR & SPD Metrics", desc: "Industry-standard fairness measurements" },
            { icon: "🔧", title: "Bias Mitigation", desc: "Oversampling to balance your dataset" },
            { icon: "📄", title: "Audit Report", desc: "Downloadable report for compliance" },
          ].map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", backdropFilter: "blur(10px)" }}>
              <div style={{ fontSize: "22px", marginBottom: "8px" }}>{f.icon}</div>
              <p style={{ color: "white", fontWeight: 600, fontSize: "14px", margin: "0 0 4px" }}>{f.title}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
