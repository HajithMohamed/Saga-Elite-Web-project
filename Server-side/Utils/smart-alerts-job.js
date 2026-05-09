let cron = null;
try {
  cron = require("node-cron");
} catch (_error) {
  console.warn("[smart-alerts-job] node-cron not installed; scheduler disabled.");
}

const Order = require("../Models/Order");
const Product = require("../Models/Product");
const Review = require("../Models/Review");
const SmartAlert = require("../Models/SmartAlert");
const { broadcastNotification } = require("./notification-service");

const DAY_MS = 24 * 60 * 60 * 1000;

// Don't re-create the same alert kind within this window if still unacknowledged.
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

const upsertAlert = async ({ kind, severity, title, message, dataSnapshot }) => {
  const recent = await SmartAlert.findOne({
    kind,
    acknowledged: false,
    createdAt: { $gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
  }).lean();
  if (recent) return null;

  const alert = await SmartAlert.create({
    kind,
    severity,
    title,
    message,
    dataSnapshot,
  });

  // Real-time push so the sidebar badge can update before the next 30s poll
  try {
    await broadcastNotification({
      type: "admin",
      title,
      message,
      entityRef: alert._id,
    });
  } catch {
    // best-effort
  }

  return alert;
};

const checkRefundAndCancellationSpikes = async () => {
  const since = new Date(Date.now() - 7 * DAY_MS);
  const orders = await Order.find({ createdAt: { $gte: since } })
    .select("status refundAmount totalAmount createdAt")
    .lean();
  if (orders.length < 10) return;

  const total = orders.length;
  const refunded = orders.filter((o) => Number(o.refundAmount || 0) > 0).length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const refundRate = refunded / total;
  const cancellationRate = cancelled / total;

  if (refundRate > 0.1) {
    await upsertAlert({
      kind: "refund_spike",
      severity: refundRate > 0.2 ? "high" : "medium",
      title: "Refund rate is elevated",
      message: `${(refundRate * 100).toFixed(1)}% of the last ${total} orders were refunded. Review return reasons and product quality.`,
      dataSnapshot: { window: "7d", total, refunded, refundRate },
    });
  }

  if (cancellationRate > 0.15) {
    await upsertAlert({
      kind: "cancellation_spike",
      severity: cancellationRate > 0.25 ? "high" : "medium",
      title: "Cancellation rate is elevated",
      message: `${(cancellationRate * 100).toFixed(1)}% of the last ${total} orders were cancelled. Check payment friction and stock issues.`,
      dataSnapshot: { window: "7d", total, cancelled, cancellationRate },
    });
  }
};

const checkLowStockCritical = async () => {
  // Products with high cart-add demand but zero remaining stock across all variants.
  const candidates = await Product.find({
    isActive: true,
    cartAddCount: { $gt: 5 },
  })
    .select("name totalStock variants cartAddCount")
    .lean();

  const stockedOut = candidates.filter((p) => {
    if (Number(p.totalStock) > 0) return false;
    if (!Array.isArray(p.variants)) return true;
    return p.variants.every((v) => Number(v?.stock || 0) === 0);
  });

  if (stockedOut.length === 0) return;

  await upsertAlert({
    kind: "low_stock_critical",
    severity: stockedOut.length >= 5 ? "high" : "medium",
    title: `${stockedOut.length} in-demand product${stockedOut.length === 1 ? "" : "s"} stocked out`,
    message: `These products have zero stock but recent cart-adds: ${stockedOut.slice(0, 5).map((p) => p.name).join(", ")}${stockedOut.length > 5 ? "…" : ""}.`,
    dataSnapshot: { count: stockedOut.length, names: stockedOut.slice(0, 10).map((p) => p.name) },
  });
};

const checkRevenueDrop = async () => {
  const now = Date.now();
  const recent = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(now - 7 * DAY_MS) } } },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
  ]);
  const prior = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(now - 14 * DAY_MS), $lt: new Date(now - 7 * DAY_MS) } } },
    { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
  ]);

  const recentRev = recent[0]?.revenue || 0;
  const priorRev = prior[0]?.revenue || 0;
  if (priorRev < 1000) return; // too thin to compare

  const delta = (recentRev - priorRev) / priorRev;
  if (delta < -0.25) {
    await upsertAlert({
      kind: "revenue_drop",
      severity: delta < -0.4 ? "high" : "medium",
      title: "Weekly revenue is down",
      message: `Revenue dropped ${(delta * 100).toFixed(1)}% week-over-week (this week ${recentRev.toFixed(0)} vs prior ${priorRev.toFixed(0)}).`,
      dataSnapshot: { recentRev, priorRev, deltaPercent: delta * 100 },
    });
  }
};

