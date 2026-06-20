/**
 * Simple rule-based recommendation helper.
 * Exposes a function to generate automatic recommendations for a given product.
 * This is intentionally conservative: it doesn't replace current personalized
 * recommendations but provides a modular place to evolve rules and scoring.
 */

const Product = require("../Models/Product");

const matchingCategories = {
  // example pairings; expand via admin-config later
  tshirt: ["pants", "shorts"],
  hoodie: ["cargo", "joggers"],
  shoes: ["tshirt", "pants"],
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
};
