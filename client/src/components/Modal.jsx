import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={dialogRef}>
        <div className="row row--between">
          <h2 className="modal__title">{title}</h2>
          <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
