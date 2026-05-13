/**
 * Backfill products into the new Category collection and set `product.categoryId`.
 * Run from repo root:
 *
 *   node Server-side/scripts/backfill-categories-to-collection.js
 */
require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const slugify = require("slugify");
const Product = require("../Models/Product");
const Category = require("../Models/Category");

const uri = process.env.MONGO_DB_URI || process.env.MONGO_URI || process.env.DATABASE_URI;
if (!uri) {
  console.error("Missing MONGO_DB_URI (or fallback) in environment.");
  process.exit(1);
}

async function connect() {
  await mongoose.connect(uri, { maxPoolSize: 10 });
  console.log("DB connected");
}

// Build category documents (two-level support: top-level + one subcategory)
async function buildCategoriesFromProducts() {
  const products = await Product.find({}).select("category categoryPath").lean();
  const created = new Map(); // key: slug path or slug name -> Category doc

  for (const p of products) {
    const pathStr = (p.categoryPath || p.category || "").trim();
    const parts = pathStr
      .split(/\s*>\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    // If no categoryPath, fallback to top-level category string
    if (parts.length === 0 && p.category) parts.push(String(p.category).trim());

    let parentId = null;
    // only support up to two levels initially (top and sub)
    for (let i = 0; i < Math.min(parts.length, 2); i++) {
      const name = parts[i];
      const slug = slugify(name || "", { lower: true, strict: true });
      const key = i === 0 ? slug : `${slugify(parts[0], { lower: true, strict: true })}/${slug}`;

      if (created.has(key)) {
        parentId = created.get(key)._id;
        continue;
      }

      // try to find existing category by slug
      let cat = await Category.findOne({ slug });
      if (!cat && i === 1) {
        // try lookup by combined key (parent + child) to avoid collision
        const parentSlug = slugify(parts[0], { lower: true, strict: true });
        const maybe = await Category.findOne({ slug, parentCategory: (await Category.findOne({ slug: parentSlug }))?._id });
        if (maybe) cat = maybe;
      }

      if (!cat) {
        const toCreate = { name, slug, parentCategory: parentId || null };
        try {
          cat = await Category.create(toCreate);
          console.log(`Created category ${cat.name} (${cat.slug})`);
        } catch (err) {
          // unique race: try find again
          cat = await Category.findOne({ slug }) || (await Category.findOne({ name }));
        }
      }

      created.set(key, cat);
      parentId = cat._id;
    }
  }

  return created;
}

async function assignCategoryIds() {
  const products = await Product.find({}).select("_id category categoryPath");
  let updated = 0;

  for (const p of products) {
    const pathStr = (p.categoryPath || p.category || "").trim();
    const parts = pathStr.split(/\s*>\s*/).map((s) => s.trim()).filter(Boolean);

    let target = null;
    if (parts.length === 0) {
      // fallback to top-level match by category string
      const slug = slugify(p.category || "", { lower: true, strict: true });
      target = await Category.findOne({ slug });
    } else {
      // prefer last part (subcategory) if exists, else top-level
      const last = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const lastSlug = slugify(last, { lower: true, strict: true });
      target = await Category.findOne({ slug: lastSlug });
      if (!target) {
        // fallback to top-level
        const topSlug = slugify(parts[0], { lower: true, strict: true });
        target = await Category.findOne({ slug: topSlug });
      }
    }

    if (target) {
      p.categoryId = target._id;
      await p.save({ validateModifiedOnly: true });
      updated++;
    } else {
      console.warn(`No category matched for product ${p._id} (${p.categoryPath || p.category})`);
    }
  }

  console.log(`Products updated with categoryId: ${updated}`);
}

(async () => {
  try {
    await connect();
    console.log("Scanning products and creating categories (two-level max)...");
    await buildCategoriesFromProducts();
    console.log("Assigning categoryId on products...");
    await assignCategoryIds();
    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
