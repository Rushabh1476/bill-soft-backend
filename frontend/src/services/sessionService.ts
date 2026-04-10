import axios from 'axios';
import { API_URL as API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserSession {
  id: string;
  sessionId: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  isActive: boolean;
  expiresAt: string;
  lastUsedAt: string;
  createdAt: string;
}

export const sessionService = {
  getSessions: async (): Promise<UserSession[]> => {
    const response = await apiClient.get('/auth/sessions');
    return response.data.sessions;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  }
};
