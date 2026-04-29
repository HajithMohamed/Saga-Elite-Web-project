const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRandomCode = (length = 4) =>
  Array.from({ length }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join("");

const generateReference = (orderId) => {
  const shortId = String(orderId).slice(-4).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const code = generateRandomCode(4);

  return `SAGA-${shortId}-${date}-${code}`;
};

const generateUniqueReference = async (orderId, ManualPaymentModel) => {
  let referenceNumber;
  let existing;

  do {
    referenceNumber = generateReference(orderId);
    existing = await ManualPaymentModel.findOne({ referenceNumber });
  } while (existing);

  return referenceNumber;
};

module.exports = {
  generateUniqueReference,
};