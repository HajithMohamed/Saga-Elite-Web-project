// Sri Lankan mobile number validator + normalizer.
//
// SL mobile numbers all start with 7 (carrier-assigned: 070/071/072/074/
// 075/076/077/078). Customers type them in three common formats:
//   - "0771234567"        (local, leading 0)
//   - "771234567"         (no leading 0, 9 digits)
//   - "+94771234567"      (international with +)
//   - "0094771234567"     (international with 00)
//   - "+94 77 123 4567"   (with separators)
// We strip non-digits, then validate the carrier prefix + length, then
// normalize to "+947XXXXXXXX" so downstream consumers (WhatsApp service,
// SMS templates, dedup) all see the same canonical form.

const VALID_MOBILE_PREFIXES = ["70", "71", "72", "74", "75", "76", "77", "78"];

const stripToDigits = (raw) => String(raw || "").replace(/[^\d]/g, "");

/**
 * Validate that the given input represents a Sri Lankan mobile number.
 * Accepts the formats above. Returns true/false.
 */
const isValidSriLankanMobile = (raw) => {
  const digits = stripToDigits(raw);
  if (!digits) return false;

  // Drop a 94 country code if present (handles both "+94..." which the
  // regex turns into "94..." and "0094..." which becomes "0094...").
  let local = digits;
  if (local.startsWith("0094")) local = local.slice(4);
  else if (local.startsWith("94") && local.length === 11) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);

  if (local.length !== 9) return false;
  const prefix = local.slice(0, 2);
  return VALID_MOBILE_PREFIXES.includes(prefix);
};

/**
 * Normalize an input phone number to the canonical "+947XXXXXXXX" form.
 * Returns null when the input isn't a valid SL mobile.
 */
const normalizeSriLankanMobile = (raw) => {
  if (!isValidSriLankanMobile(raw)) return null;
  const digits = stripToDigits(raw);
  let local = digits;
  if (local.startsWith("0094")) local = local.slice(4);
  else if (local.startsWith("94") && local.length === 11) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);
  return `+94${local}`;
};

module.exports = {
  isValidSriLankanMobile,
  normalizeSriLankanMobile,
  VALID_MOBILE_PREFIXES,
};
