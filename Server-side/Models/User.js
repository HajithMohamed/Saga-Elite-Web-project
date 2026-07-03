const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const slugify = require("slugify");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Provide a valid email address"],
    },

    username: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      validate: {
        validator: function (value) {
          if (this.provider === "google") return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
        },
        message:
          "Password must contain at least 8 characters, including uppercase, lowercase, number and special character",
      },
    },

    role: {
      type: String,
      enum: ["admin", "superadmin", "super_admin", "sub_admin", "user", "customer"],
      default: "customer",
    },

    subRole: {
      type: String,
      enum: ["order_manager", "product_manager", "marketing_manager",
             "support_admin", "inventory_manager", null],
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    permissions: {
      products:        { type: Boolean, default: false },
      orders:          { type: Boolean, default: false },
      users:           { type: Boolean, default: false },
      notifications:   { type: Boolean, default: false },
      drops:           { type: Boolean, default: false },
      verifyPayments:  { type: Boolean, default: false },
      manageReviews:   { type: Boolean, default: false },
      viewAnalytics:   { type: Boolean, default: false },
      sendCampaigns:   { type: Boolean, default: false },
      manageInventory: { type: Boolean, default: false },
      manageAdmins:    { type: Boolean, default: false },
    },

    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    profilePicture: String,

    // Sri Lankan mobile number, stored in canonical "+947XXXXXXXX" form so
    // that WhatsApp / SMS / lookup all see the same value. Required for
    // local signups (controller validates + normalizes before save). Google
    // signups land here with null because the OAuth profile doesn't carry
    // a phone — the client surfaces a "complete profile" prompt to backfill.
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || value === undefined || value === "") return true;
          // Accept canonical form. Free-form input is normalized in the
          // controller before reaching the model — anything else here is a
          // bug worth catching.
          return /^\+947\d{8}$/.test(value);
        },
        message:
          "Phone number must be a Sri Lankan mobile in +947XXXXXXXX format.",
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Set true when a super_admin resets this account's password.
    // Auth login surfaces a `must_change_password` status without issuing a
    // session token; client-side forced-rotation UI is a follow-up PR.
    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    membership: {
      type: String,
      enum: ["standard", "elite", "rare", "legend", "vip"],
      default: "standard",
      index: true,
    },

    // Admin-curated tags for fast filtering/segmentation. Distinct from
    // `membership` (which is a tier) — tags are descriptive, multi-select,
    // and can stack: a VIP can also be a "drop_collector" + "refund_risk".
    tags: {
      type: [String],
      enum: [
        "vip",
        "high_spender",
        "drop_collector",
        "frequent_buyer",
        "refund_risk",
        "early_supporter",
      ],
      default: [],
      index: true,
    },

    // Append-only admin commentary. Each entry captures who wrote it and
    // when so we have a clear audit trail when handling support escalations.
    adminNotes: [
      {
        note: { type: String, trim: true, maxlength: 2000 },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    totalSpent: {
      type: Number,
      default: 0,
    },

    orderCount: {
      type: Number,
      default: 0,
    },

    lastOrderAt: {
      type: Date,
      default: null,
    },

    otp: String,
    otpExpires: Date,

    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorOtp: {
      type: String,
      select: false,
    },
    twoFactorOtpExpires: Date,

    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    addresses: [
      {
        label: { type: String, trim: true },
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        district: { type: String, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true, default: "Sri Lanka" },
        isDefault: { type: Boolean, default: false }
      }
    ],
    savedPaymentMethod: {
      type: String,
      enum: ["payhere", "gpay", "manual", "manual_bank_transfer", "card", "lankapay", "cash"],
    }
  },
  { timestamps: true }
);

userSchema.pre("save", function () {
  if (!this.slug || this.isModified("email")) {
    const local = (this.email || "user").split("@")[0] || "user";
    const tail = String(this._id || "").slice(-6) || Math.random().toString(36).slice(2, 8);
    this.slug = slugify(`${local}-${tail}`, { lower: true, strict: true });
  }
});

// ── Fixed pre-save hook (Mongoose 9.x style) ──
userSchema.pre("save", async function () {
  // Skip if no password or not modified
  if (!this.password || !this.isModified("password")) {
    return; // ← just return — Mongoose continues automatically
  }

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  // No need for next() — async function resolves → save proceeds
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// userSchema.index({ googleId: 1 }); // Removed duplicate index

module.exports = mongoose.model("User", userSchema);
