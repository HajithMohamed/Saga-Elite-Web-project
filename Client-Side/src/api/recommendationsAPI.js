import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

export const fetchRecommendationApi = (type) =>
  axios.get(`${API_BASE}/admin/recommendations/${type}`, { withCredentials: true });

export const fetchAllRecommendationsApi = () =>
  axios.get(`${API_BASE}/admin/recommendations`, { withCredentials: true });

export const regenerateRecommendationApi = (type) =>
  axios.post(`${API_BASE}/admin/recommendations/${type}/regenerate`, null, {
    withCredentials: true,
  });
