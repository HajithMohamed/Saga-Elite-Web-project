const express = require("express");
const whatsappWebhookController = require("../Controllers/whatsapp-webhook-controller");

const router = express.Router();

// Webhook Verification Endpoint (GET)
// Meta uses this to verify the webhook URL during setup.
router.get("/", whatsappWebhookController.verifyWebhook);

// Handle Incoming Webhook Events (POST)
// Meta sends WhatsApp message events to this endpoint.
router.post("/", whatsappWebhookController.handleIncomingMessage);

module.exports = router;
