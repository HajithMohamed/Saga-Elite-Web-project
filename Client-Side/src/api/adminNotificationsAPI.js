import axiosInstance from "@/api/axiosInstance";

// Admin notification center. axiosInstance attaches the Bearer token + v1
// baseURL, so paths are relative.
export const fetchAdminNotificationsApi = (params = {}) =>
  axiosInstance.get(`/admin/notifications`, { params });

export const updateAdminNotificationApi = (id, body) =>
  axiosInstance.patch(`/admin/notifications/${id}`, body);

export const deleteAdminNotificationApi = (id) =>
  axiosInstance.delete(`/admin/notifications/${id}`);

export const broadcastNotificationApi = ({ title, message }) =>
  axiosInstance.post(`/admin/notifications/broadcast`, { title, message });
