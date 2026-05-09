// IMAP polling watcher that ingests bank credit-alert emails and upgrades
// the matching ManualPayment to fully verified. This is the only data source
// in the system that can prove money landed in the merchant's account — the
// OCR layer alone is just a sanity check on what the customer claims.
//
// The watcher polls every BANK_INBOX_POLL_INTERVAL_MS (default 2 min). For
// each unseen email from a configured bank-notification address it picks a
// parser, extracts {amount, reference, transactionId}, looks up the
// ManualPayment by reference, and:
//   - both match    → status flips to "verified", order to "confirmed"
//   - amount mismatch → flagged for admin review (no auto-verify)
//   - no payment    → recorded as OrphanBankCredit for manual reconciliation
//
// All decisions are idempotent on bankVerification.emailMessageId so retries
// or IMAP redeliveries can't double-credit a payment.

const ManualPayment = require("../Models/ManualPayment");
const OrphanBankCredit = require("../Models/OrphanBankCredit");
const Order = require("../Models/Order");
const { isAmountMatch, normalizeReference } = require("./receipt-ocr");
const { pickParser } = require("./bank-parsers");
const { ADMIN_ROLES } = require("./admin-roles");
const { createNotification, broadcastNotification } = require("./notification-service");
const SOCKET_EVENTS = require("./socket-events");
const { emitToAll, emitToUser } = require("./socket-service");
const sendEmail = require("./send-mail");
const buildEmailTemplate = require("./email-template");
const { cleanPhoneNumber, sendWhatsAppMessage } = require("./whatsapp-service");
const logger = require("./logger");

let watcherStarted = false;
let intervalHandle = null;
let consecutiveConnectFailures = 0;
let consecutiveParseFailures = 0;

const isEnabled = () => String(process.env.BANK_INBOX_ENABLED || "").toLowerCase() === "true";

const getConfig = () => ({
  host: process.env.BANK_INBOX_HOST,
  port: Number.parseInt(process.env.BANK_INBOX_PORT || "993", 10),
  secure: String(process.env.BANK_INBOX_TLS || "true").toLowerCase() !== "false",
  user: process.env.BANK_INBOX_USER,
  pass: process.env.BANK_INBOX_PASSWORD,
  folder: process.env.BANK_INBOX_FOLDER || "INBOX",
  pollIntervalMs:
    Number.parseInt(process.env.BANK_INBOX_POLL_INTERVAL_MS || "120000", 10) || 120000,
  fromAddresses: String(process.env.BANK_NOTIFICATION_FROM_ADDRESSES || "")
    .split(",")
    .map((addr) => addr.trim().toLowerCase())
    .filter(Boolean),
});

// Configurable threshold for how many consecutive errors before alerting admin
const FAILURE_ALERT_THRESHOLD = 3;

const alertAdmin = async (subject, body) => {
  const recipientsRaw = process.env.MANUAL_PAYMENT_ADMIN_EMAILS || "";
  const recipients = recipientsRaw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  if (!recipients.length) return;
  try {
    await sendEmail({
      email: recipients.join(","),
      subject,
      html: buildEmailTemplate(subject, body),
    });
  } catch (error) {
    logger.error("Failed to dispatch bank-watcher admin alert", { error: error?.message });
  }
};

