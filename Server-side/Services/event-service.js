const { CustomerEvent } = require("../Models/CustomerEvent");
const Customer = require("../Models/Customer");
const logger = require("../Utils/logger");

const BATCH_SIZE = 50;
let eventBuffer = [];
let flushTimer = null;

const inferDeviceType = (ua) => {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
};

const processEvent = async (event) => {
  try {
    if (!event.customerId || !event.eventType) return;

    const now = new Date();

    switch (event.eventType) {
      case "session_start":
        await Customer.findByIdAndUpdate(event.customerId, {
          lastSessionAt: now,
          $inc: { sessionCount: 1 },
        });
        break;

      case "session_end": {
        const ms = event.payload?.durationMs || 0;
        if (ms > 5000) {
          await Customer.findByIdAndUpdate(event.customerId, {
            lastSessionAt: now,
          });
        }
        break;
      }

      case "product_view":
        if (event.payload?.productId) {
          await Customer.findByIdAndUpdate(event.customerId, {
            $pull: {
              viewedProducts: { product: event.payload.productId },
            },
          });
          await Customer.findByIdAndUpdate(event.customerId, {
            $push: {
              viewedProducts: {
                $each: [{
                  product: event.payload.productId,
                  viewedAt: now,
                  dwellMs: event.payload.dwellMs || 0,
                  variantId: event.payload.variantId || null,
                }],
                $position: 0,
              },
            },
          });
        }
        break;

      case "page_view": {
        const update = { lastSessionAt: now };
        if (event.payload?.channel) {
          update.acquisitionChannel = event.payload.channel;
        }
        if (event.payload?.category) {
          await Customer.findByIdAndUpdate(event.customerId, {
            $addToSet: { preferredCategories: event.payload.category },
          });
        }
        await Customer.findByIdAndUpdate(event.customerId, update);
        break;
      }

      // NOTE: purchase, register, tier_change, login events are tracked
      // for historical data only. Loyalty/membership/order fields live on
      // the User model and are managed by order-controller.js and
      // membership-tier.js — those remain the single source of truth.

      case "add_to_cart":
      case "remove_from_cart":
      case "add_to_wishlist":
      case "remove_from_wishlist":
      case "begin_checkout":
      case "search":
      case "newsletter_subscribe":
      case "newsletter_unsubscribe":
      case "review_submit":
      case "review_helpful":
      case "drop_view":
      case "drop_notify":
      case "login":
      case "register":
      case "logout":
      case "coupon_apply":
      case "coupon_redeem":
      case "email_open":
      case "email_click":
      case "campaign_click":
      case "order_status_change":
        await Customer.findByIdAndUpdate(event.customerId, {
          lastSessionAt: now,
        });
        break;

      default:
        break;
    }
  } catch (err) {
    logger.error("[event-service] processEvent failed", {
      eventType: event.eventType,
      customerId: event.customerId,
      error: err.message,
    });
  }
};

const flushEvents = async () => {
  if (eventBuffer.length === 0) return;
  const batch = eventBuffer.splice(0);
  eventBuffer = [];

  try {
    await CustomerEvent.insertMany(batch, { ordered: false });

    for (const event of batch) {
      await processEvent(event);
    }
  } catch (err) {
    logger.error("[event-service] flush failed", {
      count: batch.length,
      error: err.message,
    });
  }
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents().catch((err) => {
      logger.error("[event-service] scheduled flush error", { error: err.message });
    });
  }, 5000);
};

const trackEvent = async ({
  customerId,
  sessionId,
  eventType,
  eventName,
  payload = {},
  metadata = {},
  timestamp,
}) => {
  if (!customerId) {
    logger.warn("[event-service] trackEvent skipped: no customerId");
    return;
  }

  const event = {
    customerId,
    sessionId: sessionId || null,
    eventType,
    eventName: eventName || eventType,
    payload: {
      ...payload,
    },
    metadata: {
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null,
      deviceType: metadata.deviceType || inferDeviceType(metadata.userAgent),
      pageUrl: metadata.pageUrl || null,
      referrerUrl: metadata.referrerUrl || null,
      utm: metadata.utm || null,
    },
    timestamp: timestamp || new Date(),
  };

  eventBuffer.push(event);

  if (eventBuffer.length >= BATCH_SIZE) {
    await flushEvents();
  } else {
    scheduleFlush();
  }
};

const trackEventSync = async (params) => {
  await trackEvent(params);
};

const getCustomerEvents = async (customerId, { limit = 50, offset = 0, eventType } = {}) => {
  const filter = { customerId };
  if (eventType) filter.eventType = eventType;

  return CustomerEvent.find(filter)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
};

const getCustomerEventCount = async (customerId, { since, eventType } = {}) => {
  const filter = { customerId };
  if (since) filter.timestamp = { $gte: since };
  if (eventType) filter.eventType = eventType;
  return CustomerEvent.countDocuments(filter);
};

module.exports = {
  trackEvent: trackEventSync,
  flushEvents,
  getCustomerEvents,
  getCustomerEventCount,
  inferDeviceType,
};
