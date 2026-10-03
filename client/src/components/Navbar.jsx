import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const COMMON = [['/identify', 'Identify'], ['/migration', 'Migration']];

function linksFor(user) {
  if (!user) return COMMON;
  if (user.role === 'admin') return [['/admin', 'Admin'], ...COMMON];
  if (user.role === 'volunteer') return [['/volunteer', 'Dashboard'], ['/volunteer/rescues', 'Rescues'], ...COMMON];
  return [['/dashboard', 'Dashboard'], ['/report-rescue', 'Report Rescue'], ['/my-rescues', 'My Rescues'], ...COMMON];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={close}>🪶 Udaanika</Link>
        <button className="navbar__toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? '✕' : '☰'}
        </button>
        <nav className={`navbar__links ${open ? 'is-open' : ''}`}>
          {linksFor(user).map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} onClick={close}>{label}</NavLink>)}
          {user ? (
            <>
              <NavLink to="/profile" className="navbar__user" onClick={close}>👤 {user.name.split(' ')[0]}</NavLink>
              <Button variant="secondary" onClick={() => { logout(); close(); navigate('/'); }}>Logout</Button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <Button to="/register" onClick={close}>Sign up</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
