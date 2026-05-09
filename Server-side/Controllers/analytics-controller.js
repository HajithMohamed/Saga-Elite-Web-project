const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const Drop = require("../Models/Drop");
const User = require("../Models/User");
const Review = require("../Models/Review");

// Resolve the date range from `?from=ISO&to=ISO`. Defaults: last 30 days, ending now.
const resolveRange = (req) => {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const parse = (raw, fallback) => {
    if (!raw) return fallback;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? fallback : d;
  };

  const from = parse(req.query.from, defaultFrom);
  const to = parse(req.query.to, now);
  // Normalize to inclusive end-of-day
  to.setHours(23, 59, 59, 999);

  return { from, to };
};

/*
|--------------------------------------------------------------------------
| GET /api/v1/admin/analytics/sales?from=&to=
|  - Daily revenue + order counts
|  - Total revenue / orders / AOV / delivered revenue / cancelled count
|  - Payment method breakdown
|--------------------------------------------------------------------------
*/
const salesAnalytics = catchAsync(async (req, res) => {
  const { from, to } = resolveRange(req);
  const dateMatch = { createdAt: { $gte: from, $lte: to } };

  const [summaryAgg, dailyAgg, paymentBreakdown] = await Promise.all([
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
          deliveredRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
            },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalRefunded: { $sum: { $ifNull: ["$refundAmount", 0] } },
          couponDiscountTotal: { $sum: { $ifNull: ["$couponDiscount", 0] } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...dateMatch, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
        },
      },
      { $sort: { revenue: -1, count: -1 } },
    ]),
  ]);

  const summary = summaryAgg[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    deliveredRevenue: 0,
    cancelledOrders: 0,
    totalRefunded: 0,
    couponDiscountTotal: 0,
  };

  const validOrderCount = Math.max(0, summary.totalOrders - summary.cancelledOrders);
  const averageOrderValue = validOrderCount
    ? summary.totalRevenue / validOrderCount
    : 0;

  res.status(200).json({
    success: true,
    data: {
      range: { from, to },
      summary: {
        ...summary,
        averageOrderValue: Math.round(averageOrderValue),
      },
      daily: dailyAgg.map((d) => ({
        date: d._id,
        revenue: d.revenue,
        orders: d.orders,
      })),
      paymentMethods: paymentBreakdown.map((p) => ({
        method: p._id || "unknown",
        count: p.count,
        revenue: p.revenue,
      })),
    },
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/admin/analytics/products?from=&to=
|  - Per-product views / cart-adds / wishes / sold / conversion rate
|  - Sliced over creation/update lifetime, not the date range (counters are
|    cumulative — date range is reserved for sales attribution).
|--------------------------------------------------------------------------
*/
const productsAnalytics = catchAsync(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

  const products = await Product.find({ isActive: true })
    .select("name slug artNo category brand viewCount cartAddCount wishCount soldCount totalStock costPrice basePrice salePrice lastSoldAt")
    .lean();

  const enriched = products.map((p) => {
    const views = p.viewCount || 0;
    const sold = p.soldCount || 0;
    const cartAdds = p.cartAddCount || 0;
    const conversionRate = views > 0 ? Number((sold / views).toFixed(4)) : 0;
    return {
      _id: p._id,
      name: p.name,
      slug: p.slug,
      artNo: p.artNo,
      category: p.category,
      brand: p.brand,
      views,
      cartAdds,
      wishCount: p.wishCount || 0,
      sold,
      stock: p.totalStock || 0,
      conversionRate,
      lastSoldAt: p.lastSoldAt,
    };
  });

  enriched.sort((a, b) => b.sold - a.sold);

  res.status(200).json({
    success: true,
    data: {
      total: enriched.length,
      products: enriched.slice(0, limit),
    },
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/admin/analytics/drops
|  - Per-drop sales + revenue + sentiment
|  - Decision quadrant: grail / flawed / hidden_gem / deadstock
|--------------------------------------------------------------------------
*/
const dropsAnalytics = catchAsync(async (_req, res) => {
  const drops = await Drop.find()
    .select("name slug releaseDate isPublished isArchived")
    .lean();

  const dropsById = new Map(drops.map((d) => [String(d._id), d]));

  const productAgg = await Product.aggregate([
    { $match: { drop: { $ne: null } } },
    {
      $group: {
        _id: "$drop",
        productCount: { $sum: 1 },
        soldUnits: { $sum: "$soldCount" },
        wishCount: { $sum: "$wishCount" },
        viewCount: { $sum: "$viewCount" },
        stockOnHand: { $sum: "$totalStock" },
        revenueProxy: {
          $sum: {
            $multiply: [
              "$soldCount",
              { $ifNull: ["$basePrice", 0] },
            ],
          },
        },
      },
    },
  ]);

  const productIdsByDrop = await Product.aggregate([
    { $match: { drop: { $ne: null } } },
    { $group: { _id: "$drop", productIds: { $push: "$_id" } } },
  ]);
  const productIdsMap = new Map(
    productIdsByDrop.map((entry) => [String(entry._id), entry.productIds])
  );

  // Sentiment per drop (across approved reviews on that drop's products)
  const sentimentByDrop = new Map();
  await Promise.all(
    Array.from(productIdsMap.entries()).map(async ([dropId, productIds]) => {
      const sentiment = await Review.aggregate([
        {
          $match: {
            productId: {
              $in: productIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            status: "approved",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            positive: {
              $sum: { $cond: [{ $eq: ["$sentiment", "positive"] }, 1, 0] },
            },
            neutral: {
              $sum: { $cond: [{ $eq: ["$sentiment", "neutral"] }, 1, 0] },
            },
            negative: {
              $sum: { $cond: [{ $eq: ["$sentiment", "negative"] }, 1, 0] },
            },
            avgRating: { $avg: "$rating" },
          },
        },
      ]);
      sentimentByDrop.set(dropId, sentiment[0] || null);
    })
  );

  // Compute median sales for the matrix split
  const salesValues = productAgg.map((entry) => entry.soldUnits || 0);
  const sortedSales = [...salesValues].sort((a, b) => a - b);
  const medianSales = sortedSales.length
    ? sortedSales[Math.floor(sortedSales.length / 2)]
    : 0;

  const classify = (sold, sentiment) => {
    const isHighSales = sold >= medianSales && sold > 0;
    const positive = sentiment?.positive || 0;
    const negative = sentiment?.negative || 0;
    const isPositive = positive >= negative;
    if (isHighSales && isPositive) return "grail";
    if (isHighSales && !isPositive) return "flawed";
    if (!isHighSales && isPositive) return "hidden_gem";
    return "deadstock";
  };

  const result = productAgg
    .map((entry) => {
      const drop = dropsById.get(String(entry._id));
      const sentiment = sentimentByDrop.get(String(entry._id));
      const sentimentSummary = sentiment
        ? {
            total: sentiment.total,
            positive: sentiment.positive,
            neutral: sentiment.neutral,
            negative: sentiment.negative,
            avgRating: Number((sentiment.avgRating || 0).toFixed(2)),
          }
        : { total: 0, positive: 0, neutral: 0, negative: 0, avgRating: 0 };
      return {
        dropId: entry._id,
        name: drop?.name || "Independent Release",
        slug: drop?.slug || null,
        releaseDate: drop?.releaseDate || null,
        isPublished: drop?.isPublished ?? false,
        isArchived: drop?.isArchived ?? false,
        productCount: entry.productCount,
        soldUnits: entry.soldUnits,
        viewCount: entry.viewCount,
        wishCount: entry.wishCount,
        stockOnHand: entry.stockOnHand,
        revenueProxy: entry.revenueProxy,
        sentiment: sentimentSummary,
        quadrant: classify(entry.soldUnits, sentiment),
      };
    })
    .sort((a, b) => b.soldUnits - a.soldUnits);

  res.status(200).json({
    success: true,
    data: {
      drops: result,
      medianSales,
    },
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/admin/analytics/customers?from=&to=
|  - Membership tier breakdown
|  - Top spenders
|  - New customers in range
|--------------------------------------------------------------------------
*/
const customersAnalytics = catchAsync(async (req, res) => {
  const { from, to } = resolveRange(req);

  const [tierBreakdown, topSpenders, newInRange, lifetimeStats] = await Promise.all([
    User.aggregate([
      { $match: { role: { $in: ["customer", "user"] } } },
      {
        $group: {
          _id: "$membership",
          count: { $sum: 1 },
          totalSpent: { $sum: "$totalSpent" },
        },
      },
      { $sort: { count: -1 } },
    ]),
    User.find({ role: { $in: ["customer", "user"] } })
      .sort({ totalSpent: -1 })
      .limit(10)
      .select("email name userName membership totalSpent orderCount lastOrderAt")
      .lean(),
    User.countDocuments({
      role: { $in: ["customer", "user"] },
      createdAt: { $gte: from, $lte: to },
    }),
    User.aggregate([
      { $match: { role: { $in: ["customer", "user"] } } },
      {
        $group: {
          _id: null,
          customers: { $sum: 1 },
          totalSpent: { $sum: "$totalSpent" },
          totalOrders: { $sum: "$orderCount" },
        },
      },
    ]),
  ]);

  const lifetime = lifetimeStats[0] || { customers: 0, totalSpent: 0, totalOrders: 0 };
  const lifetimeAOV = lifetime.totalOrders
    ? lifetime.totalSpent / lifetime.totalOrders
    : 0;

  res.status(200).json({
    success: true,
    data: {
      range: { from, to },
      tiers: tierBreakdown.map((t) => ({
        tier: t._id || "standard",
        count: t.count,
        totalSpent: t.totalSpent,
      })),
      topSpenders,
      newCustomers: newInRange,
      lifetime: {
        customers: lifetime.customers,
        totalSpent: lifetime.totalSpent,
        totalOrders: lifetime.totalOrders,
        averageOrderValue: Math.round(lifetimeAOV),
      },
    },
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/admin/analytics/reviews
|  - Counts by status
|  - Sentiment breakdown (approved only)
|  - Avg rating
|  - Top keywords from approved review content
|--------------------------------------------------------------------------
*/
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "was", "are", "were", "be", "been", "being", "have", "has", "had",
  "this", "that", "these", "those", "it", "its", "i", "you", "we", "they",
  "he", "she", "him", "her", "his", "hers", "their", "theirs", "my", "your",
  "our", "us", "them", "as", "at", "by", "from", "so", "if", "than", "then",
  "very", "really", "just", "only", "too", "also", "not", "no", "yes", "do",
  "did", "does", "doing", "done", "would", "could", "should", "will", "shall",
  "can", "may", "might", "must", "about", "into", "out", "up", "down", "over",
  "under", "again", "further", "more", "most", "some", "any", "all", "each",
  "few", "other", "such", "own", "same", "well", "good", "great", "nice",
  "ok", "okay", "thanks", "thank",
]);

const reviewsAnalytics = catchAsync(async (_req, res) => {
  const [statusBreakdown, sentimentAgg, ratingAgg, recentApproved] =
    await Promise.all([
      Review.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$sentiment", count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { status: "approved" } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            total: { $sum: 1 },
            rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          },
        },
      ]),
      Review.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(500)
        .select("content")
        .lean(),
    ]);

  const statusCounts = { pending: 0, approved: 0, rejected: 0 };
  statusBreakdown.forEach((entry) => {
    if (entry._id) statusCounts[entry._id] = entry.count;
  });

  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  sentimentAgg.forEach((entry) => {
    if (entry._id) sentiment[entry._id] = entry.count;
  });

  const ratingStats = ratingAgg[0] || {
    avgRating: 0,
    total: 0,
    rating5: 0, rating4: 0, rating3: 0, rating2: 0, rating1: 0,
  };

  // Simple keyword extraction
  const wordCounts = new Map();
  recentApproved.forEach((r) => {
    if (!r.content) return;
    const tokens = String(r.content)
      .toLowerCase()
      .replace(/[^a-z\s']/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    tokens.forEach((token) => {
      if (token.length < 4 || STOPWORDS.has(token)) return;
      wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
    });
  });
  const topKeywords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word, count]) => ({ word, count }));

  res.status(200).json({
    success: true,
    data: {
      statusCounts,
      sentiment,
      averageRating: Number((ratingStats.avgRating || 0).toFixed(2)),
      totalApproved: ratingStats.total,
      ratingDistribution: {
        5: ratingStats.rating5,
        4: ratingStats.rating4,
        3: ratingStats.rating3,
        2: ratingStats.rating2,
        1: ratingStats.rating1,
      },
      topKeywords,
    },
  });
});

module.exports = {
  salesAnalytics,
  productsAnalytics,
  dropsAnalytics,
  customersAnalytics,
  reviewsAnalytics,
};
