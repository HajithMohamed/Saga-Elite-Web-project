import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/v1`;

export const fetchProductReviewsApi = ({ productId, rating, sort, page, limit }) =>
  axios.get(`${API_BASE}/reviews/product/${productId}`, {
    params: { rating, sort, page, limit },
  });

export const fetchUserReviewsApi = () =>
  axios.get(`${API_BASE}/reviews/my-reviews`, { withCredentials: true });

export const submitReviewApi = (payload) =>
  axios.post(`${API_BASE}/reviews`, payload, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

export const updateReviewApi = (reviewId, payload) =>
  axios.patch(`${API_BASE}/reviews/${reviewId}`, payload, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

export const voteReviewHelpfulApi = (reviewId) =>
  axios.post(`${API_BASE}/reviews/${reviewId}/helpful`, null, {
    withCredentials: true,
  });

export const deleteReviewApi = (reviewId) =>
  axios.delete(`${API_BASE}/reviews/${reviewId}`, { withCredentials: true });

export const fetchAdminReviewsApi = ({ status, page, limit, search }) =>
  axios.get(`${API_BASE}/admin/reviews`, {
    withCredentials: true,
    params: { status, page, limit, search },
  });

export const moderateReviewApi = (reviewId, payload) =>
  axios.put(`${API_BASE}/admin/reviews/${reviewId}`, payload, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

export const flagReviewApi = (reviewId, reason) =>
  axios.post(`${API_BASE}/reviews/${reviewId}/flag`, { reason }, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
