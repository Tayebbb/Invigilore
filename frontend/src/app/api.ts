import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Simple in-memory cache for GET requests (max 5 min TTL)
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (url: string, params?: Record<string, any>) => {
  const queryStr = params ? JSON.stringify(params) : '';
  return `${url}${queryStr}`;
};

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Utility to clear cache
export const clearApiCache = () => requestCache.clear();

export default api;
