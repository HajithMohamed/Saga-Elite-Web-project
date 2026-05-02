const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");

const rawApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || "/api");

export const API_BASE_URL = rawApiUrl;
export const API_V1_URL = /\/v\d+$/i.test(rawApiUrl) ? rawApiUrl : `${rawApiUrl}/v1`;
export const API_ROOT_URL = API_V1_URL.replace(/\/v\d+$/i, "");
export const ORDERS_API_URL = `${API_ROOT_URL}/orders`;

export const SOCKET_URL =
  trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) ||
  (/^https?:\/\//i.test(API_BASE_URL)
    ? API_BASE_URL.replace(/\/api(?:\/v\d+)?$/i, "")
    : typeof window !== "undefined"
      ? window.location.origin
      : "");
