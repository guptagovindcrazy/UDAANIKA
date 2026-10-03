import { slug } from '../utils/constants';

// `status` maps to the rescue/severity colour classes defined in index.css.
export default function Badge({ status, children }) {
  return <span className={`badge badge--${slug(status)}`}>{children || status}</span>;
}
