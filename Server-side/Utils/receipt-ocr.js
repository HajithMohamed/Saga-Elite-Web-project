// Reads a bank receipt (image or PDF buffer) and extracts the payment
// reference and amount. Used by the manual-payment submission flow to make
// auto-verify / auto-reject decisions before the receipt is stored.
//
// Tesseract.js handles photographed/scanned images. pdf-parse extracts
// embedded text from digital bank statements (PDFs from internet banking)
// and renders image-only PDFs so Tesseract can OCR those pages too.

const { createWorker } = require("tesseract.js");
const { PDFParse } = require("pdf-parse");
const logger = require("./logger");

const MIN_READABLE_TEXT_LENGTH = 20;
const MAX_PDF_OCR_PAGES = 3;

// Reference is "SE" + 6 alphanumeric uppercase. Be permissive at parse time
// (OCR may insert spaces or hyphens) and re-normalize on the result.
const REFERENCE_PATTERN = /\bSE[\s\-]*[A-Z0-9]{4,8}\b/gi;

// Amount detection: matches "LKR 12,345.00" / "Rs. 12345" / "12,345.00 LKR"
// and bare large numbers when no currency hint is present. We deliberately
// favour numbers prefixed/suffixed by a currency token to avoid picking up
// account numbers or transaction IDs.
const CURRENCY_HINTS = /(?:LKR|Rs\.?|RUPEES?)/i;
const AMOUNT_WITH_CURRENCY = /(?:LKR|Rs\.?)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?)/gi;
const AMOUNT_TRAILING_CURRENCY = /([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:LKR|Rs\.?)/gi;
const AMOUNT_KEY_LABELED = /(?:amount|total|paid|transferred|debit(?:ed)?|credit(?:ed)?|payment)[^0-9]{0,30}([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?)/gi;

const normalizeReference = (raw) => {
  if (!raw) return null;
  const cleaned = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned.startsWith("SE")) return null;
  return cleaned.slice(0, 12);
};

const parseNumeric = (raw) => {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[\s,]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
};

const extractReferenceCandidates = (text) => {
  if (!text) return [];
  const matches = text.match(REFERENCE_PATTERN) || [];
  const seen = new Set();
  const candidates = [];
  for (const match of matches) {
    const normalized = normalizeReference(match);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push(normalized);
    }
  }
  return candidates;
};

const extractAmountCandidates = (text) => {
  if (!text) return [];
  const candidates = [];
  const collect = (regex) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const value = parseNumeric(match[1]);
      if (value !== null && value > 0) {
        candidates.push(value);
      }
    }
  };
  collect(AMOUNT_WITH_CURRENCY);
  collect(AMOUNT_TRAILING_CURRENCY);
  collect(AMOUNT_KEY_LABELED);
  return candidates;
};

const readImageWithWorker = async (worker, imageBuffer) => {
  const result = await worker.recognize(imageBuffer);
  return {
    text: String(result?.data?.text || "").trim(),
    confidence: Number.isFinite(result?.data?.confidence) ? result.data.confidence : null,
  };
};

const extractTextFromPdf = async (buffer) => {
  let parser;
  try {
    parser = new PDFParse({ data: buffer });

    let embeddedText = "";
    try {
      const result = await parser.getText();
      embeddedText = String(result?.text || "").trim();
    } catch (textError) {
      logger.warn("PDF embedded text extraction failed", { error: textError?.message });
    }

    if (embeddedText.length >= MIN_READABLE_TEXT_LENGTH) {
      return {
        text: embeddedText,
        confidence: null, // embedded PDF text extraction is not OCR
      };
    }

    let screenshotResult;
    try {
      screenshotResult = await parser.getScreenshot({
        scale: 2,
        first: MAX_PDF_OCR_PAGES,
      });
    } catch (screenshotError) {
      logger.warn("PDF screenshot rendering failed", { error: screenshotError?.message });
      return { text: embeddedText, confidence: null };
    }

    const pages = Array.isArray(screenshotResult?.pages) ? screenshotResult.pages : [];
    if (!pages.length) {
      return { text: embeddedText, confidence: null };
    }

    let worker;
    try {
      worker = await createWorker("eng");
      const pageTexts = [];
      const confidences = [];

      for (const page of pages) {
        const imageData = page?.data;
        if (!imageData) continue;

        const imageBuffer = Buffer.isBuffer(imageData)
          ? imageData
          : Buffer.from(imageData);
        const pageOcr = await readImageWithWorker(worker, imageBuffer);

        if (pageOcr.text) pageTexts.push(pageOcr.text);
        if (Number.isFinite(pageOcr.confidence)) confidences.push(pageOcr.confidence);
      }

      const combinedText = [embeddedText, ...pageTexts]
        .filter(Boolean)
        .join("\n\n")
        .trim();
      const confidence = confidences.length
        ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
        : null;

      return {
        text: combinedText,
        confidence,
      };
    } catch (ocrError) {
      logger.error("Tesseract OCR failed for PDF", { error: ocrError?.message });
      return { text: embeddedText, confidence: null };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          logger.warn("Tesseract worker terminate failed", { error: terminateError?.message });
        }
      }
    }
  } catch (error) {
    logger.warn("PDF parsing failed", { error: error?.message });
    return { text: "", confidence: null };
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        logger.warn("PDF parser destroy failed", { error: destroyError?.message });
      }
    }
  }
};

