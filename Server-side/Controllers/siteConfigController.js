const SiteConfig = require("../Models/SiteConfig");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

// Public-readable keys returned in one shot by GET /about — admin form
// hydrates the editor from this list, and public pages (About / Contact /
// Footer / Policies / Announcement) call the same endpoint to render
// shop-owner content from DB.
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
  // Phase 1 CMS expansion — About page
  "about_timeline",
  "about_studio_gallery",
  // Policies (rich-text via Tiptap, stored as { html, plainText, lastUpdated, metaTitle, metaDescription })
  "policy_terms",
  "policy_privacy",
  "policy_refund",
  "policy_shipping",
  "policy_cookie",
  // Footer
  "footer_brand_description",
  "footer_quick_links",
  "footer_shop_links",
  "footer_support_links",
  "footer_payment_methods",
  "footer_copyright",
  // Announcement bar
  "announcement_bar",
  // Contact page extras
  "faq_items",
  "contact_form_settings",
  "whatsapp_cta",
  // Homepage / editorial CMS (Phase 2)
  "site_stats",
  "brand_features",
  "homepage_sections",
];

const REWARD_REVIEW_DISCOUNT_KEY = "reward_review_discount";

const DEFAULT_REWARD_REVIEW_DISCOUNT = {
  enabled: false,
  discountType: "percent",
  discountValue: 10,
  codePrefix: "REVIEW",
  expiryDays: 30,
  maxUses: 1,
};

const ALLOWED_KEYS = new Set([
  ...ABOUT_KEYS,
  "branding",
  "seo_pages",
  "maintenance",
  "bank_details",
  "low_stock_global_threshold",
  REWARD_REVIEW_DISCOUNT_KEY,
]);

exports.getConfig = catchAsync(async (req, res, next) => {
  const rawKey = (req.params.key || "").trim().toLowerCase();
  const doc = await SiteConfig.findOne({ key: rawKey });
  if (!doc) {
    if (rawKey === REWARD_REVIEW_DISCOUNT_KEY) {
      return res.status(200).json({ success: true, data: DEFAULT_REWARD_REVIEW_DISCOUNT });
    }
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
  if (!ALLOWED_KEYS.has(rawKey)) {
    return next(new AppError(`Unknown site-config key: ${rawKey}`, 400));
  }
  const doc = await SiteConfig.findOneAndUpdate(
    { key: rawKey },
    { value, label, updatedBy: req.userInfo._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: doc });
});
