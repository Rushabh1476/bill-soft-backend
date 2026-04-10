import { getNetworkIp } from './network';
import { Request } from 'express';

// Production domains for dynamic resolution
const PRODUCTION_DOMAINS = [
  'billsoft.agbtechnologies.com',
  'billsoft.agbitsolutions.com',
  'billsoft.salonadmin.cloud'
];

/**
 * Returns the public BASE URL (Backend API root)
 * @param req Optional Express Request for dynamic origin resolution
 */
export function getBaseUrl(req?: Request): string {
  // If we have a request, try to resolve from the Origin or Referer header
  if (req) {
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '');
    
    // If origin matches our production domains, use the current protocol + host for API
    if (origin) {
      const hostname = new URL(origin).hostname;
      if (PRODUCTION_DOMAINS.includes(hostname) || hostname.startsWith('api.')) {
        // Resolve API host (e.g., api.billsoft.agbtechnologies.com)
        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        return `${protocol}://${host}`;
      }
    }
  }

  const envUrl = process.env.BASE_URL;

  // 1. Trust Environment Variable (highest priority)
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Development defaults
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }

  // 3. Fallback for mobile browser testing on same LAN
  const localIp = getNetworkIp();
  return `http://${localIp}:5001`;
}

/**
 * Returns the Frontend App URL (for email links/redirects)
 * @param req Optional Express Request for dynamic origin resolution
 */
export function getFrontendUrl(req?: Request): string {
  // If we have a request, try to resolve from current origin
  if (req) {
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '');
    
    if (origin) {
      const hostname = new URL(origin).hostname;
      // If the hostname matches our production domains, or it's a known localhost/IP for dev
      if (
          PRODUCTION_DOMAINS.includes(hostname) || 
          hostname === 'localhost' || 
          hostname === '127.0.0.1' ||
          /^((192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.))/.test(hostname)
      ) {
         return origin.replace(/\/$/, '');
      }
    }
  }

  const envUrl = process.env.FRONTEND_URL || process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  const localIp = getNetworkIp();
  return `http://${localIp}:3001`;
}
