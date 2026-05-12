import axios from "axios";
import { API_V1_URL as API_BASE } from "@/lib/api";

// Sample card-payment submission. Targets the demo gateway endpoint that
// records last4 + brand for admin verification. Replaces with the real
// PayHere call once hosting is in place.
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
