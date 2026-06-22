const mongoose = require("mongoose");

const EVENT_TYPES = [
  "page_view",
  "product_view",
  "product_dwell",
  "search",
  "add_to_cart",
  "remove_from_cart",
  "add_to_wishlist",
  "remove_from_wishlist",
  "begin_checkout",
  "purchase",
  "order_status_change",
  "coupon_apply",
  "coupon_redeem",
  "newsletter_subscribe",
  "newsletter_unsubscribe",
  "review_submit",
  "review_helpful",
  "drop_view",
  "drop_notify",
  "login",
  "register",
  "logout",
  "email_open",
  "email_click",
  "campaign_click",
  "session_start",
  "session_end",
  "tier_change",
  "profile_update",
];

const customerEventSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: EVENT_TYPES,
    index: true,
  },
  eventName: {
    type: String,
    required: true,
    trim: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    ip: { type: String },
    userAgent: { type: String },
    deviceType: { type: String },
    pageUrl: { type: String },
    referrerUrl: { type: String },
    utm: {
      source: { type: String },
      medium: { type: String },
      campaign: { type: String },
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
});

customerEventSchema.index({ customerId: 1, eventType: 1, timestamp: -1 });
customerEventSchema.index({ customerId: 1, timestamp: -1 });
customerEventSchema.index({ eventType: 1, timestamp: -1 });
customerEventSchema.index({ sessionId: 1, timestamp: 1 });
customerEventSchema.index({ timestamp: -1 }, { expireAfterSeconds: 63072000 });

const CustomerEvent = mongoose.model("CustomerEvent", customerEventSchema);
module.exports = { CustomerEvent, EVENT_TYPES };
