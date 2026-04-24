import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const UploadPage = () => {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const parseCSVPreview = (text) => {
    const lines = text.trim().split('\n').slice(0, 6);
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/"/g, '')));
    return { headers, rows };
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a .csv file only.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File must be under 50MB.');
      return;
    }
    setError('');
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const p = parseCSVPreview(e.target.result);
        setPreview(p);
      } catch {
        setPreview(null);
      }
    };
    reader.readAsText(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    // Store file info in sessionStorage to pass to analysis page
    const reader = new FileReader();
    reader.onload = (e) => {
      sessionStorage.setItem('csvData', e.target.result);
      sessionStorage.setItem('csvFileName', file.name);
      sessionStorage.setItem('csvFileSize', file.size);
      setTimeout(() => {
        setUploading(false);
        navigate('/analysis');
      }, 600);
    };
    reader.readAsText(file);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };

  const exampleDatasets = [
    { name: 'Hiring Decisions Dataset', rows: '15,000 rows', cols: '12 columns', icon: '💼', tag: 'Employment' },
    { name: 'Loan Approval Records', rows: '28,000 rows', cols: '18 columns', icon: '🏦', tag: 'Finance' },
    { name: 'Medical Treatment Data', rows: '9,500 rows', cols: '24 columns', icon: '🏥', tag: 'Healthcare' },
  ];

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 32px 60px' }}>
      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeInUp 0.5s ease both' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--purple-glow)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Step 1 of 3
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 48px)', marginBottom: 14 }}>
          Upload Your{' '}
          <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dataset
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Drop a CSV file containing decision records. FairScan will automatically detect sensitive attributes and target columns.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 780, animation: 'fadeInUp 0.5s 0.1s ease both' }}>
        {/* Drop Zone */}
        {!file && (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? '#7c3aed' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '72px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging
                ? 'rgba(124,58,237,0.12)'
                : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden',
            }}>
            {dragging && (
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: 3,
                background: 'var(--gradient-btn)',
                animation: 'shimmer 1s linear infinite',
                backgroundSize: '200% 100%',
              }}/>
            )}
            <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 56, marginBottom: 20, opacity: dragging ? 1 : 0.7 }}>
              {dragging ? '📂' : '☁️'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 10, color: dragging ? 'var(--purple-glow)' : 'var(--text-primary)' }}>
              {dragging ? 'Drop to upload!' : 'Drag & Drop your CSV here'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              or click to browse files · Max 50MB · CSV only
            </p>
            <div style={{
              display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            }}>
              {['gender', 'age', 'race', 'income', 'decision'].map(tag => (
                <span key={tag} className="badge badge-info" style={{ fontSize: 11 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: '14px 20px', borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* File Preview */}
        {file && (
          <div className="glass-card" style={{ padding: '28px', animation: 'fadeInUp 0.4s ease both' }}>
            {/* File info row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'var(--gradient-btn)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>📊</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{file.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {(file.size / 1024).toFixed(1)} KB · {preview?.headers?.length || 0} columns · {preview ? `${preview.rows.length}+ rows detected` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }}
                  onClick={handleRemove}>
                  Remove
                </button>
              </div>
            </div>

            {/* Column preview chips */}
            {preview && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Detected Columns ({preview.headers.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {preview.headers.map((h, i) => {
                      const isSensitive = ['gender','sex','race','ethnicity','age','religion','nationality'].some(s => h.toLowerCase().includes(s));
                      const isTarget = ['hired','approved','decision','outcome','loan','result','label'].some(s => h.toLowerCase().includes(s));
                      return (
                        <span key={i} style={{
                          padding: '5px 12px', borderRadius: '999px',
                          fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600,
                          background: isTarget ? 'rgba(168,85,247,0.2)' : isSensitive ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isTarget ? 'rgba(168,85,247,0.4)' : isSensitive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          color: isTarget ? '#d8b4fe' : isSensitive ? '#fcd34d' : 'var(--text-secondary)',
                        }}>
                          {isTarget ? '🎯 ' : isSensitive ? '⚠️ ' : ''}{h}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span><span style={{ color: '#d8b4fe' }}>🎯 Purple</span> = possible target column</span>
                    <span><span style={{ color: '#fcd34d' }}>⚠️ Yellow</span> = sensitive attribute</span>
                  </div>
                </div>

                {/* CSV table preview */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Data Preview
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'rgba(124,58,237,0.1)' }}>
                          {preview.headers.map((h, i) => (
                            <th key={i} style={{
                              padding: '10px 14px', textAlign: 'left',
                              fontFamily: 'var(--font-display)', fontWeight: 600,
                              color: 'var(--purple-glow)', borderBottom: '1px solid var(--border)',
                              whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, ri) => (
                          <tr key={ri} style={{ borderBottom: '1px solid var(--border)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ padding: '9px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Analyze button */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                style={{ fontSize: 16, padding: '14px 40px', opacity: uploading ? 0.7 : 1 }}
                onClick={handleAnalyze}
                disabled={uploading}>
                {uploading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}/>
                    Preparing Analysis...
                  </span>
                ) : 'Run Fairness Analysis →'}
              </button>
            </div>
          </div>
        )}

        {/* Example datasets */}
        {!file && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 20 }}>
              Common Use Cases
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {exampleDatasets.map((ds, i) => (
                <div key={i} className="glass-card" style={{ padding: '20px', cursor: 'default' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{ds.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{ds.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>{ds.rows} · {ds.cols}</div>
                  <span className="badge badge-info">{ds.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