// Notify customer + admin + sockets after a successful bank confirmation.
// Mirrors the auto-verified branch from manualPaymentController.submitWithReceipt
// so both code paths converge on the same downstream effects.
const fireConfirmationNotifications = async ({ payment, order, parsed, bankName }) => {
  const orderId = order?._id;
  const customerUserId = order?.user?._id || order?.user || payment.userId;
  const customerEmail = order?.user?.email || null;
  const customerPhone = cleanPhoneNumber(order?.contactNumber);

  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: "order",
      title: "Payment confirmed",
      message: `Your bank transfer for order ${orderId} has been confirmed by ${bankName}. Your order is being prepared.`,
      entityRef: orderId,
      entityType: "ManualPayment",
      meta: {
        orderId,
        referenceNumber: payment.referenceNumber,
        paymentId: payment._id,
        status: "verified",
        source: "bank-imap",
      },
    });
  }

  await broadcastNotification({
    type: "admin",
    title: "Payment auto-confirmed by bank",
    message: `Order ${orderId} reference ${payment.referenceNumber}: ${bankName} confirmed credit of ${parsed.amount}.`,
    entityRef: orderId,
    entityType: "ManualPayment",
    meta: {
      orderId,
      referenceNumber: payment.referenceNumber,
      paymentId: payment._id,
      status: "verified",
      source: "bank-imap",
    },
    filter: { role: { $in: ADMIN_ROLES } },
  });

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: "Your Saga Elite payment has been confirmed",
        html: buildEmailTemplate(
          "Payment confirmed",
          `<p>Great news — your bank transfer has cleared.</p>
           <p><strong>Reference:</strong> ${payment.referenceNumber}</p>
           <p><strong>Amount:</strong> LKR ${Number(payment.amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</p>
           <p>Your order is now being prepared. We'll notify you again when it ships.</p>`
        ),
      });
    } catch (error) {
      logger.error("Failed to email bank-confirmed customer", { error: error?.message });
    }
  }

  if (customerPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        message: `Saga Elite: your bank transfer for order ${orderId} has been confirmed (${payment.referenceNumber}). Your order is being prepared. Thank you.`,
      });
    } catch (error) {
      logger.error("Failed to WhatsApp bank-confirmed customer", { error: error?.message });
    }
  }

  emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "bank-imap-confirmed",
  });
  emitToAll(SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "bank-imap-confirmed",
  });
  emitToAll(SOCKET_EVENTS.ORDER_REFRESH, {
    userId: customerUserId,
    orderId,
    status: "confirmed",
    paymentStatus: "paid",
    source: "bank-imap-confirmed",
  });
  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: "bank-imap-confirmed",
    paymentId: payment._id,
    orderId,
    userId: customerUserId,
  });
};

