import React, { useEffect, useState } from 'react';

// Vite exposes env vars prefixed with VITE_
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const resp = await fetch(`${API_URL}/api/history`);
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const data = await resp.json();
        // Ensure newest first (backend already stores newest first)
        setHistory(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2>Scan History</h2>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Scan History</h2>
        <p style={{ color: 'salmon' }}>Error loading history: {error}</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="card">
        <h2>Scan History</h2>
        <p>No scan history yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Scan History</h2>
      {history.map((entry, idx) => (
        <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-card)', borderRadius: '6px' }}>
          <p><strong>Date/Time:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
          <p style={{ wordBreak: 'break-all' }}><strong>URL:</strong> {entry.decoded_url}</p>
          <p><strong>Risk Score:</strong> {entry.risk_score} ({entry.risk_level})</p>
          {entry.indicators && entry.indicators.length > 0 && (
            <div>
              <strong>Indicators:</strong>
              <ul>
                {entry.indicators.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            </div>
          )}
          {entry.message && (
            <p><strong>Message:</strong> {entry.message}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default History;


