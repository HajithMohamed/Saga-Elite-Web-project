const mongoose = require("mongoose");

const CUSTOMER_CLASSIFICATIONS = Object.freeze([
  {
    key: "guest",
    label: "Guest",
    description: "Browsing without a registered account.",
  },
  {
    key: "new_customer",
    label: "New Customer",
    description: "Registered customer with no completed orders yet.",
  },
  {
    key: "registered",
    label: "Registered Customer",
    description: "Registered customer who does not match a stronger segment.",
  },
  {
    key: "frequent_customer",
    label: "Frequent Customer",
    description: "Repeat customer based on order count or frequent-buyer tag.",
  },
  {
    key: "high_value_customer",
    label: "High Value Customer",
    description: "Customer with high lifetime value or high-spender tag.",
  },
  {
    key: "at_risk_customer",
    label: "At Risk Customer",
    description: "Customer with elevated predicted churn risk.",
  },
  {
    key: "vip_customer",
    label: "VIP Customer",
    description: "VIP membership or VIP-tagged customer.",
  },
]);

const CUSTOMER_CLASSIFICATION_KEYS = CUSTOMER_CLASSIFICATIONS.map(
  (classification) => classification.key
);

const normalizeTags = (tags = []) =>
  new Set(
    (Array.isArray(tags) ? tags : [])
      .map((tag) => String(tag || "").trim().toLowerCase())
      .filter(Boolean)
  );

const resolveCustomerClassification = ({ customer = null, user = null } = {}) => {
  if (
    customer?.classificationOverride &&
    CUSTOMER_CLASSIFICATION_KEYS.includes(customer.classificationOverride)
  ) {
    return customer.classificationOverride;
  }

  const membership = String(user?.membership || "standard").toLowerCase();
  const tags = normalizeTags(user?.tags);
  const orderCount = Number(user?.orderCount || 0);
  const totalSpent = Number(user?.totalSpent || 0);
  const lifetimeValue = Number(customer?.customerLifetimeValue || 0);
  const churnRisk = Number(customer?.predictedChurnRisk || 0);

  if (membership === "vip" || tags.has("vip")) return "vip_customer";
  if (
    totalSpent >= 100000 ||
    lifetimeValue >= 100000 ||
    tags.has("high_spender")
  ) {
    return "high_value_customer";
  }
  if (orderCount >= 3 || tags.has("frequent_buyer")) return "frequent_customer";
  if (churnRisk >= 70) return "at_risk_customer";
  if (user?._id && orderCount === 0) return "new_customer";
  if (user?._id || customer?.type === "registered") return "registered";
  return "guest";
};

const viewedProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  viewedAt: { type: Date, default: Date.now },
  dwellMs: { type: Number, default: 0 },
  variantId: { type: mongoose.Schema.Types.ObjectId },
}, { _id: false });

const activityEntrySchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true },
  at: { type: Date, default: Date.now },
  meta: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

// ── Customer: thin enrichment layer only ──
// User remains the source of truth for registered account identity, auth,
// roles, loyalty, and order totals. Customer owns guest/session behavior,
// viewed products, preferences, and computed intelligence. Contact fields are
// lookup/fallback snapshots, not the authoritative registered-user profile.
const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["guest", "registered"],
    default: "guest",
    index: true,
  },

  // Links to existing models — these are the REAL data sources
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Guest",
  },

  guestToken: {
    type: String,
  },

  name: { type: String, trim: true },

  // Customer-owned behavioral enrichment.

  // Recently viewed products (capped at 100)
  viewedProducts: {
    type: [viewedProductSchema],
    default: [],
    validate: {
      validator: (v) => !v || v.length <= 100,
      message: "Viewed products capped at 100",
    },
  },

  // Activity log (capped at 200)
  activityLog: {
    type: [activityEntrySchema],
    default: [],
    validate: {
      validator: (v) => !v || v.length <= 200,
      message: "Activity log capped at 200",
    },
  },

  // Session tracking
  lastSessionAt: { type: Date, default: null },
  sessionCount: { type: Number, default: 0 },
  acquisitionChannel: { type: String, default: null },
  firstSeenAt: { type: Date, default: Date.now },

  // Behavioral intelligence (computed fields — not authoritative)
  behavioralScore: { type: Number, default: 0 },
  customerLifetimeValue: { type: Number, default: 0 },
  predictedChurnRisk: { type: Number, default: 0 },
  preferredCategories: { type: [String], default: [] },
  avgOrderValue: { type: Number, default: 0 },
  classificationOverride: {
    type: String,
    enum: CUSTOMER_CLASSIFICATION_KEYS,
    default: null,
    index: true,
  },

  // Preferences (unique to Customer — not in User or Guest)
  preferences: {
    promoOptIn: { type: Boolean, default: true },
    newsletterOptIn: { type: Boolean, default: false },
  },

  // Migration tracking
  migratedFromGuest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

customerSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } },
  }
);
customerSchema.index(
  { guestId: 1 },
  {
    unique: true,
    partialFilterExpression: { guestId: { $type: "objectId" } },
  }
);
customerSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: "objectId" } },
  }
);
customerSchema.index(
  { guestToken: 1 },
  {
    unique: true,
    partialFilterExpression: { guestToken: { $type: "string" } },
  }
);
customerSchema.index({ email: 1, type: 1 });
customerSchema.index({ guestToken: 1, type: 1 });
customerSchema.index({ lastSessionAt: -1 });
customerSchema.index({ behavioralScore: -1 });
customerSchema.index({ customerLifetimeValue: -1 });
customerSchema.index({ createdAt: -1 });

customerSchema.pre("save", function () {
  if (this.email == null) this.email = undefined;
  if (this.guestId == null) this.guestId = undefined;
  if (this.userId == null) this.userId = undefined;
  if (this.guestToken == null) this.guestToken = undefined;
  if (Array.isArray(this.activityLog) && this.activityLog.length > 200) {
    this.activityLog = this.activityLog.slice(-200);
  }
});

const Customer = mongoose.model("Customer", customerSchema);
Customer.CLASSIFICATIONS = CUSTOMER_CLASSIFICATIONS;
Customer.CLASSIFICATION_KEYS = CUSTOMER_CLASSIFICATION_KEYS;
Customer.resolveClassification = resolveCustomerClassification;

module.exports = Customer;
