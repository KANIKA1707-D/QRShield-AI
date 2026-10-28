import React, { useEffect, useState } from 'react';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/history`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => { setHistory(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const total = history.length;
  const low = history.filter(h => h.risk_level === 'LOW').length;
  const medium = history.filter(h => h.risk_level === 'MEDIUM').length;
  const high = history.filter(h => h.risk_level === 'HIGH').length;
  const recent = history.slice(0, 5);

  return (
    <div className="card">
      <h2>Dashboard</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error loading history: {error}</p>}
      {!loading && !error && (
        <>
          <div className="stats">
            <p>Total scans: {total}</p>
            <p>LOW: {low}</p>
            <p>MEDIUM: {medium}</p>
            <p>HIGH: {high}</p>
          </div>
          <h3>Recent Scans</h3>
          {recent.length === 0 ? (
            <p>No recent scans.</p>
          ) : (
            <ul>
              {recent.map((item, idx) => (
                <li key={idx}>
                  <strong>{new Date(item.timestamp).toLocaleString()}</strong> – {item.decoded_url}
                  {' '}({item.risk_level}, score {item.risk_score})
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;

