let cron = null;
try {
  cron = require("node-cron");
} catch (_error) {
  console.warn("[recommendations-job] node-cron is not installed; scheduler disabled.");
}

let Anthropic = null;
try {
  Anthropic = require("@anthropic-ai/sdk");
} catch (_error) {
  console.warn("[recommendations-job] @anthropic-ai/sdk is not installed; analysis disabled.");
}

const Review = require("../Models/Review");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const Drop = require("../Models/Drop");
const User = require("../Models/User");
const Recommendation = require("../Models/Recommendation");

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const REVIEW_WINDOW_DAYS = 90;
const ORDER_WINDOW_DAYS = 30;
const ANALYTICS_WINDOW_DAYS = 30;
const MAX_REVIEWS_PER_RUN = 300;

const getAnthropicClient = () => {
  if (!Anthropic) throw new Error("Anthropic SDK is not installed.");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  return new Anthropic({ apiKey });
};

// Claude returns free-form text. We ask for JSON-only in the system prompt but
// still defensively strip markdown fences / surrounding prose before parsing,
// so a stray ```json wrapper or preamble never fails the whole run.
const extractJsonObject = (text) => {
  let cleaned = String(text || "").trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) cleaned = fenced[1].trim();
  if (!cleaned.startsWith("{")) {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  }
  return JSON.parse(cleaned);
};

