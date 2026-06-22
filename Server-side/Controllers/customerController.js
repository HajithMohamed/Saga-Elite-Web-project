const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Customer = require("../Models/Customer");
const User = require("../Models/User");
const { ensureCustomerRecord, migrateGuestToUser } = require("../Services/migration-service");
const logger = require("../Utils/logger");

// ── Profile merges Customer enrichment + User authoritative data ──
const getMyProfile = catchAsync(async (req, res) => {
  const customer = req.customer;
  let user = null;

  if (customer.userId) {
    user = await User.findById(customer.userId).select(
      "email username phoneNumber profilePicture membership tags totalSpent orderCount lastOrderAt isVerified role"
    ).lean();
  }

  res.status(200).json({
    success: true,
    data: {
      id: customer._id,
      type: customer.type,

      // Authoritative User data (source of truth)
      email: user?.email || customer.email,
      username: user?.username || null,
      phoneNumber: user?.phoneNumber || null,
      profilePicture: user?.profilePicture || null,
      role: user?.role || null,
      membership: user?.membership || "standard",
      tags: user?.tags || [],
      totalSpent: user?.totalSpent || 0,
      orderCount: user?.orderCount || 0,
      lastOrderAt: user?.lastOrderAt || null,
      isVerified: user?.isVerified || false,

      // Customer enrichment data
      behavioralScore: customer.behavioralScore || 0,
      customerLifetimeValue: customer.customerLifetimeValue || 0,
      predictedChurnRisk: customer.predictedChurnRisk || 0,
      preferredCategories: customer.preferredCategories || [],
      avgOrderValue: customer.avgOrderValue || 0,
      sessionCount: customer.sessionCount || 0,
      preferences: customer.preferences || {},
      firstSeenAt: customer.firstSeenAt,
      lastSessionAt: customer.lastSessionAt,
      createdAt: customer.createdAt,
    },
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const allowedFields = ["name", "preferences"];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }

  const customer = await Customer.findByIdAndUpdate(
    req.customerId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: customer,
  });
});

const getViewedProducts = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.customerId)
    .select("viewedProducts")
    .populate("viewedProducts.product", "name slug images basePrice salePrice artNo");

  const viewed = (customer?.viewedProducts || []).slice(0, 50);

  res.status(200).json({
    success: true,
    data: viewed,
  });
});

const clearViewedProducts = catchAsync(async (req, res) => {
  await Customer.findByIdAndUpdate(req.customerId, {
    $set: { viewedProducts: [] },
  });

  res.status(200).json({ success: true, message: "Viewed products cleared" });
});

const syncGuestViewedProducts = catchAsync(async (req, res) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError("productIds array is required", 400);
  }

  const customer = await Customer.findById(req.customerId);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const now = new Date();
  const existingIds = new Set(
    (customer.viewedProducts || []).map((vp) => String(vp.product))
  );

  let added = 0;
  for (const productId of productIds) {
    if (!existingIds.has(String(productId))) {
      customer.viewedProducts.unshift({
        product: productId,
        viewedAt: now,
      });
      added += 1;
    }
  }

  if (customer.viewedProducts.length > 100) {
    customer.viewedProducts = customer.viewedProducts.slice(0, 100);
  }

  if (added > 0) {
    await customer.save();
  }

  res.status(200).json({
    success: true,
    data: { added, total: customer.viewedProducts.length },
  });
});

const migrateFromGuest = catchAsync(async (req, res) => {
  const { guestToken } = req.body;

  if (!guestToken) {
    throw new AppError("guestToken is required", 400);
  }

  const user = req.user;
  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  const customer = await migrateGuestToUser(guestToken, user);
  if (!customer) {
    return res.status(200).json({
      success: true,
      message: "No guest data found to migrate",
      migrated: false,
    });
  }

  logger.info("[customer] guest migration completed", {
    customerId: customer._id,
    userId: user._id,
  });

  res.status(200).json({
    success: true,
    message: "Guest data migrated successfully",
    migrated: true,
    data: customer,
  });
});

const getActivityFeed = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.customerId).select("activityLog");

  res.status(200).json({
    success: true,
    data: (customer?.activityLog || []).slice(-50).reverse(),
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getViewedProducts,
  clearViewedProducts,
  syncGuestViewedProducts,
  migrateFromGuest,
  getActivityFeed,
};
