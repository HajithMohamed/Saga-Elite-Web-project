/**
 * Seed migration — copy the live legal-policy HTML into SiteConfig so the admin
 * PoliciesManager opens populated (and the public pages serve DB content rather
 * than the code fallback). Run once.
 *
 *   node scripts/seedLegalPolicies.js          # seed empty keys only (idempotent)
 *   node scripts/seedLegalPolicies.js --force   # overwrite existing keys too
 *   npm run seed:legal                          # from Server-side/ (or repo root)
 *
 * The HTML is read straight from the client fallback module
 * (Client-Side/src/pages/Legal/legal-policy-fallbacks.js) so this seed can never
 * drift from what the public pages render as their fallback.
 */
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Load the single root .env (then an optional Server-side/.env) the same way
// server.js does, so the script targets the configured Mongo instance.
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../DataBase/db");
const SiteConfig = require("../Models/SiteConfig");

const FORCE = process.argv.includes("--force");

const FALLBACKS_FILE = path.join(
  __dirname,
  "../../Client-Side/src/pages/Legal/legal-policy-fallbacks.js"
);

// Fallback-module constant → the SiteConfig key + editorial metadata.
const POLICIES = [
  {
    constant: "TERMS_POLICY_FALLBACK_HTML",
    key: "policy_terms",
    label: "Terms & Conditions",
    metaTitle: "Terms & Conditions",
    metaDescription:
      "Read the terms and conditions for using Saga Elite and placing orders on our store.",
  },
  {
    constant: "PRIVACY_POLICY_FALLBACK_HTML",
    key: "policy_privacy",
    label: "Privacy Policy",
    metaTitle: "Privacy Policy",
    metaDescription:
      "How Saga Elite collects, uses, and protects your personal data.",
  },
  {
    constant: "REFUND_POLICY_FALLBACK_HTML",
    key: "policy_refund",
    label: "Refund & Return Policy",
    metaTitle: "Refund & Return Policy",
    metaDescription:
      "Saga Elite's policy on refunds, returns, and exchanges for damaged or defective items.",
  },
  {
    constant: "DELIVERY_POLICY_FALLBACK_HTML",
    key: "policy_shipping",
    label: "Delivery Policy",
    metaTitle: "Delivery Policy",
    metaDescription:
      "Saga Elite delivery coverage, processing times, and shipping information for Sri Lanka.",
  },
];

// Pull each `export const NAME_FALLBACK_HTML = `...`;` template literal out of
// the client module. The HTML contains no backticks, so a non-greedy match is safe.
const extractFallbackHtml = () => {
  const source = fs.readFileSync(FALLBACKS_FILE, "utf8");
  const map = {};
  const re = /export const (\w+_FALLBACK_HTML)\s*=\s*`([\s\S]*?)`;/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    map[m[1]] = m[2].trim();
  }
  return map;
};

const htmlToPlainText = (html) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const seedLegalPolicies = async () => {
  const hadConnectionAlready = mongoose.connection.readyState === 1;
  const htmlByConstant = extractFallbackHtml();

  let seeded = 0;
  let skipped = 0;

  try {
    if (!hadConnectionAlready) await connectDB();

    const now = new Date().toISOString();

    for (const policy of POLICIES) {
      const html = htmlByConstant[policy.constant];
      if (!html) {
        console.warn(
          `⚠️  No fallback HTML found for ${policy.constant} — skipping ${policy.key}`
        );
        skipped += 1;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const existing = await SiteConfig.findOne({ key: policy.key }).lean();
      const existingHtml =
        existing && existing.value && typeof existing.value.html === "string"
          ? existing.value.html.trim()
          : "";

      if (existingHtml && !FORCE) {
        console.log(
          `⏭️  ${policy.key} already has content — skipping (use --force to overwrite)`
        );
        skipped += 1;
        continue;
      }

      const value = {
        html,
        plainText: htmlToPlainText(html),
        lastUpdated: now,
        metaTitle: policy.metaTitle,
        metaDescription: policy.metaDescription,
      };

      // eslint-disable-next-line no-await-in-loop
      await SiteConfig.findOneAndUpdate(
        { key: policy.key },
        { value, label: policy.label },
        { new: true, upsert: true, runValidators: true }
      );

      console.log(
        `✅  ${existingHtml ? "Overwrote" : "Seeded"} ${policy.key} ` +
          `(${value.plainText.length} chars of text)`
      );
      seeded += 1;
    }

    console.log(
      `\nDone. Seeded ${seeded}, skipped ${skipped}.${FORCE ? " (--force)" : ""}`
    );

    if (!hadConnectionAlready) await mongoose.connection.close();
  } catch (error) {
    if (!hadConnectionAlready) await mongoose.connection.close().catch(() => {});
    throw error;
  }
};

if (require.main === module) {
  seedLegalPolicies().catch(async (error) => {
    console.error("Failed to seed legal policies", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close().catch(() => {});
    }
    process.exitCode = 1;
  });
}

module.exports = seedLegalPolicies;
