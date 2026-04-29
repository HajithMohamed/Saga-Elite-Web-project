const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

const cleanPhoneNumber = (value) => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized.replace(/[^\d]/g, "");
};

const parsePhoneList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => cleanPhoneNumber(item))
    .filter(Boolean);

const buildWhatsAppMessagesUrl = () => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!phoneNumberId) {
    return null;
  }

  return `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
};

const sendWhatsAppMessage = async ({ to, message }) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const url = buildWhatsAppMessagesUrl();
  const recipient = cleanPhoneNumber(to);

  if (!accessToken || !url) {
    throw new Error("WhatsApp API is not configured");
  }

  if (!recipient) {
    throw new Error("WhatsApp recipient is required");
  }

  if (!message || !String(message).trim()) {
    throw new Error("WhatsApp message is required");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: String(message),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp message failed with ${response.status}: ${errorText}`);
  }

  return response.json();
};

module.exports = {
  cleanPhoneNumber,
  parsePhoneList,
  sendWhatsAppMessage,
};