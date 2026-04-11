import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { clearAuthToken, getAuthToken } from './utils/authToken';
import { clearStoredAuthUser } from './utils/authUser';

// Simple in-memory cache for GET requests (max 5 min TTL)
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (url: string, params?: Record<string, any>) => {
  const queryStr = params ? JSON.stringify(params) : '';
  return `${url}${queryStr}`;
};

const normalizeApiBaseUrl = (rawUrl?: string): string => {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    // Local dev default (Vite). Production builds must set VITE_API_BASE_URL or VITE_API_URL on the host (e.g. Vercel).
    if (import.meta.env.DEV) {
      return 'http://127.0.0.1:8000/api';
    }
    if (import.meta.env.PROD) {
      console.error(
        '[Invigilore] Set VITE_API_BASE_URL or VITE_API_URL to your API root (e.g. https://invigilore.onrender.com/api).'
      );
    }
    return 'http://127.0.0.1:8000/api';
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');

  if (withoutTrailingSlash.endsWith('/api')) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

const resolvedBaseUrl = normalizeApiBaseUrl(import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL);

/** Same base URL as the axios client — use for non-axios URLs (e.g. storage paths). */
export function getApiBaseUrl(): string {
  return resolvedBaseUrl;
}

const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 70000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Sanctum bearer tokens — no cookies; keeps CORS simple (no credentialed requests).
  withCredentials: false,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Check cache for GET requests
    if (config.method === 'get' && config.url) {
      const cacheKey = getCacheKey(config.url, config.params);
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Return cached response
        config.adapter = async () => ({ data: cached.data, status: 200, statusText: 'OK', headers: {}, config });
      }
    }

    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.config.url) {
      const cacheKey = getCacheKey(response.config.url, response.config.params);
      requestCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  (error: AxiosError) => {
    const requestUrl = String(error.config?.url ?? '');
    const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/register');
    const isTimeSyncEndpoint = requestUrl.includes('/system/time');
    const isAlreadyOnLogin = typeof window !== 'undefined' && window.location.pathname === '/login';

    if (error.response && error.response.status === 401 && !isAuthEndpoint && !isTimeSyncEndpoint) {
      clearAuthToken();
      clearStoredAuthUser();
      if (!isAlreadyOnLogin) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Utility to clear cache
export const clearApiCache = () => requestCache.clear();

export default api;
