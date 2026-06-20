/**
 * Backfill legacy product categories to the current Saga Elite taxonomy.
 * Run from repo root: node Server-side/scripts/migrate-product-categories.js
 */
require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Product = require("../Models/Product");

const CATEGORY_MAP = {
  Women: "Ladies",
  Men: "Gents",
  Kids: "Unisex",
};

const connect = async () => {
  const uri = process.env.MONGO_DB_URI || process.env.MONGO_URI || process.env.DATABASE_URI;
  if (!uri) {
    console.error("Missing MONGO_DB_URI (or fallback) in environment.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("Connected.");
};

async function renameProductCategories() {
  const docs = await Product.find({ category: { $in: Object.keys(CATEGORY_MAP) } }).select("_id category");
  let updated = 0;

  for (const product of docs) {
    const nextCategory = CATEGORY_MAP[product.category];
    if (!nextCategory) continue;

    product.category = nextCategory;
    await product.save({ validateModifiedOnly: true });
    updated += 1;
  }

  console.log(`Product categories renamed: ${updated}`);
}

(async () => {
  try {
    await connect();
    await renameProductCategories();
    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
