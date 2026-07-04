import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

export const fetchProductReviewsApi = ({
  productId,
  rating,
  sort,
  page,
  limit,
  withPhotos,
  verifiedOnly,
  category,
  q,
}) =>
  axios.get(`${API_BASE}/reviews/product/${productId}`, {
    params: {
      rating: rating ?? undefined,
      sort,
      page,
      limit,
      withPhotos: withPhotos ? "true" : undefined,
      verifiedOnly: verifiedOnly ? "true" : undefined,
      category: category || undefined,
      q: q?.trim() ? q.trim() : undefined,
    },
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

export const fetchAdminReviewsApi = ({ status, page, limit, search, category }) =>
  axios.get(`${API_BASE}/admin/reviews`, {
    withCredentials: true,
    params: { status, page, limit, search, category: category || undefined },
  });

export const categorizeReviewApi = (reviewId, category) =>
  axios.patch(
    `${API_BASE}/admin/reviews/${reviewId}/category`,
    { category },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );

export const flagReviewApi = (reviewId, reason) =>
  axios.post(`${API_BASE}/reviews/${reviewId}/flag`, { reason }, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

export const replyToReviewApi = (reviewId, brandReply) =>
  axios.patch(
    `${API_BASE}/admin/reviews/${reviewId}/reply`,
    { brandReply },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );

export const featureReviewApi = (reviewId, isFeatured) =>
  axios.patch(
    `${API_BASE}/admin/reviews/${reviewId}/feature`,
    typeof isFeatured === "boolean" ? { isFeatured } : {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );

export const archiveReviewApi = (reviewId) =>
  axios.patch(`${API_BASE}/admin/reviews/${reviewId}/archive`, null, {
    withCredentials: true,
  });

export const restoreReviewApi = (reviewId) =>
  axios.patch(`${API_BASE}/admin/reviews/${reviewId}/restore`, null, {
    withCredentials: true,
  });

export const deleteAdminReviewApi = (reviewId) =>
  axios.delete(`${API_BASE}/admin/reviews/${reviewId}`, {
    withCredentials: true,
  });

export const fetchReviewAnalyticsApi = () =>
  axios.get(`${API_BASE}/admin/reviews/analytics`, { withCredentials: true });

export const bulkModerateReviewsApi = ({ ids, action, category }) =>
  axios.patch(
    `${API_BASE}/admin/reviews/bulk`,
    { ids, action, category },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );
