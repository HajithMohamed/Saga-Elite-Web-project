const SiteConfig = require("../Models/SiteConfig");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

// Public-readable keys returned in one shot by GET /about — admin form
// hydrates the editor from this list, and public pages (About / Contact /
// Footer) call the same endpoint to render shop-owner content from DB.
const ABOUT_KEYS = [
  // Legacy keys — still saved in the same shape, structured editors UI now.
  "about_brand_story",
  "about_stats",
  "about_values",
  "about_team_heading",
  "about_team_subtext",
  // Brand identity
  "shop_brand_name",
  "shop_tagline",
  "shop_logo_url",
  "shop_founded_year",
  "shop_hero_eyebrow",
  "shop_hero_headline",
  // Founder
  "shop_founder_name",
  "shop_founder_title",
  "shop_founder_bio",
  "shop_founder_photo_url",
  // Contact
  "shop_contact_email",
  "shop_support_email",
  "shop_contact_phone",
  "shop_whatsapp_number",
  "shop_address_line1",
  "shop_address_line2",
  "shop_address_city",
  "shop_address_postal",
  "shop_address_country",
  "shop_hours",
  "shop_map_embed_url",
  // Socials
  "shop_social_instagram",
  "shop_social_facebook",
  "shop_social_tiktok",
  "shop_social_youtube",
  "shop_social_twitter",
  // Team / materials / press
  "shop_team_members",
  "shop_materials",
  "shop_press_quotes",
];

exports.getConfig = catchAsync(async (req, res, next) => {
  const rawKey = (req.params.key || "").trim().toLowerCase();
  const doc = await SiteConfig.findOne({ key: rawKey });
  if (!doc) {
    return next(new AppError("Config not found", 404));
  }
  res.status(200).json({ success: true, data: doc.value });
});

exports.getAboutPageConfig = catchAsync(async (_req, res) => {
  const docs = await SiteConfig.find({ key: { $in: ABOUT_KEYS } });
  const result = {};
  docs.forEach((d) => {
    result[d.key] = d.value;
  });
  res.status(200).json({ success: true, data: result });
});

exports.upsertConfig = catchAsync(async (req, res, next) => {
  const rawKey = (req.params.key || "").trim().toLowerCase();
  const { value, label } = req.body;
  if (value === undefined) {
    return next(new AppError("value is required", 400));
  }
  const doc = await SiteConfig.findOneAndUpdate(
    { key: rawKey },
    { value, label, updatedBy: req.userInfo._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: doc });
});
