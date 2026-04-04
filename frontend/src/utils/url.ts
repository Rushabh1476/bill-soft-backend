import { API_URL } from '../config/api';

/**
 * Resolves a file path to a full URL that can be used in an <img> tag.
 * Handles:
 * 1. Full URLs (starts with http/https)
 * 2. Absolute paths from root (starts with /)
 * 3. Relative paths
 */
export const resolveFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // 1. Normalize path
  let normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // 2. Identify if it already starts with uploads/
  if (normalizedPath.startsWith('uploads/')) {
    normalizedPath = normalizedPath.substring(8);
  }

  // 3. Determine base URL (API_URL is consistently /api)
  // On VPS: https://billsoft.agbtechnologies.com/api
  // Local: http://10.106.128.240:5000/api
  const baseUrl = API_URL.replace(/\/$/, '');

  // 4. Construct final URL using /api/uploads
  // This is the most reliable way as /api is already proxied call to the backend
  return `${baseUrl}/uploads/${normalizedPath}`;
};
