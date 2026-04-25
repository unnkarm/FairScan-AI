import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon, title, desc, delay }) => (
  <div className="glass-card" style={{
    padding: '32px 28px',
    animation: `fadeInUp 0.6s ease ${delay}s both`,
    cursor: 'default',
  }}>
    <div style={{
      width: 52, height: 52,
      background: 'var(--gradient-btn)',
      borderRadius: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24,
      marginBottom: 18,
      boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
    }}>{icon}</div>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
  </div>
);

const StepBadge = ({ num, label, active }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
    <div style={{
      width: 44, height: 44,
      borderRadius: '50%',
      background: active ? 'var(--gradient-btn)' : 'var(--bg-glass)',
      border: `2px solid ${active ? 'transparent' : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 800, fontSize: 16,
      color: active ? 'white' : 'var(--text-muted)',
      boxShadow: active ? '0 0 24px rgba(124,58,237,0.5)' : 'none',
      transition: 'all 0.3s',
    }}>{num}</div>
    <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: active ? 'var(--purple-glow)' : 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
  </div>
);

const StatBox = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36,
      background: 'var(--gradient-accent)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    }}>{value}</div>
    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{label}</div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const features = [
    { icon: '🔍', title: 'Auto-Detect Bias', desc: 'Automatically identifies sensitive attributes like gender, age, and race in your dataset and flags potential discriminatory patterns.', delay: 0.1 },
    { icon: '📊', title: 'Fairness Metrics', desc: 'Calculates Disparate Impact Ratio (DIR) and Statistical Parity Difference (SPD) to quantify bias with scientific precision.', delay: 0.2 },
    { icon: '🤖', title: 'AI Explanations', desc: 'Gemini AI translates complex bias findings into plain English that non-technical stakeholders can understand and act on.', delay: 0.3 },
    { icon: '🔧', title: 'Auto-Fix Bias', desc: 'Applies state-of-the-art resampling and reweighting techniques to reduce bias while preserving data integrity.', delay: 0.4 },
    { icon: '📈', title: 'Before vs After', desc: 'Visual comparison of fairness metrics before and after mitigation, showing measurable improvement in your data.', delay: 0.5 },
    { icon: '📄', title: 'Audit PDF Report', desc: 'Download a comprehensive compliance-ready PDF audit report to share with teams, regulators, or stakeholders.', delay: 0.6 },
  ];

  const steps = [
    { num: '1', label: 'Upload CSV' },
    { num: '2', label: 'Detect Bias' },
    { num: '3', label: 'Explain' },
    { num: '4', label: 'Fix It' },
    { num: '5', label: 'Compare' },
    { num: '6', label: 'Report' },
  ];

  return (
    <div style={{ paddingTop: '68px' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 32px 60px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
          animation: 'float 6s ease-in-out infinite',
        }}/>
        <div style={{
          position: 'absolute', bottom: '20%', right: '8%', width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
          animation: 'float 8s ease-in-out infinite reverse',
        }}/>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: '999px',
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.35)',
          marginBottom: 32,
          animation: 'fadeInUp 0.5s ease both',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', display: 'inline-block', animation: 'pulse-glow 2s infinite' }}/>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--purple-glow)' }}>
            Unbiased AI Decision Platform
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(40px, 7vw, 80px)',
          lineHeight: 1.1,
          marginBottom: 28,
          maxWidth: 860,
          animation: 'fadeInUp 0.5s 0.1s ease both',
        }}>
          Detect &amp; Fix{' '}
          <span style={{
            background: 'var(--gradient-accent)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Hidden Bias</span>
          {' '}in Your AI
        </h1>

        <p style={{
          fontSize: 18, lineHeight: 1.8,
          color: 'var(--text-secondary)',
          maxWidth: 600, marginBottom: 44,
          animation: 'fadeInUp 0.5s 0.2s ease both',
        }}>
          FairScan inspects datasets and AI models for discrimination before they impact real people.
          Upload your CSV, get instant fairness metrics, AI-generated insights, and an automated fix — all in minutes.
        </p>

        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: 64,
          animation: 'fadeInUp 0.5s 0.3s ease both',
        }}>
          <button className="btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}
            onClick={() => navigate('/upload')}>
            Start Free Audit →
          </button>
          <button className="btn-secondary" style={{ fontSize: 16, padding: '14px 36px' }}
            onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>
            See How It Works
          </button>
        </div>

        {/* Stats row */}
        <div className="glass-card" style={{
          display: 'flex', gap: 48, padding: '28px 52px',
          flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeInUp 0.5s 0.4s ease both',
        }}>
          <StatBox value="6" label="Fairness Metrics" />
          <div style={{ width: 1, background: 'var(--border)' }}/>
          <StatBox value="AI" label="Gemini Explanations" />
          <div style={{ width: 1, background: 'var(--border)' }}/>
          <StatBox value="PDF" label="Audit Reports" />
          <div style={{ width: 1, background: 'var(--border)' }}/>
          <StatBox value="∞" label="Free to Use" />
        </div>
      </section>

      {/* How It Works */}
      <section id="how" style={{ padding: '100px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--purple-glow)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            The Workflow
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 46px)', marginBottom: 16 }}>
            Six Steps to Fairer AI
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            From raw data to compliance-ready audit report — FairScan handles every step automatically.
          </p>
        </div>

        {/* Step flow */}
        <div className="glass-card" style={{ padding: '36px 40px', marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <StepBadge num={step.num} label={step.label} active={true} />
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, marginTop: 21,
                    background: 'linear-gradient(90deg, var(--purple-bright), var(--blue-bright))',
                    opacity: 0.4,
                  }}/>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Feature cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 32px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="glass-card" style={{
          maxWidth: 700, margin: '0 auto',
          padding: '60px 48px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08))',
          border: '1px solid rgba(124,58,237,0.25)',
          animation: 'pulse-glow 4s infinite',
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚖️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 16 }}>
            Ready to Build Fairer AI?
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, fontSize: 16 }}>
            Upload your CSV and get a complete fairness audit in under 60 seconds. No account required.
          </p>
          <button className="btn-primary" style={{ fontSize: 17, padding: '15px 44px' }}
            onClick={() => navigate('/upload')}>
            Audit My Dataset →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '28px 32px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        fontFamily: 'var(--font-body)',
      }}>
        © 2025 FairScan — Unbiased AI Decision Platform &nbsp;·&nbsp; Built with ❤️ for AI fairness
      </footer>
    </div>
  );
};

export default LandingPage;
