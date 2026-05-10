// Reference format: "SE" + 6 random alphanumeric uppercase chars (8 chars total).
// Sized to fit Sri Lankan bank transfer remarks fields, which truncate at 10–18
// characters across most local banks. The character set excludes look-alike
// glyphs (0/O, 1/I/L) so customers can re-type from a printed ATM slip without
// confusion.

const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const REFERENCE_PREFIX = "SE";
const RANDOM_LENGTH = 6;

const generateRandomCode = (length) =>
  Array.from({ length }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join("");

const generateReference = () => `${REFERENCE_PREFIX}${generateRandomCode(RANDOM_LENGTH)}`;

const generateUniqueReference = async (orderId, ManualPaymentModel) => {
  let referenceNumber;
  let existing;

  do {
    referenceNumber = generateReference();
    existing = await ManualPaymentModel.findOne({ referenceNumber });
  } while (existing);

  return referenceNumber;
};

module.exports = {
  generateUniqueReference,
  generateReference,
  REFERENCE_PREFIX,
};
