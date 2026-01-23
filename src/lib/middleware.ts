// Simple middleware utilities for API handling
import { verifyToken, JWTPayload } from './auth'

export interface AuthenticatedRequest {
  user?: JWTPayload
  headers: {
    authorization?: string
    [key: string]: any
  }
  method?: string
  body?: any
}

export interface ApiResponse {
  status: (code: number) => {
    json: (data: any) => void
  }
}

export type ApiHandler = (req: AuthenticatedRequest, res: ApiResponse) => Promise<void> | void

export const withAuth = (handler: ApiHandler): ApiHandler => {
  return async (req: AuthenticatedRequest, res: ApiResponse) => {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = user
    return handler(req, res)
  }
}

export const handleApiError = (error: any, res: ApiResponse) => {
  console.error('API Error:', error)
  
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'Duplicate entry found' })
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' })
  }
  
  return res.status(500).json({ error: 'Internal server error' })
}

export const validateMethod = (req: AuthenticatedRequest, res: ApiResponse, allowedMethods: string[]) => {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.status(405).json({ error: `Method ${req.method} not allowed` })
    return false
  }
  return true
}