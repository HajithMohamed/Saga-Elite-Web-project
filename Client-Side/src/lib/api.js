import axios from "axios";

const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

const envApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || "/api");
// In dev, prefer relative '/api' so Vite dev server proxy handles requests.
// If VITE_API_URL is an absolute URL during development, force the proxy by using '/api'.
const rawApiUrl =
  import.meta.env.DEV && /^https?:\/\//i.test(envApiUrl) ? "/api" : envApiUrl;

export const API_BASE_URL = rawApiUrl;
export const API_V1_URL = /\/v\d+$/i.test(rawApiUrl) ? rawApiUrl : `${rawApiUrl}/v1`;
export const API_ROOT_URL = API_V1_URL.replace(/\/v\d+$/i, "");
export const ORDERS_API_URL = `${API_V1_URL}/orders`;

const envSocketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || "");
const devSocketTarget = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_TARGET ||
    (/^https?:\/\//i.test(envApiUrl)
      ? envApiUrl.replace(/\/api(?:\/v\d+)?$/i, "")
      : "http://localhost:5001")
);
export const SOCKET_URL =
  envSocketUrl ||
  (import.meta.env.DEV ? devSocketTarget : "") ||
  (/^https?:\/\//i.test(API_BASE_URL)
    ? API_BASE_URL.replace(/\/api(?:\/v\d+)?$/i, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "");

// Safety net for the many legacy call sites that still use the global `axios`
// with cookie-only auth: in production the API is cross-site, so browsers may
// drop the cookie entirely. Attach the same Bearer token axiosInstance uses to
// every request aimed at our API. New code should keep using axiosInstance.
axios.interceptors.request.use((config) => {
  const url = String(config.url || "");
  const base = String(config.baseURL || "");
  const target = /^https?:\/\//i.test(url) ? url : base + url;
  const isApiRequest =
    target.startsWith(API_BASE_URL) || target.startsWith("/api/");

  if (isApiRequest && !config.headers?.Authorization) {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
