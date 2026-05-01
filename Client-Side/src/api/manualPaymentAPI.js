import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : "http://localhost:5001/api/v1";

const withAuth = {
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

export const uploadManualPaymentProof = async (file) => {
  if (!file) {
    return "";
  }

  const formData = new FormData();
  formData.append("receipt", file);

  const response = await axios.post(`${API_BASE}/image/upload-receipt`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data?.data?.url || "";
};

export const generateManualPaymentReference = async ({ orderId, amount }) => {
  const response = await axios.post(
    `${API_BASE}/payments/generate-reference`,
    { orderId, amount },
    withAuth,
  );

  return response.data;
};

export const submitManualPaymentProof = async ({ referenceNumber, proofUrl }) => {
  const response = await axios.post(
    `${API_BASE}/manual-payment/submit-proof`,
    { referenceNumber, proofUrl },
    withAuth,
  );

  return response.data;
};

export const fetchMyManualPaymentStatus = async (paymentIdentifier) => {
  const response = await axios.get(
    `${API_BASE}/manual-payment/status/${encodeURIComponent(paymentIdentifier)}`,
    {
      withCredentials: true,
    },
  );

  return response.data;
};

export const fetchPendingManualPayments = async ({ status = "proof_submitted", page = 1, limit = 20 } = {}) => {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  query.set("page", String(page));
  query.set("limit", String(limit));

  const response = await axios.get(`${API_BASE}/admin/manual-payments?${query.toString()}`, {
    withCredentials: true,
  });

  return response.data;
};

export const fetchManualPaymentById = async (paymentId) => {
  const response = await axios.get(`${API_BASE}/admin/manual-payments/${paymentId}`, {
    withCredentials: true,
  });

  return response.data;
};

export const verifyManualPayment = async ({ paymentId, action, rejectionReason, adminNotes }) => {
  const response = await axios.put(
    `${API_BASE}/admin/manual-payments/${paymentId}/verify`,
    { action, rejectionReason, adminNotes },
    withAuth,
  );

  return response.data;
};
