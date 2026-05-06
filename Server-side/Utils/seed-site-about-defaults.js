const SiteConfig = require("../Models/SiteConfig");

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
