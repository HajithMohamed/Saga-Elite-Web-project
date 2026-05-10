// Webhook for bank SMS notifications. A dedicated Android phone running an
// SMS forwarder (e.g., SMS Forwarder, SMSSync) is configured to POST every
// incoming SMS to this endpoint. Auth is by shared secret in the
// X-Webhook-Secret header — set BANK_SMS_WEBHOOK_SECRET on the server and
// configure the same value in the forwarder app.
//
// Expected body:
//   {
//     "from": "SAMPATH",
//     "body": "Credit Alert: LKR 4,500.00 to A/C XX2262 Ref: SEK7M3PQ ...",
//     "receivedAt": "2026-05-08T12:34:00Z",   // optional; defaults to now
//     "messageId": "android-uid-12345"          // optional but recommended; we
//                                                // synthesize one if missing
//   }
//
// The same processBankNotification path used by the IMAP watcher handles the
// payload, so an SMS-driven confirmation produces identical end-state to an
// email-driven one (status flip, order confirmed, customer + admin notified).

const express = require("express");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const { pickParser } = require("../Utils/bank-parsers");
const { processBankNotification } = require("../Utils/bank-email-watcher");
const logger = require("../Utils/logger");

const router = express.Router();

// Constant-time-ish secret comparison without depending on crypto.timingSafeEqual.
// The values are both small ascii strings — in practice this is fine.
const secretsMatch = (a = "", b = "") => {
  if (a.length !== b.length || a.length === 0) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

router.post(
  "/",
  catchAsync(async (req, res, next) => {
    const expectedSecret = process.env.BANK_SMS_WEBHOOK_SECRET || "";
    if (!expectedSecret) {
      return next(
        new AppError(
          "Bank SMS webhook is disabled (BANK_SMS_WEBHOOK_SECRET not configured).",
          503
        )
      );
    }

    const provided = String(req.headers["x-webhook-secret"] || "");
    if (!secretsMatch(provided, expectedSecret)) {
      logger.warn("Bank SMS webhook auth failed", {
        hasHeader: Boolean(provided),
      });
      return next(new AppError("Unauthorized", 401));
    }

    const { from, body, receivedAt, messageId } = req.body || {};

    if (!body || !String(body).trim()) {
      return next(new AppError("Missing SMS body", 400));
    }

    const fromAddress = String(from || "").trim().toLowerCase();
    const text = String(body).trim();
    const subject = `[SMS] ${fromAddress || "unknown"}`;
    const finalMessageId = String(messageId || "").trim() || `sms-${fromAddress}-${Date.now()}`;
    const notificationDate = receivedAt ? new Date(receivedAt) : new Date();

    // Parsers expect an "email-shaped" object with .text — give them one.
    // Most parsers already prioritize plain text over HTML so this works.
    const parser = pickParser(fromAddress, subject);
    let parsed;
    try {
      parsed = parser.parse({ text, html: "", subject, from: { value: [{ address: fromAddress }] } });
    } catch (parseError) {
      logger.error("Bank SMS parser threw", {
        bank: parser?.bankName,
        error: parseError?.message,
      });
      return next(new AppError("Could not parse SMS content", 422));
    }

    const ok = await processBankNotification({
      messageId: finalMessageId,
      source: "sms",
      fromAddress,
      subject,
      parsed,
      parser,
      snippet: text.slice(0, 2000),
      notificationDate,
    });

    if (!ok) {
      // processBankNotification returns false only on infra issues; ask the
      // forwarder to retry by returning 5xx. Most forwarders will retry on
      // 5xx and stop on 2xx.
      return next(new AppError("Could not process notification, please retry", 503));
    }

    return res.status(200).json({
      success: true,
      message: "Bank SMS notification processed",
      data: {
        bank: parser?.bankName || null,
        extractedReference: parsed?.reference || null,
        extractedAmount: parsed?.amount || null,
      },
    });
  })
);

module.exports = router;