const extractTextFromImage = async (buffer) => {
  let worker;
  try {
    worker = await createWorker("eng");
    return await readImageWithWorker(worker, buffer);
  } catch (error) {
    logger.error("Tesseract OCR failed", { error: error?.message });
    return {
      text: "",
      confidence: null,
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        logger.warn("Tesseract worker terminate failed", { error: terminateError?.message });
      }
    }
  }
};

// Tolerance for amount matching. OCR sometimes loses a digit or commas, and
// real bank slips can include rounding when the customer adds the transfer
// fee. We accept ±1% OR ±2 LKR (whichever is larger) so a small rounding
// difference doesn't fail a legitimate receipt.
const isAmountMatch = (expected, found) => {
  if (!Number.isFinite(expected) || !Number.isFinite(found)) return false;
  const diff = Math.abs(expected - found);
  const tolerance = Math.max(2, expected * 0.01);
  return diff <= tolerance;
};

const pickBestAmountMatch = (expected, candidates) => {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const matches = candidates.filter((amount) => isAmountMatch(expected, amount));
  if (matches.length === 0) return null;
  return matches.reduce((best, current) =>
    Math.abs(current - expected) < Math.abs(best - expected) ? current : best
  );
};

/**
 * Process a receipt buffer end-to-end.
 *
 * @param {Buffer} buffer - file bytes (image or PDF)
 * @param {string} mimetype - file mimetype
 * @param {object} expected - { referenceNumber, amount }
 * @returns {Promise<object>} OCR result with decision metadata
 */
const processReceipt = async (buffer, mimetype, expected) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return {
      ok: false,
      reason: "empty_file",
      message: "Receipt file is empty.",
    };
  }

  const isPdf = String(mimetype || "").toLowerCase() === "application/pdf";
  const { text, confidence } = isPdf
    ? await extractTextFromPdf(buffer)
    : await extractTextFromImage(buffer);

  if (!text || text.length < MIN_READABLE_TEXT_LENGTH) {
    return {
      ok: false,
      reason: "unreadable",
      message: isPdf
        ? "Could not read text from this PDF. If it's a scanned document, please upload a clear photo instead."
        : "Receipt is not clearly readable. Please upload a brighter, sharper photo or a clean scan.",
      ocrText: text,
      ocrConfidence: confidence,
    };
  }

  const referenceCandidates = extractReferenceCandidates(text);
  const amountCandidates = extractAmountCandidates(text);
  const expectedReference = normalizeReference(expected?.referenceNumber);
  const expectedAmount = Number(expected?.amount);

  const matchedReference = referenceCandidates.find(
    (ref) => ref === expectedReference
  ) || null;
  const matchedAmount = pickBestAmountMatch(expectedAmount, amountCandidates);

  const referenceMatched = Boolean(matchedReference);
  const amountMatched = matchedAmount !== null;

  // Sanitize-before-store: refuse the upload entirely when neither field is
  // detectable. The receipt isn't usable as proof, so storing it is just
  // landfill. Customer is asked to upload a clearer copy.
  if (!referenceCandidates.length && !amountCandidates.length) {
    return {
      ok: false,
      reason: "no_fields_detected",
      message:
        "We couldn't detect a reference number or amount on this receipt. Please upload a clearer photo or scan that shows both fields.",
      ocrText: text,
      ocrConfidence: confidence,
    };
  }

  if (!referenceCandidates.length) {
    return {
      ok: false,
      reason: "reference_not_found",
      message:
        "We couldn't find your reference number on this receipt. Make sure the transfer remarks/description showing your reference is visible in the photo.",
      ocrText: text,
      ocrConfidence: confidence,
    };
  }

  // Reference candidates exist but none matches the expected reference —
  // this is a wrong-receipt case (could be a different order's slip). We
  // store it so admin can audit, but auto-reject.
  // "ocr_matched" is intentional: this layer can only confirm the slip
  // looks right. Bank-side confirmation (via the IMAP watcher) is what
  // actually upgrades a payment to "verified".
  let decision;
  let decisionReason;
  if (referenceMatched && amountMatched) {
    decision = "ocr_matched";
    decisionReason = `Reference ${matchedReference} and amount ${matchedAmount} both matched on the receipt — awaiting bank credit confirmation.`;
  } else if (!referenceMatched) {
    decision = "auto_rejected";
    decisionReason = `Reference on receipt (${referenceCandidates[0]}) does not match the order reference (${expectedReference}).`;
  } else if (!amountMatched) {
    decision = "auto_rejected";
    decisionReason = amountCandidates.length
      ? `Amount on receipt (${amountCandidates.join(", ")}) does not match the order amount (${expectedAmount}).`
      : `No amount could be extracted from the receipt to match against the order amount (${expectedAmount}).`;
  } else {
    decision = "manual_review";
    decisionReason = "OCR result inconclusive — sent to admin for manual review.";
  }

  return {
    ok: true,
    decision,
    decisionReason,
    referenceMatched,
    amountMatched,
    extractedReference: matchedReference || referenceCandidates[0] || null,
    extractedAmount: matchedAmount ?? amountCandidates[0] ?? null,
    referenceCandidates,
    amountCandidates,
    ocrText: text,
    ocrConfidence: confidence,
  };
};

module.exports = {
  processReceipt,
  extractReferenceCandidates,
  extractAmountCandidates,
  normalizeReference,
  isAmountMatch,
};