// Anthropic Messages API. Note: `temperature` and OpenAI's `response_format`
// are not passed — sampling params are rejected on Claude 4.x models. We steer
// JSON output via the system prompt and parse the returned text defensively.
const callAnthropic = async (systemPrompt, userPrompt) => {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: `${systemPrompt}\n\nRespond with ONLY a single valid JSON object — no markdown, no code fences, and no text before or after the JSON.`,
    messages: [{ role: "user", content: userPrompt }],
  });
  const raw = (message.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  let parsed;
  try {
    parsed = extractJsonObject(raw);
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${err.message}`);
  }
  const usage = message.usage || {};
  const tokensUsed = (usage.input_tokens || 0) + (usage.output_tokens || 0);
  return { parsed, tokensUsed };
};

const allowedSeverities = ["high", "medium", "low"];

const clampConfidence = (raw) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const sanitizeItems = (rawItems) =>
  Array.isArray(rawItems)
    ? rawItems.slice(0, 10).map((entry) => ({
        title: String(entry.title || entry.issue || entry.name || "").trim(),
        detail: String(entry.detail || entry.description || "").trim(),
        severity: allowedSeverities.includes(entry.severity) ? entry.severity : "medium",
        frequency: Number(entry.frequency) || 0,
        category: String(entry.category || "").trim(),
        refIds: Array.isArray(entry.refIds)
          ? entry.refIds.filter((id) => /^[a-f0-9]{24}$/i.test(String(id))).slice(0, 5)
          : [],
        confidence: clampConfidence(entry.confidence),
      }))
    : [];

const sanitizeRecommendations = (rawRecs) =>
  Array.isArray(rawRecs)
    ? rawRecs.slice(0, 10).map((entry) => ({
        area: String(entry.area || "").trim(),
        action: String(entry.action || "").trim(),
        priority: allowedSeverities.includes(entry.priority) ? entry.priority : "medium",
        expectedImpact: String(entry.expectedImpact || "").trim(),
        supportingData: String(entry.supportingData || "").trim(),
        confidence: clampConfidence(entry.confidence),
      }))
    : [];

const CONFIDENCE_INSTRUCTION =
  " Each item AND each recommendation MUST include a `confidence` integer 0-100 reflecting how strongly the supplied data supports it. Use 90+ only when the data is unambiguous; use 50-70 for plausible-but-thin signals; use <50 only when speculation.";

const persistRecommendation = async (type, parsed, dataSnapshot, tokensUsed) =>
  Recommendation.create({
    type,
    generatedAt: new Date(),
    summary: String(parsed.summary || "").trim(),
    items: sanitizeItems(parsed.items || parsed.topIssues),
    recommendations: sanitizeRecommendations(parsed.recommendations),
    trendsObserved: String(parsed.trendsObserved || parsed.trends || "").trim(),
    dataSnapshot,
    model: DEFAULT_MODEL,
    tokensUsed,
  });

/* ========== REVIEWS ========== */
const generateReviewRecommendations = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REVIEW_WINDOW_DAYS);
  const total = await Review.countDocuments({ status: "approved", createdAt: { $gte: cutoff } });
  if (total < 5) {
    console.log(`[recommendations-job] reviews: only ${total} reviews; skipping.`);
    return null;
  }
  const reviews = await Review.find({ status: "approved", createdAt: { $gte: cutoff } })
    .sort({ createdAt: -1 })
    .limit(MAX_REVIEWS_PER_RUN)
    .select("_id rating title content category sentiment createdAt")
    .lean();

  const systemPrompt = `You are a senior CX analyst for a luxury fashion brand. Analyse customer reviews and produce JSON: {summary, items: [{title, detail, severity, frequency, category, refIds}], recommendations: [{area, action, priority, expectedImpact}], trendsObserved}. items = recurring issues; refIds = up to 5 example review _ids. Categories: fit/quality/delivery/style/value. Limit to 6 items and 6 recommendations.${CONFIDENCE_INSTRUCTION}`;
  const userPrompt = `Approved reviews from last ${REVIEW_WINDOW_DAYS} days (${reviews.length} of ${total}):\n${JSON.stringify(reviews.map((r) => ({ id: String(r._id), ...r })))}`;

  const { parsed, tokensUsed } = await callAnthropic(systemPrompt, userPrompt);
  return persistRecommendation(
    "reviews",
    parsed,
    { totalReviewsAnalyzed: reviews.length, totalAvailable: total, dateRange: { from: reviews[reviews.length - 1]?.createdAt, to: reviews[0]?.createdAt } },
    tokensUsed
  );
};

/* ========== PRODUCTS ========== */
const generateProductRecommendations = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ORDER_WINDOW_DAYS);

  const [bestSellers, slowMovers, mostViewedNotPurchased, mostWished] = await Promise.all([
    Product.find().sort({ soldCount: -1 }).limit(20).select("name category soldCount viewCount cartAddCount totalStock basePrice averageRating reviewCount lastSoldAt").lean(),
    Product.find({ totalStock: { $gt: 0 } }).sort({ soldCount: 1 }).limit(20).select("name category soldCount viewCount totalStock basePrice lastSoldAt").lean(),
    Product.find({ viewCount: { $gt: 0 } }).sort({ viewCount: -1 }).limit(15).select("name category viewCount cartAddCount soldCount basePrice").lean(),
    Product.find({ wishCount: { $gt: 0 } }).sort({ wishCount: -1 }).limit(15).select("name category wishCount soldCount basePrice").lean(),
  ]);

  const totalProducts = await Product.countDocuments();
  if (totalProducts < 5) {
    console.log("[recommendations-job] products: catalog too small; skipping.");
    return null;
  }

  const systemPrompt = `You are a merchandising strategist for a luxury fashion brand. Analyse the catalog signals and produce JSON: {summary, items: [{title, detail, severity, category}], recommendations: [{area, action, priority, expectedImpact, supportingData}], trendsObserved}. items = specific products to flag (promote, retire, restock, rework). recommendations = portfolio-level moves. Use product names from the data. Limit to 8 items and 6 recommendations.${CONFIDENCE_INSTRUCTION}`;
  const userPrompt = `Catalog signals:\nBest sellers (last 30d sold counts): ${JSON.stringify(bestSellers)}\nSlow movers: ${JSON.stringify(slowMovers)}\nMost viewed (low conversion): ${JSON.stringify(mostViewedNotPurchased)}\nMost wishlisted: ${JSON.stringify(mostWished)}`;

  const { parsed, tokensUsed } = await callAnthropic(systemPrompt, userPrompt);
  return persistRecommendation(
    "products",
    parsed,
    { totalProducts, bestSellersCount: bestSellers.length, slowMoversCount: slowMovers.length },
    tokensUsed
  );
};

/* ========== DROPS ========== */
const generateDropRecommendations = async () => {
  const drops = await Drop.find().sort({ releaseDate: -1 }).limit(6).lean();
  if (drops.length < 1) {
    console.log("[recommendations-job] drops: no drops found; skipping.");
    return null;
  }

  const dropPayload = await Promise.all(
    drops.map(async (drop) => {
      const products = await Product.find({ drop: drop._id }).select("name basePrice soldCount averageRating reviewCount totalStock").lean();
      const totalSold = products.reduce((sum, p) => sum + (p.soldCount || 0), 0);
      const avgRating = products.length
        ? products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length
        : 0;
      return {
        id: String(drop._id),
        name: drop.name,
        releaseDate: drop.releaseDate,
        endDate: drop.endDate,
        productCount: products.length,
        totalSold,
        avgRating: Math.round(avgRating * 10) / 10,
      };
    })
  );

  const systemPrompt = `You are a drop-strategy expert for a luxury streetwear brand. Analyse the last 6 drops and produce JSON: {summary, items: [{title, detail, severity}], recommendations: [{area, action, priority, expectedImpact}], trendsObserved}. recommendations should cover: timing, theme, size of next drop, pricing, marketing window. Limit to 6 items and 6 recommendations.${CONFIDENCE_INSTRUCTION}`;
  const userPrompt = `Recent drops (newest first):\n${JSON.stringify(dropPayload)}`;

  const { parsed, tokensUsed } = await callAnthropic(systemPrompt, userPrompt);
  return persistRecommendation("drops", parsed, { dropsAnalyzed: drops.length }, tokensUsed);
};

/* ========== ANALYTICS ========== */
const generateAnalyticsRecommendations = async () => {
  const now = new Date();
  const recent = new Date(now);
  recent.setDate(recent.getDate() - ANALYTICS_WINDOW_DAYS);
  const prior = new Date(recent);
  prior.setDate(prior.getDate() - ANALYTICS_WINDOW_DAYS);

  const [recentOrders, priorOrders, totalUsers, recentUsers] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: recent } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalAmount" }, refunded: { $sum: { $cond: ["$refundAmount", 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: prior, $lt: recent } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
    ]),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: recent } }),
  ]);

  const recentStats = recentOrders[0] || { count: 0, revenue: 0, refunded: 0, cancelled: 0 };
  const priorStats = priorOrders[0] || { count: 0, revenue: 0 };

  if (recentStats.count < 5) {
    console.log("[recommendations-job] analytics: too few recent orders; skipping.");
    return null;
  }

  const snapshot = {
    window: `${ANALYTICS_WINDOW_DAYS} days`,
    recent: recentStats,
    prior: priorStats,
    revenueDelta: priorStats.revenue ? ((recentStats.revenue - priorStats.revenue) / priorStats.revenue) * 100 : null,
    aovRecent: recentStats.count ? recentStats.revenue / recentStats.count : 0,
    aovPrior: priorStats.count ? priorStats.revenue / priorStats.count : 0,
    cancellationRate: recentStats.count ? recentStats.cancelled / recentStats.count : 0,
    refundRate: recentStats.count ? recentStats.refunded / recentStats.count : 0,
    totalUsers,
    newUsers: recentUsers,
  };

  const systemPrompt = `You are an e-commerce growth analyst. Analyse the KPI snapshot (recent vs prior period) and produce JSON: {summary, items: [{title, detail, severity}], recommendations: [{area, action, priority, expectedImpact, supportingData}], trendsObserved}. items = KPIs needing attention. recommendations = concrete moves with expected % impact. Limit to 6 items and 6 recommendations.${CONFIDENCE_INSTRUCTION}`;
  const userPrompt = `KPI snapshot:\n${JSON.stringify(snapshot, null, 2)}`;

  const { parsed, tokensUsed } = await callAnthropic(systemPrompt, userPrompt);
  return persistRecommendation("analytics", parsed, snapshot, tokensUsed);
};

/* ========== BUSINESS IMPROVEMENTS ========== */
const generateBusinessImprovements = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);

  const [lowReviews, recentOrders, agingProducts] = await Promise.all([
    Review.find({ rating: { $lte: 2 }, createdAt: { $gte: cutoff } }).select("rating title content category createdAt").limit(50).lean(),
    Order.find({ createdAt: { $gte: cutoff } }).select("status totalAmount refundAmount couponCode createdAt").limit(200).lean(),
    Product.find({ totalStock: { $gt: 5 }, lastSoldAt: { $lt: cutoff } }).select("name category basePrice totalStock lastSoldAt").limit(30).lean(),
  ]);

  if (lowReviews.length === 0 && recentOrders.length < 5) {
    console.log("[recommendations-job] improvements: not enough signals; skipping.");
    return null;
  }

  const orderSummary = {
    total: recentOrders.length,
    cancelled: recentOrders.filter((o) => o.status === "cancelled").length,
    refunded: recentOrders.filter((o) => o.refundAmount > 0).length,
    couponUsed: recentOrders.filter((o) => o.couponCode).length,
  };

  const systemPrompt = `You are an operations consultant for a luxury e-commerce brand. From the signals below, identify operational fixes that will reduce friction and lift retention. Produce JSON: {summary, items: [{title, detail, severity}], recommendations: [{area, action, priority, expectedImpact, supportingData}], trendsObserved}. items = pain points. recommendations = fixes (logistics, returns, sizing, customer service, payment, etc). Limit to 6 of each.${CONFIDENCE_INSTRUCTION}`;
  const userPrompt = `Low-rating reviews (≤2 stars, last 60d): ${JSON.stringify(lowReviews)}\nOrder summary (last 60d): ${JSON.stringify(orderSummary)}\nAging products (idle 60+ days): ${JSON.stringify(agingProducts)}`;

  const { parsed, tokensUsed } = await callAnthropic(systemPrompt, userPrompt);
  return persistRecommendation(
    "improvements",
    parsed,
    { lowReviewsCount: lowReviews.length, orderSummary, agingCount: agingProducts.length },
    tokensUsed
  );
};

/* ========== BUSINESS IDEAS ========== */
const generateBusinessIdeas = async () => {
  const [productsByCategory, latestReviewInsight, totalUsers] = await Promise.all([
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$basePrice" }, totalSold: { $sum: "$soldCount" } } },
    ]),
    Recommendation.findOne({ type: "reviews" }).sort({ generatedAt: -1 }).lean(),
    User.countDocuments(),
  ]);

  if (productsByCategory.length === 0) {
    console.log("[recommendations-job] ideas: no products yet; skipping.");
    return null;
  }

  const customerThemes = latestReviewInsight
    ? (latestReviewInsight.items || []).map((i) => i.title).slice(0, 6)
    : [];

  const systemPrompt = `You are a creative business strategist for a luxury fashion brand. Suggest growth ideas based on catalog coverage + customer feedback themes. Produce JSON: {summary, items: [{title, detail}], recommendations: [{area, action, priority, expectedImpact}], trendsObserved}. items = idea ideas (e.g., "Launch eco-line", "Add monthly drop subscription"). recommendations = how to validate/launch each. Be bold but realistic. Limit to 6 of each.${CONFIDENCE_INSTRUCTION}`;
  const userPrompt = `Catalog by category: ${JSON.stringify(productsByCategory)}\nCustomer pain themes: ${JSON.stringify(customerThemes)}\nTotal users: ${totalUsers}`;

  const { parsed, tokensUsed } = await callAnthropic(systemPrompt, userPrompt);
  return persistRecommendation(
    "ideas",
    parsed,
    { categoryCount: productsByCategory.length, customerThemesUsed: customerThemes.length, totalUsers },
    tokensUsed
  );
};

const GENERATORS = {
  reviews: generateReviewRecommendations,
  products: generateProductRecommendations,
  drops: generateDropRecommendations,
  analytics: generateAnalyticsRecommendations,
  improvements: generateBusinessImprovements,
  ideas: generateBusinessIdeas,
};

const runOne = (type) => async () => {
  try {
    await GENERATORS[type]();
  } catch (err) {
    console.error(`[recommendations-job] ${type} run failed:`, err.message);
  }
};

const initRecommendationsJobs = () => {
  if (!cron) return;
  cron.schedule("0 3 * * *", runOne("reviews"));
  cron.schedule("15 3 * * *", runOne("products"));
  cron.schedule("30 3 * * 1", runOne("drops"));
  cron.schedule("45 3 * * *", runOne("analytics"));
  cron.schedule("0 4 * * 1", runOne("improvements"));
  cron.schedule("15 4 * * 1", runOne("ideas"));
  console.log("[recommendations-job] Scheduled 6 jobs (4 daily, 3 weekly Mondays, staggered).");
};

module.exports = {
  initRecommendationsJobs,
  GENERATORS,
  generateReviewRecommendations,
  generateProductRecommendations,
  generateDropRecommendations,
  generateAnalyticsRecommendations,
  generateBusinessImprovements,
  generateBusinessIdeas,
};
