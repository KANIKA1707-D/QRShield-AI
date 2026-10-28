import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const EmailSecurity = () => {
  const [emailText, setEmailText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!emailText.trim()) {
      setError('Please paste email content.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${API_URL}/api/analyze-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_text: emailText }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || `Status ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Email Security Analyzer</h2>
      <textarea
        rows={8}
        placeholder="Paste email content here..."
        value={emailText}
        onChange={e => setEmailText(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-primary)', borderRadius: '4px' }}
        disabled={loading}
      />
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Analyzing…' : 'Analyze Email'}
      </button>
      {error && <p className="error" style={{ color: 'salmon', marginTop: '1rem' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Analysis Results</h3>
          <p><strong>Overall Risk:</strong> {result.overall_risk}</p>
          <p><strong>URLs Found:</strong> {result.urls_found}</p>
          {result.urls_found > 0 ? (
            <ul>
              {result.results.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.url}</strong>
                  <div style={{ marginLeft: '1rem' }}>
                    <p>Risk: {item.risk_score} ({item.risk_level})</p>
                    <p>{item.message}</p>
                    {item.indicators && item.indicators.length > 0 && (
                      <ul>
                        {item.indicators.map((ind, i) => (
                          <li key={i}>{ind}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No URLs found in this email.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailSecurity;
