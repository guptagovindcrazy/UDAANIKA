export default function Input({ label, error, textarea = false, id, ...props }) {
  const fieldId = id || props.name;
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="field">
      {label && <label htmlFor={fieldId}>{label}</label>}
      <Tag id={fieldId} aria-invalid={Boolean(error)} className={error ? 'has-error' : ''} {...props} />
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}
