// Generic fallback parser. Used when no bank-specific parser claims a credit
// notification email. It scans the body for a Saga-Elite-shaped reference
// (SE + 4–8 alphanumeric) and the largest currency-tagged amount. Less
// reliable than a per-bank parser but good enough to recover most cases.

const {
  extractReferenceCandidates,
  extractAmountCandidates,
} = require("../receipt-ocr");

const TXN_ID_PATTERNS = [
  /\bTxn\.?\s*(?:ID|No\.?|#)\s*[:\-]?\s*([A-Z0-9-]{6,40})/i,
  /\bReference\s*(?:No\.?|#)\s*[:\-]?\s*([A-Z0-9-]{6,40})/i,
  /\bTransaction\s*(?:ID|No\.?|#)\s*[:\-]?\s*([A-Z0-9-]{6,40})/i,
];

const ACCOUNT_LAST4_PATTERN = /(?:account|a\/c)[^0-9]{0,20}(?:ending|x{2,}|\*{2,})\s*(\d{3,6})/i;

const matches = () => true; // last-resort fallback — always claims, lowest priority

const pickLargest = (numbers) => {
  if (!Array.isArray(numbers) || numbers.length === 0) return null;
  return numbers.reduce((max, current) => (current > max ? current : max), numbers[0]);
};

const parse = (email) => {
  const text = String(email?.text || email?.html || "");
  const references = extractReferenceCandidates(text);
  const amounts = extractAmountCandidates(text);

  let transactionId = null;
  for (const pattern of TXN_ID_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      transactionId = match[1];
      break;
    }
  }

  const accountMatch = text.match(ACCOUNT_LAST4_PATTERN);
  const accountLast4 = accountMatch?.[1] || null;

  return {
    amount: pickLargest(amounts),
    reference: references[0] || null,
    transactionId,
    accountLast4,
  };
};

module.exports = {
  bankName: "Generic",
  matches,
  parse,
};
