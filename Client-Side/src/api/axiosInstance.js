import axios from 'axios';
import { API_V1_URL } from '@/lib/api';

/**
 * Axios instance with built-in Bearer token support.
 * Automatically adds Authorization header if token exists in localStorage.
 * Falls back to cookies for backward compatibility.
 */
const axiosInstance = axios.create({
  baseURL: API_V1_URL,
  withCredentials: true, // Still send cookies if they exist
});

/**
 * Request interceptor: attach Bearer token from localStorage if available.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[axiosInstance] Attached Bearer token to request:', config.url);
    } else {
      console.log('[axiosInstance] No token in localStorage for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[axiosInstance] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: handle 401 (token expired/invalid).
 * Extract and store token from response if present.
 * Clear token and redirect to login if 401 received.
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // If response contains a token, store it
    if (response.data?.token) {
      localStorage.setItem('authToken', response.data.token);
      console.log('[axiosInstance] Stored token from response:', response.config.url);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[axiosInstance] 401 received, clearing token');
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
