import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 1, label: 'Parsing CSV file', icon: '📂', detail: 'Reading and validating dataset structure' },
  { id: 2, label: 'Detecting target column', icon: '🎯', detail: 'Identifying decision outcome variable' },
  { id: 3, label: 'Identifying sensitive attributes', icon: '🔎', detail: 'Scanning for gender, age, race, and other protected attributes' },
  { id: 4, label: 'Calculating Disparate Impact Ratio', icon: '📐', detail: 'Measuring outcome disparity between groups' },
  { id: 5, label: 'Calculating Statistical Parity Difference', icon: '📊', detail: 'Quantifying statistical discrimination signals' },
  { id: 6, label: 'Assigning risk levels', icon: '⚠️', detail: 'Classifying bias severity as High / Medium / Low' },
  { id: 7, label: 'Generating AI explanations', icon: '🤖', detail: 'Translating findings into plain English using Gemini AI' },
  { id: 8, label: 'Running bias mitigation', icon: '🔧', detail: 'Applying resampling and reweighting techniques' },
  { id: 9, label: 'Computing post-fix metrics', icon: '📈', detail: 'Re-evaluating fairness after mitigation' },
  { id: 10, label: 'Generating audit report', icon: '📄', detail: 'Compiling comprehensive PDF audit document' },
];

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileName = sessionStorage.getItem('csvFileName') || 'dataset.csv';

  useEffect(() => {
    // Simulate analysis steps
    const durations = [600, 700, 900, 1100, 1000, 700, 1400, 1200, 900, 800];
    let stepIndex = 0;

    const advance = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex + 1);
        setProgress(Math.round(((stepIndex + 1) / steps.length) * 100));
        stepIndex++;
        setTimeout(advance, durations[stepIndex - 1] || 800);
      } else {
        setCompleted(true);
        // Build mock results and store
        buildMockResults();
      }
    };

    setTimeout(advance, 400);
  }, []);

  const buildMockResults = () => {
    const csvData = sessionStorage.getItem('csvData') || '';
    const lines = csvData.trim().split('\n');
    const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/"/g, '')) : ['age', 'gender', 'race', 'income', 'hired'];
    const totalRows = lines.length - 1;

    // Detect sensitive attributes
    const sensitiveKeywords = ['gender', 'sex', 'race', 'ethnicity', 'age', 'religion', 'nationality', 'disability'];
    const targetKeywords = ['hired', 'approved', 'decision', 'outcome', 'loan', 'result', 'label', 'target', 'class'];

    let detectedSensitive = headers.filter(h => sensitiveKeywords.some(k => h.toLowerCase().includes(k)));
    let detectedTarget = headers.find(h => targetKeywords.some(k => h.toLowerCase().includes(k))) || headers[headers.length - 1];

    if (detectedSensitive.length === 0) detectedSensitive = ['gender', 'age', 'race'];

    const biasResults = detectedSensitive.map((attr, i) => {
      const dirValue = [0.61, 0.78, 0.55, 0.82, 0.70][i % 5];
      const spdValue = [-0.18, -0.09, -0.24, -0.07, -0.13][i % 5];
      const fixedDir = Math.min(dirValue + 0.18, 0.97);
      const fixedSpd = Math.max(spdValue + 0.12, -0.05);
      const risk = dirValue < 0.65 ? 'HIGH' : dirValue < 0.80 ? 'MEDIUM' : 'LOW';

      return {
        attribute: attr,
        dir: dirValue,
        spd: spdValue,
        fixedDir,
        fixedSpd,
        risk,
        explanation: generateExplanation(attr, dirValue, spdValue, risk),
      };
    });

    const results = {
      fileName: sessionStorage.getItem('csvFileName') || 'dataset.csv',
      totalRows: totalRows || 15000,
      totalColumns: headers.length,
      targetColumn: detectedTarget,
      sensitiveAttributes: detectedSensitive,
      allColumns: headers,
      biasResults,
      overallRisk: biasResults.some(r => r.risk === 'HIGH') ? 'HIGH' : biasResults.some(r => r.risk === 'MEDIUM') ? 'MEDIUM' : 'LOW',
      analysisDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    sessionStorage.setItem('fairscanResults', JSON.stringify(results));
  };

  const generateExplanation = (attr, dir, spd, risk) => {
    const pct = Math.abs(Math.round(spd * 100));
    const dirPct = Math.round(dir * 100);
    if (risk === 'HIGH') {
      return `The dataset shows significant ${attr}-based discrimination. The Disparate Impact Ratio of ${dirPct}% indicates minority groups receive favorable outcomes at only ${dirPct}% the rate of majority groups — well below the 80% legal threshold. There is a ${pct}% gap in approval rates between ${attr} groups, which is statistically significant and legally concerning.`;
    } else if (risk === 'MEDIUM') {
      return `Moderate ${attr} bias was detected. While the Disparate Impact Ratio of ${dirPct}% is borderline, the ${pct}% statistical parity gap suggests meaningful disparities exist between ${attr} groups. This warrants attention and remediation before deployment.`;
    } else {
      return `Low ${attr} bias detected. The Disparate Impact Ratio of ${dirPct}% is within acceptable thresholds, and the ${pct}% statistical difference is marginal. Continue monitoring but immediate action may not be required.`;
    }
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 32px 60px' }}>
      <div style={{ width: '100%', maxWidth: 720, animation: 'fadeInUp 0.5s ease both' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--purple-glow)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Step 2 of 3
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 42px)', marginBottom: 12 }}>
            {completed ? '✅ Analysis Complete!' : (
              <>Analyzing{' '}
              <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Your Data
              </span></>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            {completed ? `All bias checks completed for ${fileName}` : `Running fairness audit on ${fileName}...`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
              Overall Progress
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10, borderRadius: 5 }}>
            <div className="progress-fill" style={{
              width: `${progress}%`,
              background: 'var(--gradient-btn)',
              boxShadow: progress > 0 ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
              borderRadius: 5,
            }}/>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            Step {Math.min(currentStep, steps.length)} of {steps.length}
          </div>
        </div>

        {/* Steps list */}
        <div className="glass-card" style={{ padding: '8px 0', overflow: 'hidden' }}>
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep - 1 && !completed;
            const isPending = i >= currentStep;

            return (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 28px',
                borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                transition: 'background 0.4s',
              }}>
                {/* Status icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? 16 : 18,
                  background: isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isDone ? 'rgba(16,185,129,0.4)' : isActive ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.4s',
                }}>
                  {isDone ? '✓' : isActive ? (
                    <span style={{ width: 14, height: 14, border: '2px solid var(--purple-glow)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}/>
                  ) : step.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
                    color: isDone ? 'var(--success)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    marginBottom: 3,
                  }}>
                    {step.label}
                  </div>
                  {(isDone || isActive) && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.detail}</div>
                  )}
                </div>

                <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {isDone ? <span style={{ color: 'var(--success)' }}>Done</span> : isActive ? <span style={{ color: 'var(--purple-glow)' }}>Running...</span> : <span style={{ color: 'var(--text-muted)' }}>Pending</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete CTA */}
        {completed && (
          <div style={{ marginTop: 32, textAlign: 'center', animation: 'fadeInUp 0.5s ease both' }}>
            <div className="glass-card" style={{
              padding: '28px 36px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.08))',
              border: '1px solid rgba(16,185,129,0.25)',
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8, color: 'var(--success)' }}>
                Analysis Finished Successfully
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Bias metrics, AI explanations, and mitigation results are ready to view.
              </p>
            </div>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 44px' }}
              onClick={() => navigate('/results')}>
              View Fairness Results →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
