const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    method: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-expire logs after 90 days
adminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
adminLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);
