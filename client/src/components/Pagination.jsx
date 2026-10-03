import Button from './Button';

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="row row--center">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Previous</Button>
      <span className="muted">Page {page} of {pages}</span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</Button>
    </div>
  );
}
