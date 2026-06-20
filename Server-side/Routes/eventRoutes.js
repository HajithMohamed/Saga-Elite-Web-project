const express = require("express");
const router = express.Router();
const {
  trackEventHandler,
  trackBatchHandler,
  getMyEvents,
  getBehavioralInsights,
} = require("../Controllers/eventController");
const { requireCustomer } = require("../Middlewares/customer-middleware");
const authMiddleware = require("../Middlewares/auth-middleware");
const { generalLimiter } = require("../Middlewares/rateLimitinMiddleware");

router.use(generalLimiter);

router.post("/track", requireCustomer, trackEventHandler);
router.post("/track-batch", requireCustomer, trackBatchHandler);
router.get("/my-events", requireCustomer, getMyEvents);
router.get("/insights", requireCustomer, authMiddleware, getBehavioralInsights);

module.exports = router;
