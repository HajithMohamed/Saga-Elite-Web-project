const crypto = require("crypto");

// PayHere Checkout API integration helpers — pure functions only (no DB, no
// Express). The merchant secret is used ONLY here to compute MD5 hashes; it is
// never returned to the browser, logged, or persisted.
//
// Docs: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
//
// Two hashes are involved:
//   1. Checkout hash — sent to the browser so PayHere can validate that the
//      payment request genuinely originated from us (prevents amount tampering).
//   2. Notify (md5sig) — sent by PayHere to our server-to-server notify_url so
//      WE can prove the callback genuinely came from PayHere. This callback is
//      the single source of truth for payment success; the browser callbacks
//      are UX hints only.

const SANDBOX_CHECKOUT_URL = "https://sandbox.payhere.lk/pay/checkout";
const LIVE_CHECKOUT_URL = "https://www.payhere.lk/pay/checkout";
const PAYHERE_NOTIFY_PATH = "/api/webhooks/payhere";

// PayHere notify status_code values.
const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
};

const getMerchantId = () => String(process.env.PAYHERE_MERCHANT_ID || "").trim();

const getMerchantSecret = () =>
  String(process.env.PAYHERE_MERCHANT_SECRET || "").trim();

// Sandbox unless explicitly turned off. Any value other than a falsey keyword
// keeps sandbox on, so a mis-set flag can never accidentally route sandbox
// credentials at the live gateway.
const isPayHereSandbox = () => {
  const raw = String(process.env.PAYHERE_SANDBOX ?? "true").trim().toLowerCase();
  return !["false", "0", "no", "off"].includes(raw);
};

const isPayHereConfigured = () => Boolean(getMerchantId() && getMerchantSecret());

const getCheckoutUrl = () =>
  isPayHereSandbox() ? SANDBOX_CHECKOUT_URL : LIVE_CHECKOUT_URL;

const trimTrailingSlash = (value) =>
  String(value || "").trim().replace(/\/+$/, "");

const firstHeaderValue = (value) =>
  String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)[0] || "";

const requestBaseUrl = (req) => {
  if (!req) return "";

  const host = firstHeaderValue(
    req.headers?.["x-forwarded-host"] || req.headers?.host || req.get?.("host")
  );
  if (!host) return "";

  const protocol =
    firstHeaderValue(req.headers?.["x-forwarded-proto"]) ||
    (req.secure ? "https" : req.protocol) ||
    "http";

  return `${protocol}://${host}`;
};

const isPrivateOrLocalHostname = (hostname) => {
  const host = String(hostname || "").replace(/^\[|\]$/g, "").toLowerCase();

  if (!host) return true;
  if (["localhost", "0.0.0.0", "::1"].includes(host)) return true;
  if (host.endsWith(".local")) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;

  return false;
};

const isPublicHttpUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !isPrivateOrLocalHostname(url.hostname)
    );
  } catch {
    return false;
  }
};

const resolvePayHereNotifyUrl = (req) => {
  const explicitNotifyUrl = trimTrailingSlash(process.env.PAYHERE_NOTIFY_URL || "");
  if (explicitNotifyUrl) {
    return {
      notifyUrl: explicitNotifyUrl,
      source: "PAYHERE_NOTIFY_URL",
      isPublic: isPublicHttpUrl(explicitNotifyUrl),
    };
  }

  const backendUrl = trimTrailingSlash(process.env.BACKEND_URL || "");
  if (backendUrl) {
    const notifyUrl = `${backendUrl}${PAYHERE_NOTIFY_PATH}`;
    return {
      notifyUrl,
      source: "BACKEND_URL",
      isPublic: isPublicHttpUrl(notifyUrl),
    };
  }

  const inferredBaseUrl = trimTrailingSlash(requestBaseUrl(req));
  const notifyUrl = inferredBaseUrl ? `${inferredBaseUrl}${PAYHERE_NOTIFY_PATH}` : "";

  return {
    notifyUrl,
    source: inferredBaseUrl ? "request-host" : "missing",
    isPublic: isPublicHttpUrl(notifyUrl),
  };
};

const md5Upper = (value) =>
  crypto.createHash("md5").update(String(value)).digest("hex").toUpperCase();

// PayHere requires the amount formatted to exactly 2 decimals with no thousands
// separators; the checkout hash must be computed over this exact string.
const formatAmount = (amount) => Number(amount || 0).toFixed(2);

// Checkout hash:
//   UPPER( md5( merchant_id + order_id + amount + currency + UPPER(md5(secret)) ) )
const generateCheckoutHash = ({ merchantId, orderId, amount, currency }) => {
  const secretHash = md5Upper(getMerchantSecret());
  return md5Upper(
    `${merchantId}${orderId}${formatAmount(amount)}${String(currency)}${secretHash}`
  );
};

// Notify signature verification. PayHere sends the amount/currency it actually
// processed (payhere_amount / payhere_currency) — we verify against those exact
// values and never recompute the amount ourselves.
//   local = UPPER( md5( merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(md5(secret)) ) )
const verifyNotifySignature = ({
  merchantId,
  orderId,
  payhereAmount,
  payhereCurrency,
  statusCode,
  receivedSig,
}) => {
  if (!receivedSig) return false;

  const secretHash = md5Upper(getMerchantSecret());
  const localSig = md5Upper(
    `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${secretHash}`
  );

  // Constant-time compare so a forged signature can't be probed via timing.
  // timingSafeEqual throws on length mismatch — a malformed sig fails closed.
  try {
    return crypto.timingSafeEqual(
      Buffer.from(localSig),
      Buffer.from(String(receivedSig).toUpperCase())
    );
  } catch {
    return false;
  }
};

module.exports = {
  PAYHERE_NOTIFY_PATH,
  PAYHERE_STATUS,
  isPayHereConfigured,
  isPayHereSandbox,
  getMerchantId,
  getCheckoutUrl,
  formatAmount,
  generateCheckoutHash,
  verifyNotifySignature,
  resolvePayHereNotifyUrl,
  isPublicHttpUrl,
};
