const API_BASE = String(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/').replace(/\/$/, '');
const MEDIA_ORIGIN = API_BASE.replace(/\/api$/, '');

export function resolveMediaUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${MEDIA_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
}
