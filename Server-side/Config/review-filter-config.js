module.exports = {
  BLOCKED_PATTERNS: [
    /\b(spam|scam|fake|fraud)\b/i,
    // Add additional profanity/blocked patterns here as needed
  ],
  AUTO_FLAG_MIN_LENGTH: 15,
  MAX_URLS_ALLOWED: 1,
};
