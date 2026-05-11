import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

export const adminGlobalSearchApi = (query, { signal } = {}) =>
  axios.get(`${API_BASE}/admin/search`, {
    withCredentials: true,
    params: { q: query },
    signal,
  });
