import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";
import axiosInstance from "@/api/axiosInstance";

// Legacy sample card-payment submission — used only as a fallback when PayHere
// is not configured. Records last4 + brand for admin verification; the real
// card charge goes through PayHere (see initiatePayHerePayment below).
export const submitSampleCardPayment = async ({
  orderId,
  cardholderName,
  cardNumber,
  expiryMonth,
  expiryYear,
  cvv,
  email,
}) => {
  const response = await axios.post(
    `${API_BASE}/card-payment/submit-sample`,
    {
      orderId,
      cardholderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      email,
    },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-payment-email": email } : {}),
      },
    },
  );

  return response.data;
};

// Whether the real PayHere gateway is available (and sandbox vs live). The
// card-payment page uses this to decide between the PayHere popup and the
// legacy sample form.
export const fetchPayHereConfig = async () => {
  const { data } = await axiosInstance.get("/card-payment/payhere/config");
  return data?.data || { enabled: false, sandbox: true };
};

// Ask the backend to create/reuse a card payment record and return a
// PayHere-signed payment object ready for payhere.startPayment(). The merchant
// secret and hashing stay server-side; we only ever receive the public hash.
export const initiatePayHerePayment = async ({
  orderId,
  email,
  firstName,
  lastName,
  city,
}) => {
  const { data } = await axiosInstance.post(
    "/card-payment/payhere/initiate",
    { orderId, email, firstName, lastName, city },
    email ? { headers: { "x-payment-email": email } } : undefined,
  );
  return data?.data;
};

// Poll the payment status after the PayHere popup completes — the order is
// confirmed asynchronously by the notify webhook, so the UI waits for the
// record to flip to "verified".
export const fetchCardPaymentStatus = async ({ reference, email }) => {
  const { data } = await axiosInstance.get(
    `/manual-payment/status/${encodeURIComponent(reference)}`,
    email ? { headers: { "x-payment-email": email } } : undefined,
  );
  return data?.data;
};
