const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

const envApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || "/api");
// In dev, prefer relative '/api' so Vite dev server proxy handles requests.
// If VITE_API_URL is an absolute URL during development, force the proxy by using '/api'.
const rawApiUrl =
  import.meta.env.DEV && /^https?:\/\//i.test(envApiUrl) ? "/api" : envApiUrl;

export const API_BASE_URL = rawApiUrl;
export const API_V1_URL = /\/v\d+$/i.test(rawApiUrl) ? rawApiUrl : `${rawApiUrl}/v1`;
export const API_ROOT_URL = API_V1_URL.replace(/\/v\d+$/i, "");
export const ORDERS_API_URL = `${API_ROOT_URL}/orders`;

const envSocketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || "");
export const SOCKET_URL =
  envSocketUrl ||
  (/^https?:\/\//i.test(API_BASE_URL)
    ? API_BASE_URL.replace(/\/api(?:\/v\d+)?$/i, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "");
