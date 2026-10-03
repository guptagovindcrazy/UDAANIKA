import Button from './Button';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="notice notice--error" role="alert">
      <p>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
