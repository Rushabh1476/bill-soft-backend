/**
 * Central API configuration for the application.
 * LOCAL DEV ONLY: All API calls go to http://localhost:5001/api
 * For production, set REACT_APP_API_URL in the build environment.
 */

/**
 * Zero-Config Dynamic API URL
 * ---------------------------
 * Uses window.location.hostname so the frontend ALWAYS talks to the same
 * machine it was loaded from — works on localhost, LAN IP, or any device
 * on the network without ever changing a line of code.
 */
const getApiUrl = () => {
  const { hostname, protocol } = window.location;
  
  // If we are on localhost, or access via a local IP (like 10.106.128.240), we use port 5001 for api
  // This allows the app to work on other devices in the same network (e.g., mobile testing)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^10\.|^192\.|^172\./)) {
    return `${protocol}//${hostname}:5001/api`;
  }
  
  // On VPS / Production, we use the Nginx proxy configured in the frontend container.
  // This expects the API to be at the same origin under /api
  return window.location.origin + '/api';
};

export const API_URL = getApiUrl();

console.log(`[API] Auto-resolved endpoint → ${API_URL}`);

export default API_URL;
