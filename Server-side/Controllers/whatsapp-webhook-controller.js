const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const {
  sendWhatsAppMessage,
  cleanPhoneNumber,
} = require("../Utils/whatsapp-service");

/* =========================
   WEBHOOK VERIFICATION (GET)
========================= */
exports.verifyWebhook = catchAsync(async (req, res, next) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }

  res.status(400).json({ error: "Invalid verification parameters" });
});

/* =========================
   HANDLE INCOMING MESSAGE (POST)
========================= */
exports.handleIncomingMessage = catchAsync(async (req, res, next) => {
  const body = req.body;

  console.log(
    "[WhatsApp webhook] POST received",
    body?.object,
    Array.isArray(body?.entry) ? body.entry.length : 0
  );

  // Always respond immediately to avoid retries from Meta
  if (body.object === "whatsapp_business_account") {
    res.status(200).send("EVENT_RECEIVED");

    if (body.entry?.length) {
      for (const entry of body.entry) {
        if (entry.changes?.length) {
          for (const change of entry.changes) {
            const value = change.value;

            if (!value.messages?.length) continue;

            const message = value.messages[0];
            const phoneFrom = message.from;

            // Only process text or image messages
            if (message.type === "text" || message.type === "image") {
              const textContent =
                message.type === "text" ? message.text?.body || "" : "";

              const caption =
                message.type === "image"
                  ? message.image?.caption || ""
                  : "";

              const combinedText = `${textContent} ${caption}`;

              // Extract reference like SAGA-XXXX
              let extractedRef = "Unknown";
              const refMatch = combinedText.match(/SAGA-[A-Z0-9]+/i);

              if (refMatch) {
                extractedRef = refMatch[0].toUpperCase();
              }

              // Reply only if image OR reference exists
              if (message.type === "image" || refMatch) {
                const safeRef =
                  extractedRef !== "Unknown" ? extractedRef : "[REF]";

                const replyText = `Thanks! We received your payment proof for reference ${safeRef}. We'll verify within 2-4 hours.`;

                try {
                  await sendWhatsAppMessage({
                    to: phoneFrom,
                    message: replyText,
                  });
                } catch (err) {
                  console.error(
                    "Failed to auto-reply to webhook message",
                    err
                  );
                }
              }
            }
          }
        }
      }
    }
  } else {
    return res.sendStatus(404);
  }
});