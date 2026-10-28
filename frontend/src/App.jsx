import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import QRScanner from './pages/QRScanner';
import History from './pages/History';
import EmailSecurity from './pages/EmailSecurity';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="main-container" style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/history" element={<History />} />
            <Route path="/email-security" element={<EmailSecurity />} />
          </Routes>
        </main>
        <footer style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text)' }}>
          © 2026 QRShield AI
        </footer>
      </div>
    </Router>
  );
}

export default App;
