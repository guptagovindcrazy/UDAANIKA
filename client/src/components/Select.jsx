export default function Select({ label, error, options, placeholder = 'Select…', id, ...props }) {
  const fieldId = id || props.name;
  return (
    <div className="field">
      {label && <label htmlFor={fieldId}>{label}</label>}
      <select id={fieldId} aria-invalid={Boolean(error)} className={error ? 'has-error' : ''} {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}
