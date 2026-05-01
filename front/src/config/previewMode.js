const previewRole = String(import.meta.env.VITE_PREVIEW_USER_ROLE || 'TEACHER')
  .trim()
  .toUpperCase();

export const TEMP_FRONTEND_PREVIEW_MODE = import.meta.env.VITE_FRONTEND_PREVIEW_MODE === 'true';

export const TEMP_PREVIEW_USER = {
  id: import.meta.env.VITE_PREVIEW_USER_ID || `preview-${previewRole.toLowerCase()}`,
  email: import.meta.env.VITE_PREVIEW_USER_EMAIL || `preview.${previewRole.toLowerCase()}@esi-sba.dz`,
  first_name: import.meta.env.VITE_PREVIEW_USER_FIRST_NAME || 'Frontend',
  last_name: import.meta.env.VITE_PREVIEW_USER_LAST_NAME || 'Preview',
  role: previewRole,
  must_change_password: false,
};
