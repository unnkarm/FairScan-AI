import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const RiskBadge = ({ risk }) => {
  const map = {
    HIGH: { class: 'badge-high', label: '🔴 HIGH RISK' },
    MEDIUM: { class: 'badge-medium', label: '🟡 MEDIUM RISK' },
    LOW: { class: 'badge-low', label: '🟢 LOW RISK' },
  };
  const cfg = map[risk] || map.LOW;
  return <span className={`badge ${cfg.class}`} style={{ fontSize: 13, padding: '6px 14px' }}>{cfg.label}</span>;
};

const MetricCard = ({ label, before, after, unit = '', higherBetter = false, description }) => {
  const improved = higherBetter ? after > before : after < Math.abs(before);
  const change = higherBetter
    ? (((after - before) / Math.abs(before)) * 100).toFixed(1)
    : (((Math.abs(before) - Math.abs(after)) / Math.abs(before)) * 100).toFixed(1);

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Before</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#f87171' }}>
            {typeof before === 'number' ? before.toFixed(2) : before}{unit}
          </div>
        </div>
        <div style={{ fontSize: 22, color: 'var(--text-muted)' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>After</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#34d399' }}>
            {typeof after === 'number' ? after.toFixed(2) : after}{unit}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            padding: '6px 12px', borderRadius: '999px',
            background: improved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${improved ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: improved ? '#34d399' : '#f87171',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
          }}>
            {improved ? '▲' : '▼'} {change}%
          </div>
        </div>
      </div>
      {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,15,42,0.95)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 4 }}>
            {p.name}: <strong>{p.value.toFixed(3)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ResultsPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAttr, setExpandedAttr] = useState(0);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('fairscanResults');
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      // Demo data fallback
      setResults({
        fileName: 'demo_hiring_data.csv',
        totalRows: 15420,
        totalColumns: 12,
        targetColumn: 'hired',
        sensitiveAttributes: ['gender', 'age', 'race'],
        analysisDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        overallRisk: 'HIGH',
        biasResults: [
          { attribute: 'gender', dir: 0.61, spd: -0.18, fixedDir: 0.84, fixedSpd: -0.04, risk: 'HIGH', explanation: 'The dataset shows significant gender-based discrimination. The Disparate Impact Ratio of 61% indicates female applicants receive favorable hiring outcomes at only 61% the rate of male applicants — well below the 80% legal threshold. There is an 18% gap in approval rates between gender groups, which is statistically significant and legally concerning.' },
          { attribute: 'age', dir: 0.78, spd: -0.09, fixedDir: 0.91, fixedSpd: -0.02, risk: 'MEDIUM', explanation: 'Moderate age bias was detected. While the Disparate Impact Ratio of 78% is borderline, the 9% statistical parity gap suggests meaningful disparities exist between age groups. Younger candidates appear to be disadvantaged in certain roles. This warrants attention before deployment.' },
          { attribute: 'race', dir: 0.55, spd: -0.24, fixedDir: 0.81, fixedSpd: -0.05, risk: 'HIGH', explanation: 'The dataset shows very significant racial discrimination. The DIR of 55% and 24% SPD gap are the most severe in this analysis. Minority racial groups are approved at barely half the rate of majority groups. Immediate remediation is strongly recommended before using this data in any automated decision system.' },
        ],
      });
    }
  }, []);

  if (!results) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>Loading results...</span>
    </div>
  );

  const dirChartData = results.biasResults.map(r => ({
    name: r.attribute,
    'Before Fix': parseFloat(r.dir.toFixed(3)),
    'After Fix': parseFloat(r.fixedDir.toFixed(3)),
    'Threshold (0.8)': 0.8,
  }));

  const spdChartData = results.biasResults.map(r => ({
    name: r.attribute,
    'Before Fix': parseFloat(r.spd.toFixed(3)),
    'After Fix': parseFloat(r.fixedSpd.toFixed(3)),
  }));

  const radarData = results.biasResults.map(r => ({
    attribute: r.attribute,
    'Before': Math.round(r.dir * 100),
    'After': Math.round(r.fixedDir * 100),
    fullMark: 100,
  }));

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'metrics', label: '📐 Metrics' },
    { id: 'charts', label: '📈 Charts' },
    { id: 'ai', label: '🤖 AI Insights' },
    { id: 'fix', label: '🔧 Before vs After' },
  ];

  const handleDownloadPDF = () => {
    setPdfGenerating(true);
    setTimeout(() => {
      // Generate a simple text-based audit report as download
      const report = generateTextReport(results);
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FairScan_Audit_Report_${results.fileName.replace('.csv', '')}_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfGenerating(false);
    }, 1500);
  };

  const generateTextReport = (r) => {
    const divider = '═'.repeat(70);
    const thin = '─'.repeat(70);
    return `
${divider}
  FAIRSCAN — AI BIAS AUDIT REPORT
  Ensuring Fairness in Automated Decisions
${divider}

Report Generated: ${r.analysisDate}
Dataset: ${r.fileName}
Total Records: ${r.totalRows?.toLocaleString()}
Total Columns: ${r.totalColumns}
Target Column: ${r.targetColumn}
Sensitive Attributes: ${r.sensitiveAttributes?.join(', ')}
Overall Risk Level: ${r.overallRisk}

${thin}
EXECUTIVE SUMMARY
${thin}

This audit analyzed "${r.fileName}" for algorithmic bias and discrimination
across ${r.sensitiveAttributes?.length} sensitive attribute(s). 

Overall Risk Assessment: ${r.overallRisk}
${r.overallRisk === 'HIGH' ? '⚠ IMMEDIATE ACTION REQUIRED: High-severity bias detected. Do not deploy this\n  model or dataset without remediation.' : r.overallRisk === 'MEDIUM' ? '⚡ CAUTION: Moderate bias detected. Review and mitigate before deployment.' : '✓ ACCEPTABLE: Low bias levels detected. Continue monitoring.'}

${thin}
DETAILED BIAS ANALYSIS
${thin}

${r.biasResults?.map((b, i) => `
[${i + 1}] ATTRIBUTE: ${b.attribute.toUpperCase()}
    Risk Level: ${b.risk}
    
    Disparate Impact Ratio (DIR):
      Before Mitigation: ${b.dir.toFixed(3)} (${b.dir < 0.8 ? 'BELOW' : 'ABOVE'} 0.8 legal threshold)
      After Mitigation:  ${b.fixedDir.toFixed(3)} (${b.fixedDir >= 0.8 ? 'ABOVE' : 'BELOW'} 0.8 legal threshold)
      Improvement: ${(((b.fixedDir - b.dir) / b.dir) * 100).toFixed(1)}%
    
    Statistical Parity Difference (SPD):
      Before Mitigation: ${b.spd.toFixed(3)}
      After Mitigation:  ${b.fixedSpd.toFixed(3)}
      Improvement: ${(((Math.abs(b.spd) - Math.abs(b.fixedSpd)) / Math.abs(b.spd)) * 100).toFixed(1)}%
    
    AI Explanation:
    ${b.explanation}
`).join('\n')}

${thin}
FAIRNESS METRICS GLOSSARY
${thin}

Disparate Impact Ratio (DIR):
  Ratio of favorable outcome rates between minority and majority groups.
  DIR < 0.8 indicates potential legal violation (80% rule / 4/5ths rule).
  DIR = 1.0 means perfect parity between groups.

Statistical Parity Difference (SPD):
  Difference in positive outcome rates between protected groups.
  SPD = 0.0 means no statistical disparity between groups.
  SPD < -0.1 indicates significant disparity requiring attention.

${thin}
MITIGATION TECHNIQUES APPLIED
${thin}

1. Resampling: Oversampled underrepresented groups to balance training data
2. Reweighting: Applied instance weights to reduce bias in learning
3. Post-processing: Adjusted decision thresholds for fairness

${thin}
RECOMMENDATIONS
${thin}

${r.biasResults?.filter(b => b.risk === 'HIGH').length > 0 ? `HIGH PRIORITY (Immediate Action Required):
${r.biasResults?.filter(b => b.risk === 'HIGH').map(b => `  • Address ${b.attribute} bias — DIR ${b.dir.toFixed(2)} is below the 80% legal threshold`).join('\n')}` : ''}

${r.biasResults?.filter(b => b.risk === 'MEDIUM').length > 0 ? `MEDIUM PRIORITY (Address Before Deployment):
${r.biasResults?.filter(b => b.risk === 'MEDIUM').map(b => `  • Review ${b.attribute} bias — monitor and mitigate`).join('\n')}` : ''}

General Recommendations:
  • Regularly re-audit datasets as new data is collected
  • Implement ongoing fairness monitoring in production
  • Engage diverse stakeholders in model review processes
  • Document bias mitigation decisions for compliance purposes

${divider}
  This report was generated by FairScan — Unbiased AI Decision Platform
  For questions contact your data science or compliance team.
${divider}
    `.trim();
  };

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', padding: '90px 24px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 36, animation: 'fadeInUp 0.5s ease both' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--purple-glow)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Step 3 of 3 — Results
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 40px)', marginBottom: 10 }}>
              Fairness Audit Report
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>📁 {results.fileName}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>·</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>🗓 {results.analysisDate}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>·</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>📊 {results.totalRows?.toLocaleString()} rows</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <RiskBadge risk={results.overallRisk} />
            <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}>
              {pdfGenerating ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}/> Generating...</>
              ) : '⬇ Download Report'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32,
          animation: 'fadeInUp 0.5s 0.1s ease both',
        }}>
          {[
            { label: 'Records Analyzed', value: results.totalRows?.toLocaleString(), icon: '📋' },
            { label: 'Sensitive Attributes', value: results.sensitiveAttributes?.length, icon: '🔎' },
            { label: 'High Risk Findings', value: results.biasResults?.filter(b => b.risk === 'HIGH').length, icon: '🔴' },
            { label: 'Overall Risk', value: results.overallRisk, icon: '⚖️' },
          ].map((card, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 4, background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {card.value}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap', animation: 'fadeInUp 0.5s 0.15s ease both' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '9px 18px', borderRadius: '999px',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              background: activeTab === tab.id ? 'var(--gradient-btn)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeTab === tab.id ? 'transparent' : 'var(--border)'}`,
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.3s',
              boxShadow: activeTab === tab.id ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* TAB: Overview */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {results.biasResults?.map((b, i) => (
                <div key={i} className="glass-card" style={{
                  padding: '24px 28px', cursor: 'pointer',
                  borderColor: expandedAttr === i ? 'var(--border-bright)' : 'var(--border)',
                }} onClick={() => setExpandedAttr(expandedAttr === i ? -1 : i)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: b.risk === 'HIGH' ? 'rgba(239,68,68,0.2)' : b.risk === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                        border: `1px solid ${b.risk === 'HIGH' ? 'rgba(239,68,68,0.4)' : b.risk === 'MEDIUM' ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>
                        {b.risk === 'HIGH' ? '🔴' : b.risk === 'MEDIUM' ? '🟡' : '🟢'}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, textTransform: 'capitalize', marginBottom: 4 }}>{b.attribute}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          DIR: {b.dir.toFixed(2)} · SPD: {b.spd.toFixed(2)} · Target: {results.targetColumn}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <RiskBadge risk={b.risk} />
                      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{expandedAttr === i ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* DIR progress */}
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Disparate Impact Ratio</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: b.dir < 0.8 ? '#f87171' : '#34d399' }}>
                        {b.dir.toFixed(2)} {b.dir < 0.8 ? '(Below 0.8 threshold)' : '(Above threshold)'}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${b.dir * 100}%`,
                        background: b.dir < 0.65 ? 'linear-gradient(90deg, #ef4444, #f87171)' : b.dir < 0.8 ? 'linear-gradient(90deg, #f59e0b, #fcd34d)' : 'linear-gradient(90deg, #10b981, #34d399)',
                      }}/>
                    </div>
                  </div>

                  {expandedAttr === i && (
                    <div style={{ marginTop: 20, padding: '18px 20px', background: 'rgba(124,58,237,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124,58,237,0.15)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--purple-glow)', marginBottom: 10 }}>🤖 AI Explanation</div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{b.explanation}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                        <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DIR After Fix</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#34d399' }}>{b.fixedDir.toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SPD After Fix</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#34d399' }}>{b.fixedSpd.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Metrics */}
        {activeTab === 'metrics' && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {results.biasResults?.map((b, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 14, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{b.risk === 'HIGH' ? '🔴' : b.risk === 'MEDIUM' ? '🟡' : '🟢'}</span>
                    {b.attribute} Metrics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
                    <MetricCard
                      label="Disparate Impact Ratio (DIR)"
                      before={b.dir} after={b.fixedDir}
                      higherBetter={true}
                      description="Ratio of positive outcome rates between minority and majority groups. Must be ≥ 0.8 to pass the 4/5ths rule."
                    />
                    <MetricCard
                      label="Statistical Parity Difference (SPD)"
                      before={b.spd} after={b.fixedSpd}
                      higherBetter={false}
                      description="Difference in positive outcome rates between protected and unprotected groups. Closer to 0 is better."
                    />
                  </div>
                </div>
              ))}

              <div className="glass-card" style={{ padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📖 Metric Reference Guide</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { metric: 'DIR ≥ 0.8', status: '✅ Pass', color: '#34d399', desc: 'Passes the 80% rule. Acceptable disparity.' },
                    { metric: 'DIR 0.65–0.8', status: '⚠️ Caution', color: '#fcd34d', desc: 'Medium risk. Address before deployment.' },
                    { metric: 'DIR < 0.65', status: '❌ Fail', color: '#f87171', desc: 'High risk. Legal action possible.' },
                    { metric: 'SPD near 0', status: '✅ Fair', color: '#34d399', desc: 'Groups have similar approval rates.' },
                  ].map((row, i) => (
                    <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: row.color, marginBottom: 4 }}>{row.metric}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{row.status}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{row.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Charts */}
        {activeTab === 'charts' && (
          <div style={{ animation: 'fadeInUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Disparate Impact Ratio — Before vs After Mitigation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Values above 0.8 (dashed line) pass the legal fairness threshold.</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dirChartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13 }} />
                  <YAxis domain={[0, 1.1]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-display)', fontSize: 13 }} />
                  <Bar dataKey="Before Fix" fill="#ef4444" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  <Bar dataKey="After Fix" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Statistical Parity Difference — Before vs After</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Closer to 0 means less disparity between groups.</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={spdChartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-display)', fontSize: 13 }} />
                  <Bar dataKey="Before Fix" fill="#f59e0b" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  <Bar dataKey="After Fix" fill="#3b82f6" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Fairness Radar — Before vs After</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>DIR as percentage across all sensitive attributes.</p>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="attribute" tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Radar name="Before Fix" dataKey="Before" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                  <Radar name="After Fix" dataKey="After" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-display)', fontSize: 13 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB: AI Insights */}
        {activeTab === 'ai' && (
          <div style={{ animation: 'fadeInUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.06))', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>🤖</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 8, color: 'var(--purple-glow)' }}>Gemini AI Analysis Summary</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
                    This dataset was analyzed for algorithmic fairness across {results.sensitiveAttributes?.length} sensitive attributes.
                    The analysis found <strong style={{ color: 'var(--text-primary)' }}>{results.biasResults?.filter(b => b.risk === 'HIGH').length} high-risk</strong> and{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{results.biasResults?.filter(b => b.risk === 'MEDIUM').length} medium-risk</strong> bias patterns.
                    Overall system risk is rated <strong style={{ color: results.overallRisk === 'HIGH' ? '#f87171' : results.overallRisk === 'MEDIUM' ? '#fcd34d' : '#34d399' }}>{results.overallRisk}</strong>.
                    {results.overallRisk === 'HIGH' && ' Immediate remediation is strongly recommended before deployment.'}
                    {results.overallRisk === 'MEDIUM' && ' Mitigation is advised before production use.'}
                    {results.overallRisk === 'LOW' && ' The dataset is within acceptable fairness thresholds.'}
                  </p>
                </div>
              </div>
            </div>

            {results.biasResults?.map((b, i) => (
              <div key={i} className="glass-card" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>{b.risk === 'HIGH' ? '🔴' : b.risk === 'MEDIUM' ? '🟡' : '🟢'}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{b.attribute}</span>
                  <RiskBadge risk={b.risk} />
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, marginBottom: 16 }}>{b.explanation}</p>
                <div style={{ padding: '14px 18px', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, color: 'var(--blue-glow)' }}>
                  💡 <strong>Recommendation:</strong> {b.risk === 'HIGH' ? `Apply strong resampling and consider removing ${b.attribute} as a direct or proxy feature.` : b.risk === 'MEDIUM' ? `Monitor ${b.attribute} outcomes closely and apply reweighting techniques.` : `No immediate action needed for ${b.attribute}. Continue routine monitoring.`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Before vs After */}
        {activeTab === 'fix' && (
          <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
            <div className="glass-card" style={{ padding: '24px 28px', marginBottom: 24, background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06))', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🔧 Mitigation Techniques Applied</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 16 }}>
                {[
                  { name: 'Resampling', desc: 'Oversampled minority groups to create balanced training data', icon: '⚖️' },
                  { name: 'Reweighting', desc: 'Applied instance weights to reduce discriminatory learning patterns', icon: '🔢' },
                  { name: 'Threshold Adjustment', desc: 'Calibrated decision thresholds per demographic group', icon: '🎯' },
                ].map((t, i) => (
                  <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              {results.biasResults?.map((b, i) => {
                const dirImprove = (((b.fixedDir - b.dir) / b.dir) * 100).toFixed(1);
                const spdImprove = (((Math.abs(b.spd) - Math.abs(b.fixedSpd)) / Math.abs(b.spd)) * 100).toFixed(1);

                return (
                  <div key={i} className="glass-card" style={{ padding: '28px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, textTransform: 'capitalize', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {b.attribute} — Before vs After Comparison
                      <span className={`badge ${b.fixedDir >= 0.8 ? 'badge-low' : 'badge-medium'}`} style={{ fontSize: 11 }}>
                        {b.fixedDir >= 0.8 ? '✓ Now Compliant' : '⚠ Improved'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ padding: '20px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: '#f87171', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Before Fix</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#f87171', marginBottom: 4 }}>{b.dir.toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DIR</div>
                        <div style={{ height: 1, background: 'rgba(239,68,68,0.2)', margin: '12px 0' }}/>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#f87171', marginBottom: 4 }}>{b.spd.toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SPD</div>
                      </div>

                      <div style={{ textAlign: 'center', padding: '0 8px' }}>
                        <div style={{ fontSize: 28 }}>→</div>
                        <div style={{ fontSize: 11, color: 'var(--purple-glow)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>FIXED</div>
                      </div>

                      <div style={{ padding: '20px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: '#34d399', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>After Fix</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#34d399', marginBottom: 4 }}>{b.fixedDir.toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DIR</div>
                        <div style={{ height: 1, background: 'rgba(16,185,129,0.2)', margin: '12px 0' }}/>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#34d399', marginBottom: 4 }}>{b.fixedSpd.toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SPD</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.08)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#a855f7' }}>+{dirImprove}%</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DIR Improvement</div>
                      </div>
                      <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#60a5fa' }}>+{spdImprove}%</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SPD Improvement</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, flexWrap: 'wrap', gap: 16, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <button className="btn-secondary" onClick={() => navigate('/upload')}>
            ← Audit Another Dataset
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={handleDownloadPDF} disabled={pdfGenerating}>
            {pdfGenerating ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}/> Generating Report...</>
            ) : '⬇ Download Full Audit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