const checkConversionDrop = async () => {
  // Proxy: ratio of cart-adds to views. If a product's recent ratio drops sharply, alert.
  // Simple aggregate over all active products for now.
  const products = await Product.find({ isActive: true })
    .select("name viewCount cartAddCount")
    .lean();
  if (products.length === 0) return;

  const totalViews = products.reduce((s, p) => s + Number(p.viewCount || 0), 0);
  const totalCartAdds = products.reduce((s, p) => s + Number(p.cartAddCount || 0), 0);
  if (totalViews < 100) return;
  const ratio = totalCartAdds / totalViews;

  // Only alert when ratio is very low (<3%) — heuristic, can be tuned.
  if (ratio < 0.03) {
    await upsertAlert({
      kind: "conversion_drop",
      severity: ratio < 0.015 ? "high" : "medium",
      title: "Site-wide cart conversion is low",
      message: `Only ${(ratio * 100).toFixed(2)}% of product views become cart adds. Investigate pricing, sizing clarity, and CTA placement.`,
      dataSnapshot: { totalViews, totalCartAdds, ratio },
    });
  }
};

const checkNegativeReviewStreaks = async () => {
  // 3+ consecutive low-rating (1-2 stars) reviews on the same product in the last 30 days.
  const since = new Date(Date.now() - 30 * DAY_MS);
  const lowReviews = await Review.find({ rating: { $lte: 2 }, createdAt: { $gte: since }, status: "approved" })
    .select("productId rating createdAt")
    .sort({ productId: 1, createdAt: 1 })
    .lean();

  const byProduct = new Map();
  for (const r of lowReviews) {
    const k = String(r.productId);
    if (!byProduct.has(k)) byProduct.set(k, []);
    byProduct.get(k).push(r);
  }

  const flagged = [];
  for (const [productId, reviews] of byProduct) {
    if (reviews.length >= 3) flagged.push({ productId, count: reviews.length });
  }

  if (flagged.length === 0) return;

  const products = await Product.find({ _id: { $in: flagged.map((f) => f.productId) } })
    .select("name")
    .lean();
  const nameById = new Map(products.map((p) => [String(p._id), p.name]));
  const top = flagged.slice(0, 5).map((f) => `${nameById.get(f.productId) || f.productId} (${f.count})`);

  await upsertAlert({
    kind: "review_negative_streak",
    severity: flagged.some((f) => f.count >= 5) ? "high" : "medium",
    title: `${flagged.length} product${flagged.length === 1 ? "" : "s"} with negative review streaks`,
    message: `Products with 3+ recent low-rating reviews: ${top.join(", ")}${flagged.length > 5 ? "…" : ""}.`,
    dataSnapshot: { flagged: flagged.slice(0, 20), top },
  });
};

const runAllChecks = async () => {
  try {
    await Promise.all([
      checkRefundAndCancellationSpikes(),
      checkLowStockCritical(),
      checkRevenueDrop(),
      checkConversionDrop(),
      checkNegativeReviewStreaks(),
    ]);
  } catch (err) {
    console.error("[smart-alerts-job] hourly run failed:", err.message);
  }
};

const initSmartAlertsJob = () => {
  if (!cron) return;
  cron.schedule("0 * * * *", runAllChecks);
  console.log("[smart-alerts-job] Scheduled hourly threshold checks.");
};

module.exports = { initSmartAlertsJob, runAllChecks };
