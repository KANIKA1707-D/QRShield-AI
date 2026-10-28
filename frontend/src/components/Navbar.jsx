import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ScanFace, List, Info, Mail } from 'lucide-react';

// Simple dark‑theme navigation bar
const Navbar = () => {
  const location = useLocation();
  const linkClass = (path) =>
    `flex items-center gap-1 px-2 py-1 rounded ${location.pathname === path ? 'bg-primary text-white' : 'text-gray-300 hover:bg-primary/20'}`;

  return (
    <nav>
      <Link to="/" className={linkClass('/')}> <Home size={18} /> Dashboard</Link>
      <Link to="/scanner" className={linkClass('/scanner')}> <ScanFace size={18} /> QR Scanner</Link>
      <Link to="/history" className={linkClass('/history')}> <List size={18} /> History</Link>
      <Link to="/email-security" className={linkClass('/email-security')}> <Mail size={18} /> Email Security</Link>
      <Link to="/about" className={linkClass('/about')}> <Info size={18} /> About</Link>
    </nav>
  );
};

export default Navbar;
