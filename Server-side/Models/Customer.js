const mongoose = require("mongoose");

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
// This model does NOT duplicate User fields (totalSpent, membership, orderCount, etc.).
// The User model remains the single source of truth for loyalty & identity data.
// Customer adds: event-driven enrichment (viewed products, behavioral scores,
// session tracking, preferences) that User doesn't have.
const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
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
    sparse: true,
    unique: true,
    index: true,
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Guest",
    sparse: true,
    unique: true,
    index: true,
  },

  guestToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },

  name: { type: String, trim: true },

  // ── Enrichment fields only (no overlap with User) ──

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

customerSchema.index({ email: 1, type: 1 });
customerSchema.index({ guestToken: 1, type: 1 });
customerSchema.index({ lastSessionAt: -1 });
customerSchema.index({ behavioralScore: -1 });
customerSchema.index({ customerLifetimeValue: -1 });
customerSchema.index({ createdAt: -1 });

customerSchema.pre("save", function () {
  if (Array.isArray(this.activityLog) && this.activityLog.length > 200) {
    this.activityLog = this.activityLog.slice(-200);
  }
});

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
