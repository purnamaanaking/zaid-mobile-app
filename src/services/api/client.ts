import { create as createAxiosClient } from 'axios';
import { deleteAuthToken, getAuthToken, getDeveloperAuthSession } from '@/src/services/storage/token';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://zaidassistant.id/api';

export const apiClient = createAxiosClient({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const addUnauthorizedListener = (listener: UnauthorizedListener) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

const emitUnauthorized = () => unauthorizedListeners.forEach((listener) => listener());

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (await getDeveloperAuthSession()) {
        return config;
      }

      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Could not read auth token', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch 401 and trigger logout/unauthorized callbacks
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (await getDeveloperAuthSession()) {
        return Promise.reject(error);
      }

      try {
        await deleteAuthToken();
      } catch (e) {
        console.warn('Could not clear auth token', e);
      }
      emitUnauthorized();
    }
    return Promise.reject(error);
  }
);
