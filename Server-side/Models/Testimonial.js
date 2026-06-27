const mongoose = require("mongoose");

// Customer testimonials shown in the homepage "What members say" carousel.
// Single source of truth — replaces the previously hardcoded array in
// Client-Side/src/components/landing/LandingSections.jsx. (Distinct from the
// Influencer CRM and the About-page `shop_press_quotes` siteConfig key.)
const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    handle: { type: String, trim: true, maxlength: 60, default: "" },
    avatar: { type: String, trim: true, maxlength: 500, default: "" },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    text: { type: String, required: true, trim: true, maxlength: 600 },
    verified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
