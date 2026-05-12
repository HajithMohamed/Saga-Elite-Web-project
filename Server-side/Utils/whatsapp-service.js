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

const isWhatsAppConfigured = () => {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(accessToken && phoneNumberId);
};

const postWhatsAppPayload = async (payload) => {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const url = buildWhatsAppMessagesUrl();

  if (!accessToken || !url) {
    return { skipped: true, reason: "WhatsApp API is not configured" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp message failed with ${response.status}: ${errorText}`);
  }

  return response.json();
};

const sendWhatsAppMessage = async ({ to, message }) => {
  const recipient = cleanPhoneNumber(to);

  if (!recipient) {
    throw new Error("WhatsApp recipient is required");
  }

  if (!message || !String(message).trim()) {
    throw new Error("WhatsApp message is required");
  }

  return postWhatsAppPayload({
    messaging_product: "whatsapp",
    to: recipient,
    type: "text",
    text: {
      preview_url: false,
      body: String(message),
    },
  });
};

const sendWhatsAppTemplateMessage = async ({
  to,
  templateName,
  languageCode = "en_US",
  bodyParameters = [],
  buttonParameters = [],
  buttonSubType = "url",
  buttonIndex = "0",
}) => {
  const recipient = cleanPhoneNumber(to);

  if (!recipient) {
    throw new Error("WhatsApp recipient is required");
  }

  if (!templateName || !String(templateName).trim()) {
    throw new Error("WhatsApp template name is required");
  }

  const components = [];
  if (bodyParameters.length) {
    components.push({
      type: "body",
      parameters: bodyParameters.map((text) => ({
        type: "text",
        text: String(text),
      })),
    });
  }

  if (buttonParameters.length) {
    components.push({
      type: "button",
      sub_type: buttonSubType,
      index: String(buttonIndex),
      parameters: buttonParameters.map((text) => ({
        type: "text",
        text: String(text),
      })),
    });
  }

  return postWhatsAppPayload({
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: String(templateName).trim(),
      language: { code: languageCode },
      ...(components.length ? { components } : {}),
    },
  });
};

module.exports = {
  cleanPhoneNumber,
  parsePhoneList,
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
  isWhatsAppConfigured,
};
