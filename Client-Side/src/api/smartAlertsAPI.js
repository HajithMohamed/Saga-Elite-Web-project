import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

export const fetchAlertsApi = (params = {}) =>
  axios.get(`${API_BASE}/admin/alerts`, { withCredentials: true, params });

export const acknowledgeAlertApi = (id) =>
  axios.patch(`${API_BASE}/admin/alerts/${id}/ack`, null, { withCredentials: true });

export const runAlertChecksApi = () =>
  axios.post(`${API_BASE}/admin/alerts/run`, null, { withCredentials: true });
