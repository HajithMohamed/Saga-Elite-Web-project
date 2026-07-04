/**
 * Simple rule-based recommendation helper.
 * Exposes a function to generate automatic recommendations for a given product.
 * This is intentionally conservative: it doesn't replace current personalized
 * recommendations but provides a modular place to evolve rules and scoring.
 */

const mongoose = require("mongoose");
const Product = require("../Models/Product");
const Order = require("../Models/Order");

const matchingCategories = {
  // example pairings; expand via admin-config later
  tshirt: ["pants", "shorts"],
  hoodie: ["cargo", "joggers"],
  shoes: ["tshirt", "pants"],
};

// Cross-category "complete the look" rules. Each rule's `when` keywords are
// matched (substring, case-insensitive) against the source product's
// category / subCategory / categoryPath / tags; matching rules contribute their
// `suggest` keywords, which then drive a query for complementary products.
// This is the "t-shirt → jeans" pairing the storefront surfaces on the PDP.
const COMPLEMENT_RULES = [
  { when: ["t-shirt", "tshirt", "tee", "top", "shirt", "polo", "blouse", "crop"], suggest: ["jean", "pant", "trouser", "short", "skirt", "cargo", "jogger", "bottom", "denim"] },
  { when: ["jean", "denim", "pant", "trouser", "short", "skirt", "cargo", "jogger", "bottom", "legging"], suggest: ["t-shirt", "tshirt", "tee", "top", "shirt", "polo", "hoodie", "jacket", "blouse"] },
  { when: ["hoodie", "sweatshirt", "sweater", "jumper", "pullover"], suggest: ["jean", "denim", "pant", "jogger", "cargo", "short", "t-shirt", "tshirt", "tee"] },
  { when: ["jacket", "coat", "outerwear", "blazer", "bomber"], suggest: ["t-shirt", "tshirt", "tee", "top", "jean", "pant", "hoodie"] },
  { when: ["dress", "gown", "frock", "jumpsuit"], suggest: ["shoe", "heel", "sandal", "sneaker", "bag", "accessor", "jacket", "belt"] },
  { when: ["shoe", "sneaker", "boot", "sandal", "heel", "footwear", "slipper"], suggest: ["t-shirt", "tshirt", "tee", "jean", "pant", "dress", "top", "sock"] },
  { when: ["bag", "accessor", "cap", "hat", "belt", "watch", "sunglass", "jewel", "scarf"], suggest: ["t-shirt", "tshirt", "tee", "dress", "jean", "shoe", "top"] },
];

const norm = (s) => String(s || "").toLowerCase();
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const suggestKeywordsFor = (product) => {
  // Garment type often lives in the name/subCategory/tags rather than `category`
  // (which, in this catalog, is gender: Gents/Ladies/Unisex). Include all of
  // them so "…Joggers" pairs with tops even when category is just "Gents".
  const haystack = [
    product.name,
    product.category,
    product.subCategory,
    product.categoryPath,
    ...(product.tags || []),
  ]
    .map(norm)
    .join(" | ");
  const set = new Set();
  for (const rule of COMPLEMENT_RULES) {
    if (rule.when.some((kw) => haystack.includes(kw))) {
      rule.suggest.forEach((s) => set.add(s));
    }
  }
  return [...set];
};

/**
 * "Complete the look" — ranked, deduped complementary product ids for a source
 * product. Blends three signals in priority order so the result is genuinely
 * "goes-with-this" rather than "more-of-the-same":
 *   1. Admin-curated relatedProductIds (merchandiser intent wins).
 *   2. Co-purchase — products most often bought in the same orders.
 *   3. Complementary categories via the COMPLEMENT_RULES map (t-shirt → jeans).
 *   4. Fallback — popular in-stock products from a different category, so the
 *      rail is never empty on a healthy catalog.
 * Returns up to `limit` id strings in display order.
 */
const completeTheLookIds = async (product, limit = 8) => {
  if (!product) return [];
  const sourceId = String(product._id);
  const ordered = [];
  const seen = new Set([sourceId]);
  const push = (id) => {
    const s = String(id);
    if (!seen.has(s)) {
      seen.add(s);
      ordered.push(s);
    }
  };

  // 1) Admin-curated related products first.
  (product.relatedProductIds || []).forEach((id) => push(id));

  // 2) Co-purchase frequency.
  try {
    const objId = new mongoose.Types.ObjectId(sourceId);
    const coPurchased = await Order.aggregate([
      { $match: { "items.product": objId } },
      { $unwind: "$items" },
      { $match: { "items.product": { $ne: objId } } },
      { $group: { _id: "$items.product", freq: { $sum: 1 } } },
      { $sort: { freq: -1 } },
      { $limit: limit * 2 },
    ]);
    coPurchased.forEach((row) => push(row._id));
  } catch {
    /* co-purchase is best-effort; ignore aggregation failures */
  }

  // 3) Complementary categories heuristic.
  const suggestKw = suggestKeywordsFor(product);
  if (suggestKw.length && ordered.length < limit) {
    const rx = new RegExp(suggestKw.map(escapeRegex).join("|"), "i");
    const candidates = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      totalStock: { $gt: 0 },
      $or: [{ name: rx }, { category: rx }, { subCategory: rx }, { categoryPath: rx }, { tags: rx }],
    })
      .sort({ soldCount: -1, averageRating: -1, arrivedAt: -1 })
      .limit(limit * 2)
      .select("_id")
      .lean();
    candidates.forEach((c) => push(c._id));
  }

  // 4) Fallback — popular in-stock products from a different category.
  if (ordered.length < limit) {
    const fallback = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      totalStock: { $gt: 0 },
      category: { $ne: product.category },
    })
      .sort({ soldCount: -1, averageRating: -1 })
      .limit(limit * 2)
      .select("_id")
      .lean();
    fallback.forEach((c) => push(c._id));
  }

  return ordered.slice(0, limit);
};

const scoreCandidate = (current, candidate) => {
  let score = 0;
  if (!candidate || !current) return 0;
  if (candidate.category === current.category) score += 10;
  if (candidate.brand && current.brand && candidate.brand === current.brand) score += 3;
  // tags overlap
  const tagsA = new Set(current.tags || []);
  const tagsB = candidate.tags || [];
  const tagMatches = tagsB.filter((t) => tagsA.has(t)).length;
  score += tagMatches * 4;
  // popularity
  score += Math.min(5, (candidate.soldCount || 0) / 10);
  // recency bias
  const ageDays = (Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 3 - ageDays / 30);
  return score;
};

const autoRecommendationsForProduct = async (product, opts = {}) => {
  const limit = Math.min(Number(opts.limit) || 6, 24);
  if (!product) return [];

  // Build candidate query: same category OR categories that pair with it
  const candidates = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(200)
    .lean();

  // Score candidates
  const scored = candidates.map((c) => ({
    item: c,
    score: scoreCandidate(product, c),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
};

module.exports = {
  autoRecommendationsForProduct,
  scoreCandidate,
  completeTheLookIds,
  suggestKeywordsFor,
};
