const SiteConfig = require("../Models/SiteConfig");
const { POLICY_SEED_VALUES } = require("./legal-policy-seed-html");

const DEFAULT_ABOUT_ROWS = [
  {
    key: "about_brand_story",
    label: "Brand Story Paragraphs",
    value: [
      "Welcome to Saga Elite — a proudly Sri Lankan fashion and lifestyle brand born from a love for modern style and premium craftsmanship.",
      "We started with a simple belief: that everyone deserves access to high-quality, contemporary fashion without exclusive price tags. Rooted in local culture but inspired by global trends, Saga Elite is more than clothing — it's a community of people who express themselves boldly every day.",
      "Our pieces are designed with premium materials so every drop looks incredible and feels made for you — from our roots to your wardrobe.",
    ],
  },
  {
    key: "about_stats",
    label: "About Page Stats",
    value: [
      { number: 100, suffix: "+", label: "Products launched" },
      { number: 15, suffix: "", label: "Days delivery island-wide" },
      { number: "LK", suffix: "", label: "Proudly Sri Lankan" },
    ],
  },
  {
    key: "about_values",
    label: "Brand Values",
    value: [
      {
        icon: "ShieldCheck",
        title: "Premium Quality",
        desc: "Materials and construction chosen for longevity and comfort.",
      },
      {
        icon: "Users",
        title: "Community First",
        desc: "Built with Sri Lankan youth and diaspora at the centre.",
      },
      {
        icon: "Zap",
        title: "Drop Culture",
        desc: "Limited releases — rare fit, forever mindset.",
      },
    ],
  },
  {
    key: "about_team_heading",
    label: "Team Section Heading",
    value: "Our Story, In Your Hands",
  },
  {
    key: "about_team_subtext",
    label: "Team Section Subtext",
    value: "Team imagery coming soon — the spotlight is on you.",
  },
  {
    key: "shop_hero_eyebrow",
    label: "About Hero Eyebrow",
    value: "Sri Lanka · Drop culture",
  },
  {
    key: "shop_hero_headline",
    label: "About Hero Headline",
    value: "Rare fit, forever.",
  },
  {
    key: "footer_brand_description",
    label: "Footer Brand Description",
    value:
      "Limited edition fashion inspired by street culture, exclusivity, and modern youth identity — proudly made in Sri Lanka.",
  },
  {
    key: "footer_copyright",
    label: "Footer Copyright",
    value: "© {year} Saga Elite. All rights reserved.",
  },
  {
    key: "policy_terms",
    label: "Terms & Conditions Policy",
    value: POLICY_SEED_VALUES.policy_terms,
  },
  {
    key: "policy_privacy",
    label: "Privacy Policy",
    value: POLICY_SEED_VALUES.policy_privacy,
  },
  {
    key: "policy_refund",
    label: "Refund Policy",
    value: POLICY_SEED_VALUES.policy_refund,
  },
  {
    key: "policy_shipping",
    label: "Delivery Policy",
    value: POLICY_SEED_VALUES.policy_shipping,
  },
  {
    key: "bank_details",
    label: "Manual Bank Transfer Details",
    value: {
      bankName: "Sampath Bank",
      branch: "Hatton",
      accountName: "N.Gayathree",
      accountNumber: "108052612262",
      whatsapp: "+94 77 070 4274",
      deadline: "Pay within 24 hours to confirm your order.",
    },
  },
  {
    key: "reward_review_discount",
    label: "Review Discount Reward",
    value: {
      enabled: false,
      discountType: "percent",
      discountValue: 10,
      codePrefix: "REVIEW",
      expiryDays: 30,
      maxUses: 1,
    },
  },
];

const seedAboutSiteDefaults = async () => {
  for (const row of DEFAULT_ABOUT_ROWS) {
    await SiteConfig.updateOne(
      { key: row.key },
      { $setOnInsert: { key: row.key, value: row.value, label: row.label } },
      { upsert: true }
    );
  }
};

module.exports = { seedAboutSiteDefaults, DEFAULT_ABOUT_ROWS };
