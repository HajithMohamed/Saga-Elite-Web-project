/**
 * Backfill slug fields on Order, Review, and User collections.
 * Run from repo root: node Server-side/scripts/add-slugs.js
 */
require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const slugify = require("slugify");

const Order = require("../Models/Order");
const Review = require("../Models/Review");
const User = require("../Models/User");

const connect = async () => {
  const uri = process.env.MONGO_DB_URI || process.env.MONGO_URI || process.env.DATABASE_URI;
  if (!uri) {
    console.error("Missing MONGO_DB_URI (or fallback) in environment.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected.");
};

async function slugOrders() {
  const docs = await Order.find({}).select("_id slug referenceNumber");
  let updated = 0;
  for (const o of docs) {
    if (o.slug) continue;
    const base = o.referenceNumber || String(o._id);
    o.slug = slugify(`order-${base}`, { lower: true, strict: true });
    await o.save({ validateModifiedOnly: true });
    updated += 1;
  }
  console.log(`Order slugs assigned: ${updated}`);
}

async function slugReviews() {
  const docs = await Review.find({}).select("_id slug productId");
  let updated = 0;
  for (const r of docs) {
    if (r.slug) continue;
    r.slug = slugify(`review-${r._id}`, { lower: true, strict: true });
    await r.save({ validateModifiedOnly: true });
    updated += 1;
  }
  console.log(`Review slugs assigned: ${updated}`);
}

async function slugUsers() {
  const docs = await User.find({}).select("_id slug email");
  let updated = 0;
  for (const u of docs) {
    if (u.slug) continue;
    const local = (u.email || "user").split("@")[0] || "user";
    const tail = String(u._id).slice(-6);
    u.slug = slugify(`${local}-${tail}`, { lower: true, strict: true });
    await u.save({ validateModifiedOnly: true });
    updated += 1;
  }
  console.log(`User slugs assigned: ${updated}`);
}

(async () => {
  try {
    await connect();
    await slugOrders();
    await slugReviews();
    await slugUsers();
    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
