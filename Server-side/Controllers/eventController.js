const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const { trackEvent, getCustomerEvents, getCustomerEventCount } = require("../Services/event-service");
const { EVENT_TYPES } = require("../Models/CustomerEvent");
const User = require("../Models/User");
const logger = require("../Utils/logger");

const validEventTypes = new Set(EVENT_TYPES);

const inferEventType = (eventName) => {
  if (validEventTypes.has(eventName)) return eventName;
  if (eventName.startsWith("page_view")) return "page_view";
  if (eventName.startsWith("product_view")) return "product_view";
  if (eventName.startsWith("add_to_cart")) return "add_to_cart";
  if (eventName.startsWith("remove_from_cart")) return "remove_from_cart";
  if (eventName.startsWith("add_to_wishlist")) return "add_to_wishlist";
  if (eventName.startsWith("begin_checkout")) return "begin_checkout";
  if (eventName.startsWith("purchase")) return "purchase";
  if (eventName.startsWith("search")) return "search";
  return "page_view";
};

const trackEventHandler = catchAsync(async (req, res) => {
  const { eventName, eventType, payload, metadata, timestamp, sessionId } = req.body;

  if (!eventName && !eventType) {
    throw new AppError("eventName or eventType is required", 400);
  }

  const resolvedType = eventType || inferEventType(eventName);

  if (!validEventTypes.has(resolvedType)) {
    throw new AppError(`Invalid event type: ${resolvedType}`, 400);
  }

  await trackEvent({
    customerId: req.customerId,
    sessionId: sessionId || req.sessionId,
    eventType: resolvedType,
    eventName,
    payload: payload || {},
    metadata: {
      ...(metadata || {}),
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get("User-Agent"),
    },
    timestamp: timestamp ? new Date(timestamp) : undefined,
  });

  res.status(202).json({ success: true });
});

const trackBatchHandler = catchAsync(async (req, res) => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    throw new AppError("events array is required", 400);
  }

  if (events.length > 100) {
    throw new AppError("Maximum 100 events per batch", 400);
  }

  const results = { accepted: 0, skipped: 0 };

  for (const event of events) {
    const { eventName, eventType, payload, metadata, timestamp, sessionId } = event;

    if (!eventName && !eventType) {
      results.skipped += 1;
      continue;
    }

    const resolvedType = eventType || inferEventType(eventName);

    if (!validEventTypes.has(resolvedType)) {
      results.skipped += 1;
      continue;
    }

    await trackEvent({
      customerId: req.customerId,
      sessionId: sessionId || req.sessionId,
      eventType: resolvedType,
      eventName,
      payload: payload || {},
      metadata: {
        ...(metadata || {}),
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get("User-Agent"),
      },
      timestamp: timestamp ? new Date(timestamp) : undefined,
    });

    results.accepted += 1;
  }

  res.status(202).json({ success: true, results });
});

const getMyEvents = catchAsync(async (req, res) => {
  const { limit = 50, offset = 0, eventType } = req.query;

  const events = await getCustomerEvents(req.customerId, {
    limit: Math.min(Number(limit), 200),
    offset: Number(offset),
    eventType: eventType || undefined,
  });

  res.status(200).json({
    success: true,
    data: events,
  });
});

const getBehavioralInsights = catchAsync(async (req, res) => {
  const customer = req.customer;

  let user = null;
  if (customer.userId) {
    user = await User.findById(customer.userId).select("totalSpent orderCount membership").lean();
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const recentEventCount = await getCustomerEventCount(req.customerId, { since: thirtyDaysAgo });

  res.status(200).json({
    success: true,
    data: {
      score: customer.behavioralScore || 0,
      clv: customer.customerLifetimeValue || 0,
      churnRisk: customer.predictedChurnRisk || 0,
      totalSpent: user?.totalSpent || 0,
      orderCount: user?.orderCount || 0,
      avgOrderValue: customer.avgOrderValue || 0,
      sessionCount: customer.sessionCount || 0,
      events30d: recentEventCount,
      preferredCategories: customer.preferredCategories || [],
      membership: user?.membership || "standard",
      tier: user?.membership || "standard",
    },
  });
});

module.exports = {
  trackEventHandler,
  trackBatchHandler,
  getMyEvents,
  getBehavioralInsights,
};
