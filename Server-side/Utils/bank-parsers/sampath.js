// Parser for Sampath Bank credit-alert emails. Sampath sends notifications
// from notify@sampath.lk / alerts@sampath.lk with subjects like
// "Account Credit Notification" and a body that contains the credited
// amount, the customer's remarks (which carries our reference), and the
// bank's transaction reference.
//
// The merchant configures internet banking to route credit alerts to the
// payments@... mailbox, and this parser converts each one into a structured
// {amount, reference, transactionId} record for the watcher.

const {
  extractReferenceCandidates,
} = require("../receipt-ocr");

// Match both email senders (notify@sampath.lk) and SMS sender IDs (e.g.
// "Sampath", "SAMBNK", "Sampath Bank") so the same parser handles both
// notification channels.
const SAMPATH_FROM_PATTERNS = [
  /@sampath\.lk$/i,
  /sampath[\.\-_\s]?bank/i,
  /^sam(p)?(ath)?(bnk|bank)?$/i,
  /^sampath$/i,
];

const SAMPATH_SUBJECT_HINTS = [
  /credit/i,
  /deposit/i,
  /received/i,
  /transaction\s*alert/i,
];

// Capture amount lines like:
//   "Amount: LKR 4,500.00"
//   "Credit Amount LKR 4,500.00"
//   "An amount of LKR 4,500.00 has been credited"
const SAMPATH_AMOUNT_PATTERNS = [
  /(?:credit(?:ed)?\s*amount|amount\s*credit(?:ed)?|amount)\s*[:\-]?\s*(?:LKR|Rs\.?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
  /(?:LKR|Rs\.?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:has\s+been\s+credit(?:ed)?|credit(?:ed)?\s+to)/i,
];

const SAMPATH_TXN_PATTERNS = [
  /(?:Txn|Transaction)\s*(?:ID|No\.?|Ref(?:erence)?)\s*[:\-]?\s*([A-Z0-9-]{6,40})/i,
  /\bRef(?:erence)?\s*No\.?\s*[:\-]?\s*([A-Z0-9-]{6,40})/i,
];

const SAMPATH_REMARKS_PATTERNS = [
  /(?:Remarks?|Description|Narration)\s*[:\-]\s*([^\r\n]{1,120})/i,
];

const SAMPATH_ACCOUNT_PATTERN = /(?:account|a\/c)[^0-9]{0,20}(?:ending|x{2,}|\*{2,})\s*(\d{3,6})/i;

const matches = (fromAddress, subject) => {
  const from = String(fromAddress || "").toLowerCase();
  const subj = String(subject || "");
  const fromMatches = SAMPATH_FROM_PATTERNS.some((pattern) => pattern.test(from));
  if (!fromMatches) return false;
  // Sampath only — accept any subject from a Sampath sender. Extra subject
  // hint check is best-effort, not gating.
  return SAMPATH_SUBJECT_HINTS.some((pattern) => pattern.test(subj)) || true;
};

const parseAmount = (text) => {
  for (const pattern of SAMPATH_AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number.parseFloat(match[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return null;
};

const parseTransactionId = (text) => {
  for (const pattern of SAMPATH_TXN_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const parseRemarks = (text) => {
  for (const pattern of SAMPATH_REMARKS_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
};

const parse = (email) => {
  const text = String(email?.text || email?.html || "");

  // Reference: prefer the Saga-shaped code anywhere in the email; the
  // remarks line usually contains it but customers occasionally append
  // notes before it. Fall back to scanning the whole body.
  const remarks = parseRemarks(text);
  const referencesFromRemarks = extractReferenceCandidates(remarks);
  const referencesFromBody = extractReferenceCandidates(text);
  const reference =
    referencesFromRemarks[0] || referencesFromBody[0] || null;

  const amount = parseAmount(text);
  const transactionId = parseTransactionId(text);
  const accountMatch = text.match(SAMPATH_ACCOUNT_PATTERN);

  return {
    amount,
    reference,
    transactionId,
    accountLast4: accountMatch?.[1] || null,
  };
};

module.exports = {
  bankName: "Sampath Bank",
  matches,
  parse,
};
