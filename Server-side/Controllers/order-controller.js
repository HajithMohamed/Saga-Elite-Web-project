const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const Drop = require("../Models/Drop");
const User = require("../Models/User");
const Guest = require("../Models/Guest");
const { createNotification, broadcastNotification } = require("../Utils/notification-service");
const { SOCKET_EVENTS, emitToAll, emitToUser } = require("../Utils/socket-service");
const logger = require("../Utils/logger");

const DASHBOARD_ORDER_STATUSES = [
  "pending",
  "pending_payment",
  "verification_pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const generateReferenceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
  return `SE-${dateStr}-${randomStr}`;
};

const buildSalesTrend = (rawTrend) => {
  const monthMap = new Map(
    rawTrend.map((entry) => [
      `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`,
      entry,
    ]),
  );

  const trend = [];
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const pointDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const key = `${pointDate.getUTCFullYear()}-${String(pointDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthEntry = monthMap.get(key);

    trend.push({
      monthKey: key,
      label: pointDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      revenue: monthEntry?.revenue || 0,
      orders: monthEntry?.orders || 0,
    });
  }

  return trend;
};

const createOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    checkoutMode,
    shippingAddress,
    contactNumber,
    paymentMethod,
    paymentProofUrl,
    notes,
    guestEmail,
  } = req.body;

  logger.debug("Order creation request received", {
    checkoutMode,
    itemCount: Array.isArray(items) ? items.length : 0,
    paymentMethod,
    hasGuestEmail: Boolean(guestEmail),
  });

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Order items are required", 400));
  }

  if (!shippingAddress || !shippingAddress.trim()) {
    return next(new AppError("Shipping address is required", 400));
  }

  if (!contactNumber || !contactNumber.trim()) {
    return next(new AppError("Contact number is required", 400));
  }

  if (!paymentMethod || !["payhere", "gpay", "manual", "manual_bank_transfer", "card", "lankapay", "cash"].includes(paymentMethod)) {
    return next(new AppError("Invalid payment method", 400));
  }

  const isLegacyManualPayment = paymentMethod === "manual";
  const isBankTransferPayment = paymentMethod === "manual_bank_transfer";

  if (isLegacyManualPayment && !paymentProofUrl?.trim()) {
    return next(new AppError("Receipt information is required for manual payment", 400));
  }

  // Determine if guest or user
  let user = req.userInfo;
  let guest = null;
  let guestEmailNormalized = null;

  if (!user && guestEmail) {
    guestEmailNormalized = guestEmail.trim().toLowerCase();
    guest = await Guest.findOneAndUpdate(
      { email: guestEmailNormalized },
      { lastUsedAt: new Date() },
      { upsert: true, new: true }
    );
  } else if (!user) {
    return next(new AppError("Authentication required for registered users or guest email for guests", 401));
  }

  const normalizedCheckoutMode = checkoutMode === "buyNow" ? "buyNow" : "cart";

  const session = await mongoose.startSession();

  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const { productId, variantSku, quantity } = item;

        if (!productId || !variantSku || !quantity || quantity <= 0) {
          throw new AppError("Each order item must include a product, variant, and positive quantity", 400);
        }

        const product = await Product.findById(productId).session(session);

        if (!product || !product.isActive) {
          throw new AppError("Product not found or unavailable", 404);
        }

        const variant = product.variants.find((variant) => variant.sku === variantSku);

        if (!variant) {
          throw new AppError("Selected product variant not found", 404);
        }

        if (variant.stock < quantity) {
          throw new AppError(
            `Not enough stock for ${product.name} (${variant.size} / ${variant.color}).`,
            400,
          );
        }

        if (product.isLimited) {
          const previousQuantityResult = await Order.aggregate([
            {
              $match: user
                ? { user: user._id }
                : { guest: guest._id }
            },
            { $unwind: "$items" },
            { $match: { "items.product": product._id } },
            { $group: { _id: null, totalQuantity: { $sum: "$items.quantity" } } },
          ]).session(session);

          const previouslyOrdered = previousQuantityResult?.[0]?.totalQuantity || 0;

          if (previouslyOrdered + quantity > product.maxPerUser) {
            throw new AppError(
              `Limit exceeded for ${product.name}. You may order up to ${product.maxPerUser} units total.`,
              400,
            );
          }
        }

        const priceBeforeDiscount =
          product.basePrice + (variant.priceAdjustment || 0);
        const unitPrice = Math.round(
          priceBeforeDiscount * (1 - (product.discountPercent || 0) / 100)
        );
        const itemTotal = unitPrice * quantity;

        variant.stock -= quantity;
        product.soldCount += quantity;

        await product.save({ session, validateModifiedOnly: true });

        orderItems.push({
          product: product._id,
          productName: product.name,
          productArtNo: product.artNo,
          productSlug: product.slug,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity,
          unitPrice,
          totalPrice: itemTotal,
        });

        totalAmount += itemTotal;
      }

      const orderPayload = {
        user: user ? user._id : undefined,
        guest: guest ? guest._id : undefined,
        guestEmail: guestEmailNormalized,
        items: orderItems,
        totalAmount,
        shippingAddress: shippingAddress.trim(),
        contactNumber: contactNumber.trim(),
        paymentMethod,
        paymentProofUrl: paymentProofUrl ? paymentProofUrl.trim() : undefined,
        referenceNumber: isLegacyManualPayment ? generateReferenceNumber() : undefined,
        notes: notes?.trim(),
        status: isBankTransferPayment
          ? "pending_payment"
          : ["manual", "cash"].includes(paymentMethod)
            ? "verification_pending"
            : "confirmed",
        paymentStatus: isBankTransferPayment || ["manual", "cash"].includes(paymentMethod) ? "pending" : "paid",
        expiresAt: isLegacyManualPayment || paymentMethod === "cash"
          ? new Date(Date.now() + 15 * 60000)
          : undefined,
      };

      const [orderDocument] = await Order.create([orderPayload], { session });
      createdOrder = orderDocument;

      if (user && normalizedCheckoutMode === "cart") {
        user.cart = [];
        await user.save({ session, validateModifiedOnly: true });
      }

      if (guest) {
        guest.orderCount += 1;
        await guest.save({ session });
      }
    });
  } finally {
    session.endSession();
  }

  const orderNotification = {
    userId: user ? user._id : null,
    type: "order",
    title: "Order placed successfully",
    message: `Your order ${createdOrder._id} has been placed and is ${createdOrder.status}.`,
    entityRef: createdOrder._id,
    entityType: "Order",
    meta: { orderId: createdOrder._id },
  };

  if (user) {
    await createNotification(orderNotification);
  }

  await broadcastNotification({
    type: "admin",
    title: `New order received: ${createdOrder._id}`,
    message: `Order ${createdOrder._id} was placed by ${user ? user.email : guestEmailNormalized || "a guest"} for ${createdOrder.totalAmount}.`,
    entityRef: createdOrder._id,
    entityType: "Order",
    meta: { orderId: createdOrder._id, customer: user ? user.email : guestEmailNormalized },
    filter: { role: "admin" },
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    orderId: createdOrder._id,
    amount: createdOrder.totalAmount,
    referenceNumber: createdOrder.referenceNumber || null,
    data: createdOrder,
  });
});

const getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.userInfo._id })
    .populate({
      path: "items.product",
      select: "name slug primaryImage",
      populate: {
        path: "images",
        options: { sort: { order: 1 } },
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "User orders fetched successfully",
    data: orders,
  });
});

const getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "email role")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "All orders fetched successfully",
    data: orders,
  });
});

const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "email role profilePicture provider")
    .populate({
      path: "items.product",
      select: "primaryImage name slug",
      populate: {
        path: "images",
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  const orderOwnerId = order.user?._id || order.user;
  const isOwner = String(orderOwnerId) === String(req.userInfo._id);
  const isAdmin = ["admin", "superadmin"].includes(req.userInfo.role);

  if (!isOwner && !isAdmin) {
    return next(new AppError("You are not authorized to view this order", 403));
  }

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: order,
  });
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "pending_payment", "verification_pending", "confirmed", "shipped", "delivered", "cancelled"];

  if (!status || !allowedStatuses.includes(status)) {
    return next(new AppError("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.status = status;
  if (status === "confirmed" && ["manual", "manual_bank_transfer", "cash", "receipt"].includes(order.paymentMethod)) {
    order.paymentStatus = "paid";
  }

  await order.save({ validateModifiedOnly: true });

  await createNotification({
    userId: order.user,
    type: "order",
    title: "Order status updated",
    message: `Your order ${order._id} status changed to ${order.status}.`,
    entityRef: order._id,
    entityType: "Order",
    meta: { orderId: order._id, status: order.status },
  });

  await broadcastNotification({
    type: "admin",
    title: `Order ${order._id} status changed`,
    message: `Order ${order._id} is now ${order.status}.`,
    entityRef: order._id,
    entityType: "Order",
    meta: { orderId: order._id, status: order.status },
    filter: { role: "admin" },
  });

  emitToUser(order.user, SOCKET_EVENTS.ORDER_REFRESH, {
    userId: order.user,
    orderId: order._id,
    status: order.status,
    paymentStatus: order.paymentStatus,
  });

  emitToAll(SOCKET_EVENTS.ORDER_REFRESH, {
    userId: order.user,
    orderId: order._id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    source: "order-status-update",
  });

  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: "order-status-update",
    orderId: order._id,
    userId: order.user,
  });

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: order,
  });
});

const getDashboardStats = catchAsync(async (req, res, next) => {
  const now = new Date();
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const revenueMatch = { status: { $ne: "cancelled" } };

  const [
    revenueSummary,
    totalOrders,
    activeOrders,
    totalProducts,
    totalCustomers,
    totalDrops,
    liveDrops,
    archivedDrops,
    lowStockProducts,
    statusBreakdownRaw,
    paymentMethodBreakdown,
    soldUnitsSummary,
    bestSellingProductDoc,
    mostWishedProductDoc,
    topProductsDocs,
    inventoryAlertsDocs,
    recentOrdersDocs,
    topDrops,
    salesTrendRaw,
    nextScheduledDropDoc,
  ] = await Promise.all([
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
            },
          },
          nonCancelledOrders: { $sum: 1 },
        },
      },
    ]),
    Order.countDocuments(),
    Order.countDocuments({
      status: { $in: ["pending", "pending_payment", "verification_pending", "confirmed", "shipped"] },
    }),
    Product.countDocuments(),
    User.countDocuments({ role: "user" }),
    Drop.countDocuments(),
    Drop.countDocuments({ isPublished: true, isArchived: false }),
    Drop.countDocuments({ isArchived: true }),
    Product.countDocuments({ isActive: true, totalStock: { $lte: 5 } }),
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
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
      { $sort: { count: -1, revenue: -1 } },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalSoldUnits: { $sum: "$soldCount" },
          totalWishlistAdds: { $sum: "$wishCount" },
          stockOnHand: { $sum: "$totalStock" },
        },
      },
    ]),
    Product.findOne({ soldCount: { $gt: 0 } })
      .sort({ soldCount: -1, wishCount: -1, createdAt: 1 })
      .select("name slug artNo soldCount wishCount totalStock discountPercent basePrice drop")
      .populate("drop", "name slug releaseDate isPublished isArchived")
      .lean(),
    Product.findOne({ wishCount: { $gt: 0 } })
      .sort({ wishCount: -1, soldCount: -1, createdAt: 1 })
      .select("name slug artNo soldCount wishCount totalStock discountPercent basePrice drop")
      .populate("drop", "name slug releaseDate isPublished isArchived")
      .lean(),
    Product.find({ soldCount: { $gt: 0 } })
      .sort({ soldCount: -1, wishCount: -1, totalStock: 1 })
      .limit(5)
      .select("name slug artNo soldCount wishCount totalStock discountPercent basePrice drop")
      .populate("drop", "name slug releaseDate isPublished isArchived")
      .lean(),
    Product.find({ isActive: true, totalStock: { $lte: 5 } })
      .sort({ totalStock: 1, soldCount: -1, wishCount: -1 })
      .limit(6)
      .select("name slug artNo totalStock soldCount wishCount drop")
      .populate("drop", "name slug")
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("_id totalAmount status paymentMethod paymentStatus createdAt items user")
      .populate("user", "email")
      .lean(),
    Product.aggregate([
      {
        $group: {
          _id: "$drop",
          productCount: { $sum: 1 },
          soldUnits: { $sum: "$soldCount" },
          totalWishlistAdds: { $sum: "$wishCount" },
          stockOnHand: { $sum: "$totalStock" },
        },
      },
      { $sort: { soldUnits: -1, totalWishlistAdds: -1, productCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "drops",
          localField: "_id",
          foreignField: "_id",
          as: "drop",
        },
      },
      {
        $unwind: {
          path: "$drop",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          dropId: "$_id",
          name: { $ifNull: ["$drop.name", "Independent Release"] },
          slug: "$drop.slug",
          releaseDate: "$drop.releaseDate",
          isPublished: "$drop.isPublished",
          isArchived: "$drop.isArchived",
          productCount: 1,
          soldUnits: 1,
          totalWishlistAdds: 1,
          stockOnHand: 1,
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Drop.findOne({
      releaseDate: { $gt: now },
      isArchived: false,
    })
      .sort({ releaseDate: 1 })
      .select("name slug releaseDate isPublished isArchived")
      .lean(),
  ]);

  const revenueStats = revenueSummary[0] || {
    totalRevenue: 0,
    completedRevenue: 0,
    nonCancelledOrders: 0,
  };
  const soldUnitsStats = soldUnitsSummary[0] || {
    totalSoldUnits: 0,
    totalWishlistAdds: 0,
    stockOnHand: 0,
  };

  const statusBreakdown = DASHBOARD_ORDER_STATUSES.reduce((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});

  statusBreakdownRaw.forEach((entry) => {
    if (entry?._id) {
      statusBreakdown[entry._id] = entry.count;
    }
  });

  let nextScheduledDrop = null;

  if (nextScheduledDropDoc) {
    const nextDropProductCount = await Product.countDocuments({
      drop: nextScheduledDropDoc._id,
      isActive: true,
    });

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilRelease = Math.max(
      0,
      Math.ceil((new Date(nextScheduledDropDoc.releaseDate).getTime() - now.getTime()) / msPerDay),
    );

    nextScheduledDrop = {
      ...nextScheduledDropDoc,
      productCount: nextDropProductCount,
      daysUntilRelease,
    };
  }

  const recentOrders = recentOrdersDocs.map((order) => ({
    _id: order._id,
    customerEmail: order.user?.email || "Unknown customer",
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
    createdAt: order.createdAt,
  }));

  const topProducts = topProductsDocs.map((product) => ({
    ...product,
    dropName: product.drop?.name || "Independent Release",
    dropSlug: product.drop?.slug || null,
  }));

  const inventoryAlerts = inventoryAlertsDocs.map((product) => ({
    ...product,
    dropName: product.drop?.name || "Independent Release",
    dropSlug: product.drop?.slug || null,
  }));

  const paymentMix = paymentMethodBreakdown.map((entry) => ({
    method: entry._id,
    count: entry.count,
    revenue: entry.revenue,
  }));

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalRevenue: revenueStats.totalRevenue,
        completedRevenue: revenueStats.completedRevenue,
        totalOrders,
        activeOrders,
        totalProducts,
        totalCustomers,
        totalDrops,
        liveDrops,
        archivedDrops,
        lowStockProducts,
        pendingVerification: (statusBreakdown.pending_payment || 0) + (statusBreakdown.verification_pending || 0),
        deliveredOrders: statusBreakdown.delivered || 0,
        totalSoldUnits: soldUnitsStats.totalSoldUnits,
        totalWishlistAdds: soldUnitsStats.totalWishlistAdds,
        stockOnHand: soldUnitsStats.stockOnHand,
        averageOrderValue: revenueStats.nonCancelledOrders
          ? revenueStats.totalRevenue / revenueStats.nonCancelledOrders
          : 0,
      },
      highlights: {
        bestSellingProduct: bestSellingProductDoc,
        mostWishedProduct: mostWishedProductDoc,
        topDrop: topDrops[0] || null,
        nextScheduledDrop,
      },
      orderStatusBreakdown: statusBreakdown,
      paymentMethodBreakdown: paymentMix,
      salesTrend: buildSalesTrend(salesTrendRaw),
      topProducts,
      topDrops,
      inventoryAlerts,
      recentOrders,
    },
  });
});

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
};
