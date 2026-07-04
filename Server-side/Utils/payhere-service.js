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
  PAYHERE_STATUS,
  isPayHereConfigured,
  isPayHereSandbox,
  getMerchantId,
  getCheckoutUrl,
  formatAmount,
  generateCheckoutHash,
  verifyNotifySignature,
};