// Process a single bank notification. Source-agnostic — IMAP, SMS, and the
// dev simulator all funnel through this function so verification semantics
// stay identical regardless of how the notification arrived.
//
// Required input shape:
//   { messageId, source, parsed, parser?, fromAddress, subject?, snippet, notificationDate }
// Where:
//   - source: "imap" | "sms" | "manual_admin" | "csv" (audit trail value)
//   - parsed: { amount, reference, transactionId } from a bank parser
//   - parser: optional, supplies bankName for the audit
//
// Returns true when the message reached a terminal decision (verified,
// mismatch, or orphan). Returns false only on infrastructure failures so the
// caller can retry (IMAP leaves the message UNSEEN, SMS webhook returns 5xx).
const processBankNotification = async ({
  messageId,
  source = "imap",
  parsed,
  parser,
  fromAddress,
  subject,
  snippet,
  notificationDate,
}) => {
  if (!messageId) {
    logger.warn("Bank notification has no message id; skipping for safety");
    return false;
  }

  const expectedReference = normalizeReference(parsed?.reference);
  const expectedAmount = Number(parsed?.amount);

  // Idempotency: if we've already processed this message, no-op.
  const alreadyProcessed = await ManualPayment.findOne({
    "bankVerification.emailMessageId": messageId,
  }).select("_id");
  if (alreadyProcessed) return true;
  const alreadyOrphaned = await OrphanBankCredit.findOne({ emailMessageId: messageId }).select("_id");
  if (alreadyOrphaned) return true;

  if (!expectedReference) {
    // Couldn't pull a reference at all — dead-letter as orphan so admin can
    // review. Still ack so we don't re-process the same garbage.
    await OrphanBankCredit.create({
      amount: Number.isFinite(expectedAmount) ? expectedAmount : 0,
      extractedReference: null,
      transactionId: parsed?.transactionId || null,
      bankName: parser?.bankName || null,
      emailMessageId: messageId,
      emailFrom: fromAddress,
      emailSubject: subject,
      emailDate: notificationDate,
      rawSnippet: snippet,
    });
    logger.info("Bank notification recorded as orphan (no reference found)", {
      messageId,
      fromAddress,
      source,
    });
    return true;
  }

  const payment = await ManualPayment.findOne({ referenceNumber: expectedReference })
    .populate({
      path: "orderId",
      populate: { path: "user", select: "email role profilePicture" },
    })
    .populate("userId", "email role profilePicture");

  if (!payment) {
    await OrphanBankCredit.create({
      amount: Number.isFinite(expectedAmount) ? expectedAmount : 0,
      extractedReference: expectedReference,
      transactionId: parsed?.transactionId || null,
      bankName: parser?.bankName || null,
      emailMessageId: messageId,
      emailFrom: fromAddress,
      emailSubject: subject,
      emailDate: notificationDate,
      rawSnippet: snippet,
    });
    logger.info("Bank notification recorded as orphan (no matching payment)", {
      messageId,
      reference: expectedReference,
      source,
    });
    return true;
  }

  const amountMatched = isAmountMatch(payment.amount, expectedAmount);
  const now = new Date();
  payment.bankVerification = {
    confirmed: amountMatched,
    confirmedAt: amountMatched ? now : null,
    source,
    bankName: parser?.bankName || null,
    emailMessageId: messageId,
    emailFrom: fromAddress,
    emailSubject: subject,
    extractedAmount: Number.isFinite(expectedAmount) ? expectedAmount : null,
    extractedReference: expectedReference,
    transactionId: parsed?.transactionId || null,
    amountMismatch: !amountMatched,
    rawSnippet: snippet,
  };

  if (amountMatched) {
    payment.status = "verified";
    payment.verifiedAt = now;
    payment.verifiedBy = null; // null = system / IMAP-confirmed
    payment.rejectionReason = null;
  }
  // If amount mismatched we deliberately do NOT change status — admin sees
  // the mismatch in their queue and decides.

  await payment.save({ validateModifiedOnly: true });

  const order = payment.orderId;
  if (order && amountMatched) {
    order.paymentMethod = "manual_bank_transfer";
    order.referenceNumber = payment.referenceNumber;
    order.paymentProofUrl = payment.proofUrl || order.paymentProofUrl || null;
    order.status = "confirmed";
    order.paymentStatus = "paid";
    order.expiresAt = undefined;
    await order.save({ validateModifiedOnly: true });

    await fireConfirmationNotifications({
      payment,
      order,
      parsed,
      bankName: parser?.bankName || "your bank",
    });
  } else if (order && !amountMatched) {
    // Mismatch alert — surface in admin queue.
    await broadcastNotification({
      type: "admin",
      title: "Bank credit amount mismatch",
      message:
        `Order ${order._id} ref ${payment.referenceNumber}: bank reported ${expectedAmount} ` +
        `but order amount is ${payment.amount}. Admin verification required.`,
      entityRef: order._id,
      entityType: "ManualPayment",
      meta: {
        orderId: order._id,
        paymentId: payment._id,
        referenceNumber: payment.referenceNumber,
        bankAmount: expectedAmount,
        orderAmount: payment.amount,
      },
      filter: { role: { $in: ADMIN_ROLES } },
    });

    emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
      source: "bank-imap-mismatch",
      paymentId: payment._id,
      orderId: order._id,
    });
  }

  return true;
};

