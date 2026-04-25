import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const steps = [
    { path: '/', label: 'Home' },
    { path: '/upload', label: 'Upload' },
    { path: '/analysis', label: 'Analysis' },
    { path: '/results', label: 'Results' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 32px',
      height: '68px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled
        ? 'rgba(8, 8, 26, 0.9)'
        : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--gradient-btn)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          boxShadow: '0 0 20px rgba(124,58,237,0.4)',
        }}>⚖️</div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 22,
          background: 'var(--gradient-accent)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>FairScan</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {steps.map(step => {
          const isActive = location.pathname === step.path;
          return (
            <Link key={step.path} to={step.path} style={{
              textDecoration: 'none',
              padding: '7px 18px',
              borderRadius: '999px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 14,
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--gradient-btn)' : 'transparent',
              border: isActive ? 'none' : '1px solid transparent',
              transition: 'all 0.3s',
              boxShadow: isActive ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}>
              {step.label}
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <Link to="/upload" style={{ textDecoration: 'none' }}>
        <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 14 }}>
          Start Audit →
        </button>
      </Link>
    </nav>
  );
};

export default Navbar;
