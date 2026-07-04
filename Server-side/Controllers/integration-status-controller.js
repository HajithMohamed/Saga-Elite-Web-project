const catchAsync = require("../Utils/catchAsync");

/* ============================================================
   Integration Status — read-only, super-admin only.

   Reports PRESENCE of third-party service configuration from
   process.env. Secret values never leave the server; only
   non-secret identifiers (emails, cloud names, model names)
   are returned, and even those are masked.
============================================================ */

const env = (...keys) => {
  for (const key of keys) {
    const value = String(process.env[key] || "").trim();
    if (value) return value;
  }
  return "";
};

// s***@d***.com — enough to recognise the account, never enough to use it.
const maskEmail = (value) => {
  const [local = "", domain = ""] = String(value).split("@");
  if (!domain) return maskText(value);
  return `${local.slice(0, 1)}***@${domain.slice(0, 1)}***${domain.slice(domain.indexOf("."))}`;
};

const maskText = (value) => {
  const str = String(value);
  if (str.length <= 3) return "***";
  return `${str.slice(0, 2)}***${str.slice(-1)}`;
};

const getIntegrationStatus = catchAsync(async (req, res) => {
  const smtpUser = env("SMTP_USER", "EMAIL");
  const smtpPass = env("SMTP_PASS", "PASS");
  const cloudName = env("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_NAME");
  const cloudKey = env("CLOUDINARY_API_KEY");
  const cloudSecret = env("CLOUDINARY_API_SECRET", "CLOUDINARY_SECRET");
  const waPhoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  const waToken = env("WHATSAPP_ACCESS_TOKEN", "WHATSAPP_API_TOKEN");
  const bankUser = env("BANK_INBOX_USER");
  const bankPass = env("BANK_INBOX_PASSWORD");
  const bankEnabled = env("BANK_INBOX_ENABLED").toLowerCase() === "true";
  const googleClientId = env("GOOGLE_CLIENT_ID");
  const fbAppId = env("FACEBOOK_APP_ID");
  const fbAppSecret = env("FACEBOOK_APP_SECRET");
  const openAiKey = env("OPENAI_API_KEY");
  const openAiModel = env("OPENAI_MODEL") || "gpt-4o-mini";
  const payhereMerchantId = env("PAYHERE_MERCHANT_ID");
  const payhereSecret = env("PAYHERE_MERCHANT_SECRET");
  const payhereSandbox = env("PAYHERE_SANDBOX").toLowerCase() !== "false";
  const mongoUri = env("MONGO_DB_URI", "MONGO_URI", "MONGODB_URI");
  const frontendUrl = env("FRONTEND_URL", "FRONTEND_URLS", "CLIENT_URL");

  const services = [
    {
      service: "Database (MongoDB)",
      description: "Primary data store connection string.",
      configured: Boolean(mongoUri),
      maskedIdentifier: mongoUri ? "URI set" : "",
      envHint: "MONGO_DB_URI / MONGO_URI / MONGODB_URI",
    },
    {
      service: "Email (SMTP)",
      description: "Transactional email — OTPs, order updates, receipts.",
      configured: Boolean(smtpUser && smtpPass),
      maskedIdentifier: smtpUser ? maskEmail(smtpUser) : "",
      envHint: "SMTP_HOST, SMTP_PORT, SMTP_USER/EMAIL, SMTP_PASS/PASS",
    },
    {
      service: "Cloudinary",
      description: "Image storage and delivery CDN.",
      configured: Boolean(cloudName && cloudKey && cloudSecret),
      maskedIdentifier: cloudName ? maskText(cloudName) : "",
      envHint: "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    },
    {
      service: "WhatsApp Business",
      description: "Customer notifications and admin alerts via WhatsApp.",
      configured: Boolean(waPhoneId && waToken),
      maskedIdentifier: waPhoneId ? maskText(waPhoneId) : "",
      envHint: "WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN",
    },
    {
      service: "Bank Inbox Watcher",
      description: "IMAP inbox polling for bank credit alerts (auto-verification).",
      configured: Boolean(bankEnabled && bankUser && bankPass),
      maskedIdentifier: bankUser ? maskEmail(bankUser) : "",
      envHint: "BANK_INBOX_ENABLED, BANK_INBOX_HOST, BANK_INBOX_USER, BANK_INBOX_PASSWORD",
    },
    {
      service: "Google OAuth",
      description: "Sign in with Google.",
      configured: Boolean(googleClientId),
      maskedIdentifier: googleClientId ? maskText(googleClientId) : "",
      envHint: "GOOGLE_CLIENT_ID (+ VITE_GOOGLE_CLIENT_ID for the frontend)",
    },
    {
      service: "Facebook OAuth",
      description: "Sign in with Facebook.",
      configured: Boolean(fbAppId && fbAppSecret),
      maskedIdentifier: fbAppId ? maskText(fbAppId) : "",
      envHint: "FACEBOOK_APP_ID, FACEBOOK_APP_SECRET",
    },
    {
      service: "OpenAI",
      description: "Review classification and receipt OCR enrichment.",
      configured: Boolean(openAiKey),
      maskedIdentifier: openAiKey ? openAiModel : "",
      envHint: "OPENAI_API_KEY, OPENAI_MODEL",
    },
    {
      service: "PayHere (Card Payments)",
      description: `Online card checkout — ${
        payhereSandbox ? "sandbox" : "LIVE"
      } mode. Needs BACKEND_URL set for the notify webhook.`,
      configured: Boolean(payhereMerchantId && payhereSecret),
      maskedIdentifier: payhereMerchantId ? maskText(payhereMerchantId) : "",
      envHint: "PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET, PAYHERE_SANDBOX",
    },
    {
      service: "Frontend URL (CORS)",
      description: "Allowed origins for production CORS.",
      configured: Boolean(frontendUrl),
      maskedIdentifier: frontendUrl ? frontendUrl.split(",")[0] : "",
      envHint: "FRONTEND_URL / FRONTEND_URLS / CLIENT_URL",
    },
  ];

  res.status(200).json({
    success: true,
    data: {
      services,
      note: "Values are managed in the server .env file. This panel reports configuration presence only.",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

module.exports = { getIntegrationStatus };
