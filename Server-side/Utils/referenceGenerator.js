const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRandomCode = (length = 4) =>
  Array.from({ length }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join("");

const generateReference = () => {
  const code = generateRandomCode(4);
  return `SAGA-${code}`;
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