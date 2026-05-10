import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

const withAuth = {
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

const appendEmailQuery = (url, email) => {
  if (!email) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}email=${encodeURIComponent(email)}`;
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

export const submitManualPaymentProof = async ({ referenceNumber, proofUrl, email }) => {
  const response = await axios.post(
    `${API_BASE}/manual-payment/submit-proof`,
    { referenceNumber, proofUrl, email },
    withAuth,
  );

  return response.data;
};

// New flow: send the receipt file directly. The server OCRs the receipt,
// validates reference + amount, and auto-verifies / auto-rejects in one
// round-trip. Replaces the old upload-then-submit two-step flow.
export const submitManualPaymentReceipt = async ({ referenceNumber, file, email }) => {
  const formData = new FormData();
  formData.append("receipt", file);
  formData.append("referenceNumber", referenceNumber);
  if (email) {
    formData.append("email", email);
  }

  const response = await axios.post(
    `${API_BASE}/manual-payment/submit-with-receipt`,
    formData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const fetchMyManualPaymentStatus = async (paymentIdentifier, { email } = {}) => {
  const url = appendEmailQuery(
    `${API_BASE}/manual-payment/status/${encodeURIComponent(paymentIdentifier)}`,
    email
  );

  const response = await axios.get(url, {
    withCredentials: true,
  });

  return response.data;
};

export const requestManualPaymentExtension = async ({ slug, email }) => {
  const response = await axios.post(
    `${API_BASE}/manual-payments/${encodeURIComponent(slug)}/request-extension`,
    { email },
    withAuth
  );
  return response.data;
};

export const sendManualPaymentLink = async ({ slug, email }) => {
  const response = await axios.post(
    `${API_BASE}/manual-payments/${encodeURIComponent(slug)}/send-link`,
    { email },
    withAuth
  );
  return response.data;
};

export const lookupManualPayment = async ({ email, identifier }) => {
  const response = await axios.post(
    `${API_BASE}/manual-payments/lookup`,
    { email, identifier },
    withAuth
  );
  return response.data;
};

export const fetchPendingManualPayments = async ({
  status = "proof_submitted",
  guestOnly = false,
  page = 1,
  limit = 20,
} = {}) => {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (guestOnly) query.set("guestOnly", "true");
  query.set("page", String(page));
  query.set("limit", String(limit));

  const response = await axios.get(`${API_BASE}/admin/manual-payments?${query.toString()}`, {
    withCredentials: true,
  });

  return response.data;
};

export const fetchManualPaymentMethodSummary = async ({ guestOnly = false } = {}) => {
  const query = new URLSearchParams();
  if (guestOnly) query.set("guestOnly", "true");
  const url = `${API_BASE}/admin/manual-payments/summary${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await axios.get(url, { withCredentials: true });
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
