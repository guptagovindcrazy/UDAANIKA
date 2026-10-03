export const formatDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatDay = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export const assetUrl = (path) => (path ? `${import.meta.env.VITE_ASSET_URL || ''}${path}` : null);

export const percent = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
