import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div><strong>🪶 Udaanika</strong><p>Every wing deserves a chance to fly.</p></div>
        <div className="footer__links">
          <Link to="/report-rescue">Report a bird</Link>
          <Link to="/identify">Identify</Link>
          <Link to="/birds">Birds</Link>
          <Link to="/migration">Migration</Link>
        </div>
        <small>If a bird is in immediate danger, also contact your local wildlife helpline or forest department.</small>
      </div>
    </footer>
  );
}
