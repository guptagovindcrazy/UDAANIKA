import { NavLink } from 'react-router-dom';

const LINKS = [
  ['/admin', 'Overview', true],
  ['/admin/rescues', 'Rescues'],
  ['/admin/volunteers', 'Volunteers'],
  ['/admin/users', 'Users'],
  ['/admin/analytics', 'Analytics'],
];

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Admin navigation">
      {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{label}</NavLink>)}
    </nav>
  );
}