// Open IMAP, fetch unseen messages from configured senders, process each.
// Returns count of decisions taken this sweep (for tests + logging).
const sweepInbox = async () => {
  const config = getConfig();

  if (!config.host || !config.user || !config.pass) {
    logger.warn("Bank inbox watcher: missing IMAP credentials, skipping sweep");
    return 0;
  }

  // Lazy-load imapflow / mailparser so the server still boots if these are
  // not installed (e.g., during transitional deploys).
  let ImapFlow;
  let simpleParser;
  try {
    ({ ImapFlow } = require("imapflow"));
    ({ simpleParser } = require("mailparser"));
  } catch (error) {
    logger.error("Bank inbox watcher: imapflow/mailparser not installed", {
      error: error?.message,
    });
    return 0;
  }

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  let processedCount = 0;

  try {
    await client.connect();
    consecutiveConnectFailures = 0;
    const lock = await client.getMailboxLock(config.folder);

    try {
      // SEARCH only by unseen — we filter by sender in JS to keep the search
      // simple and let the parser registry decide which sender is a bank.
      const uids = await client.search({ seen: false });

      for (const uid of uids) {
        let raw;
        try {
          // download() streams the raw RFC822 source. We read once into a
          // buffer, then hand to mailparser.
          const downloadResult = await client.download(uid, "", { uid: true });
          const chunks = [];
          for await (const chunk of downloadResult.content) {
            chunks.push(chunk);
          }
          raw = Buffer.concat(chunks);
        } catch (error) {
          logger.error("Failed to download bank email", { uid, error: error?.message });
          continue;
        }

        let parsedEmail;
        try {
          parsedEmail = await simpleParser(raw);
        } catch (error) {
          logger.error("Failed to parse bank email", { uid, error: error?.message });
          continue;
        }

        const fromAddress = String(parsedEmail.from?.value?.[0]?.address || "").toLowerCase();
        const subject = String(parsedEmail.subject || "");
        const messageId = parsedEmail.messageId || `imap-uid-${uid}`;
        const snippet = String(parsedEmail.text || parsedEmail.html || "")
          .replace(/\s+/g, " ")
          .slice(0, 2000);
        const emailDate = parsedEmail.date || new Date();

        // Sender allowlist — only emails from configured bank addresses are
        // considered. If the allowlist is empty we accept everything (useful
        // in development with a test mailbox).
        if (config.fromAddresses.length) {
          const allowed = config.fromAddresses.some((allowedAddr) =>
            fromAddress.endsWith(allowedAddr) || fromAddress === allowedAddr
          );
          if (!allowed) continue;
        }

        const parser = pickParser(fromAddress, subject);
        let parsed;
        try {
          parsed = parser.parse(parsedEmail);
        } catch (error) {
          consecutiveParseFailures += 1;
          logger.error("Bank parser threw", {
            bank: parser?.bankName,
            uid,
            error: error?.message,
          });
          if (consecutiveParseFailures === FAILURE_ALERT_THRESHOLD) {
            await alertAdmin(
              "Saga Elite: bank email parser failing repeatedly",
              `<p>The ${parser?.bankName || "generic"} parser has thrown ${FAILURE_ALERT_THRESHOLD} times in a row. The bank's email template may have changed. Manual review of incoming credits is recommended until the parser is updated.</p>`
            );
          }
          continue; // leave UNSEEN so we retry after fixing
        }

        try {
          const ok = await processBankNotification({
            messageId,
            source: "imap",
            fromAddress,
            subject,
            parsed,
            parser,
            snippet,
            notificationDate: emailDate,
          });
          if (ok) {
            await client.messageFlagsAdd({ uid }, ["\\Seen"], { uid: true });
            processedCount += 1;
            consecutiveParseFailures = 0;
          }
        } catch (error) {
          // Don't mark seen on processing exception — keep for retry.
          logger.error("Failed to process bank email", { uid, error: error?.message });
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    consecutiveConnectFailures += 1;
    logger.error("Bank inbox watcher connect/sweep failed", {
      error: error?.message,
      consecutiveConnectFailures,
    });
    if (consecutiveConnectFailures === FAILURE_ALERT_THRESHOLD) {
      await alertAdmin(
        "Saga Elite: bank inbox watcher cannot connect",
        `<p>The bank inbox watcher has failed to connect for ${FAILURE_ALERT_THRESHOLD} consecutive cycles. Bank credit notifications are not being ingested. Please check IMAP credentials and the inbox host. Last error: <code>${error?.message || "unknown"}</code></p>`
      );
    }
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }

  return processedCount;
};

const startBankInboxWatcher = () => {
  if (watcherStarted) return;
  if (!isEnabled()) {
    logger.info("Bank inbox watcher disabled (BANK_INBOX_ENABLED is not 'true')");
    return;
  }

  watcherStarted = true;
  const { pollIntervalMs } = getConfig();
  logger.info("Bank inbox watcher starting", { pollIntervalMs });

  // Kick off an initial sweep, then poll on an interval.
  sweepInbox().catch((error) =>
    logger.error("Initial bank inbox sweep failed", { error: error?.message })
  );

  intervalHandle = setInterval(() => {
    sweepInbox().catch((error) =>
      logger.error("Scheduled bank inbox sweep failed", { error: error?.message })
    );
  }, pollIntervalMs);
};

const stopBankInboxWatcher = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  watcherStarted = false;
};

module.exports = {
  startBankInboxWatcher,
  stopBankInboxWatcher,
  sweepInbox,
  processBankNotification,
};
