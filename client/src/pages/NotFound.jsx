import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <div className="container section">
      <EmptyState icon="🧭" title="Page not found" text="This bird has flown elsewhere." action={<Button to="/">Go home</Button>} />
    </div>
  );
}
