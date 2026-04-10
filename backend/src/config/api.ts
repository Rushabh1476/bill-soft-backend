/**
 * Centralized API configuration for the backend service layer.
 * This is used by the frontend-style service classes (BillService, etc.)
 * that were built with dependency injection patterns.
 *
 * The actual Express routes use the Prisma client directly and do NOT
 * use this file — it exists purely to satisfy the import chain in the
 * service/HTTP/storage layers.
 */

export const API_URL = process.env.REACT_APP_API_URL || '/api';
