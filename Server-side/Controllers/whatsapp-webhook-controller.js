const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const { sendWhatsAppMessage, cleanPhoneNumber } = require("../Utils/whatsapp-service");

// Webhook Verification (GET)
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

// Handle Incoming Webhook Event (POST)
exports.handleIncomingMessage = catchAsync(async (req, res, next) => {
  const body = req.body;

  // Verify this is an event from a WhatsApp API subscription
  if (body.object === "whatsapp_business_account") {
    // Acknowledge the receipt immediately to avoid Meta retrying
    res.status(200).send("EVENT_RECEIVED");

    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            const value = change.value;
            
            // Check if there is a message
            if (value.messages && value.messages.length > 0) {
              const message = value.messages[0];
              const phoneFrom = message.from;
              
              // We are interested in images or explicit text containing a SAGA reference
              if (message.type === "image" || message.type === "text") {
                const textContent = message.type === "text" ? message.text.body : "";
                const caption = message.type === "image" && message.image.caption ? message.image.caption : "";
                const combinedText = \`\${textContent} \${caption}\`;
                
                let extractedRef = "Unknown";
                const refMatch = combinedText.match(/SAGA-[A-Z0-9]+/i);
                
                if (refMatch) {
                  extractedRef = refMatch[0].toUpperCase();
                }
                
                // For this requirement, send the reply if it's an image OR if they provided a reference
                // (since sometimes they forget to attach the caption and send text before/after image)
                if (message.type === "image" || refMatch) {
                  const safeRef = extractedRef !== "Unknown" ? extractedRef : "[REF]";
                  const replyText = \`Thanks! We received your payment proof for reference \${safeRef}. We'll verify within 2-4 hours.\`;
                  
                  try {
                    await sendWhatsAppMessage({
                      to: phoneFrom,
                      message: replyText
                    });
                  } catch (err) {
                    console.error("Failed to auto-reply to webhook message", err);
                  }
                }
              }
            }
          }
        }
      }
    }
  } else {
    // Return a 404 if the event is not from a WhatsApp API
    res.sendStatus(404);
  }
});