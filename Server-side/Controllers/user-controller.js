const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const User = require("../Models/User");
const Order = require("../Models/Order");
const ManualPayment = require("../Models/ManualPayment");
const Notification = require("../Models/Notification");
const LoginActivity = require("../Models/LoginActivity");
const UserActivityLog = require("../Models/UserActivityLog");
const Customer = require("../Models/Customer");
const { isAdminRole } = require("../Utils/admin-roles");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const {
  isValidSriLankanMobile,
  normalizeSriLankanMobile,
} = require("../Utils/phone-validator");

// Single source of truth for customer tags; mirrored by User.tags enum and
// referenced by both the per-user status endpoint and the bulk-tag endpoint.
const USER_TAG_ENUM = Object.freeze([
  "vip",
  "high_spender",
  "drop_collector",
  "frequent_buyer",
  "refund_risk",
  "early_supporter",
]);

const normalizeCartItem = (item) => {
  const product = item.product;
  const variant = product?.variants?.find(v => v._id?.toString() === item.variant?.toString());

  if (!product || !variant) {
    return null;
  }

  const priceBeforeDiscount = product.basePrice + (variant.priceAdjustment || 0);
  const price = Math.round(
    priceBeforeDiscount * (1 - (product.discountPercent || 0) / 100)
  );
  const productImages = Array.isArray(product.images)
    ? product.images.map((image) => ({
        _id: image._id,
        url: image.url,
        altText: image.altText,
        colorTag: image.colorTag || "",
        order: image.order,
        isPrimary: image.isPrimary,
      }))
    : [];

  return {
    id: item._id,
    quantity: item.quantity,
    addedAt: item.addedAt,
    product: {
      id: product._id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      discountPercent: product.discountPercent,
      basePrice: product.basePrice,
      image: productImages[0]?.url || null,
      images: productImages,
      sizes: [...new Set((product.variants || []).map((entry) => entry?.size).filter(Boolean))],
      colors: [...new Set((product.variants || []).map((entry) => entry?.color).filter(Boolean))],
      variants: (product.variants || []).map((entry) => ({
        id: entry._id,
        sku: entry.sku,
        size: entry.size,
        color: entry.color,
        colorCode: entry.colorCode,
        stock: entry.stock,
        priceAdjustment: entry.priceAdjustment,
      })),
    },
    variant: {
      id: variant._id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorCode: variant.colorCode,
      stock: variant.stock,
      priceAdjustment: variant.priceAdjustment,
    },
    unitPrice: price,
    subTotal: price * item.quantity,
  };
};

const normalizeWishlistItem = (product) => ({
  id: product._id,
  name: product.name,
  slug: product.slug,
  brand: product.brand,
  category: product.category,
  discountPercent: product.discountPercent,
  basePrice: product.basePrice,
  image: product.images?.[0]?.url || null,
});

const buildAdminUserSummary = (user, orderStats = {}, notificationStats = {}, customerStats = {}) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  provider: user.provider,
  profilePicture: user.profilePicture || null,
  isVerified: user.isVerified,
  isActive: user.isActive,
  membership: user.membership || "standard",
  tags: Array.isArray(user.tags) ? user.tags : [],
  adminNotes: Array.isArray(user.adminNotes) ? user.adminNotes : [],
  savedPaymentMethod: user.savedPaymentMethod || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  intelligence: {
    predictedChurnRisk: customerStats.predictedChurnRisk || 0,
    customerLifetimeValue: customerStats.customerLifetimeValue || orderStats.totalSpent || user.totalSpent || 0,
  },
  relationship: {
    cartCount: user.cart?.length || 0,
    wishlistCount: user.wishlist?.length || 0,
    addressesCount: user.addresses?.length || 0,
    orderCount: orderStats.orderCount || user.orderCount || 0,
    deliveredOrders: orderStats.deliveredOrders || 0,
    pendingOrders: orderStats.pendingOrders || 0,
    totalSpent: orderStats.totalSpent || user.totalSpent || 0,
    lastOrderAt: orderStats.lastOrderAt || user.lastOrderAt || null,
    lastOrderStatus: orderStats.lastOrderStatus || null,
    notificationCount: notificationStats.notificationCount || 0,
    unreadNotifications: notificationStats.unreadNotifications || 0,
    lastNotificationAt: notificationStats.lastNotificationAt || null,
  },
});

const getUserInsightMaps = async (userIds = []) => {
  if (!userIds.length) {
    return {
      orderStatsMap: new Map(),
      notificationStatsMap: new Map(),
      customerStatsMap: new Map(),
    };
  }

  const [orderStats, notificationStats, customerStats] = await Promise.all([
    Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["pending", "verification_pending", "confirmed", "shipped"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalSpent: { $sum: "$totalAmount" },
          lastOrderAt: { $first: "$createdAt" },
          lastOrderStatus: { $first: "$status" },
        },
      },
    ]),
    Notification.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          notificationCount: { $sum: 1 },
          unreadNotifications: {
            $sum: {
              $cond: [{ $eq: ["$isRead", false] }, 1, 0],
            },
          },
          lastNotificationAt: { $first: "$createdAt" },
        },
      },
    ]),
    Customer.find({ userId: { $in: userIds } })
      .select("userId predictedChurnRisk customerLifetimeValue")
      .lean(),
  ]);

  return {
    orderStatsMap: new Map(
      orderStats.map((entry) => [entry._id.toString(), entry])
    ),
    notificationStatsMap: new Map(
      notificationStats.map((entry) => [entry._id.toString(), entry])
    ),
    customerStatsMap: new Map(
      customerStats.map((entry) => [entry.userId.toString(), entry])
    ),
  };
};

const buildActivityTimeline = ({ user, recentOrders = [], recentNotifications = [] }) => {
  const activityItems = [
    {
      id: `user-created-${user._id}`,
      type: "account_created",
      title: "Account created",
      description: `${user.email} joined the platform.`,
      createdAt: user.createdAt,
    },
  ];

  if (
    user.updatedAt &&
    user.createdAt &&
    user.updatedAt.getTime() !== user.createdAt.getTime()
  ) {
    activityItems.push({
      id: `user-updated-${user._id}`,
      type: "profile_updated",
      title: "Profile updated",
      description: "Profile, wishlist, cart, or address data changed.",
      createdAt: user.updatedAt,
    });
  }

  recentOrders.forEach((order) => {
    activityItems.push({
      id: `order-${order._id}`,
      type: "order",
      title: `Order ${order.status}`,
      description: `Placed ${order.items?.length || 0} item(s) via ${order.paymentMethod}.`,
      createdAt: order.createdAt,
      meta: {
        orderId: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
    });
  });

  recentNotifications.forEach((notification) => {
    activityItems.push({
      id: `notification-${notification._id}`,
      type: "notification",
      title: notification.title,
      description: notification.message,
      createdAt: notification.createdAt,
      meta: {
        notificationType: notification.type,
        isRead: notification.isRead,
      },
    });
  });

  return activityItems
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .slice(0, 10);
};

const escapeCsvValue = (value) => {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

const getAdminUserStats = async () => {
  const [userStatsResult, orderStatsResult] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 0, 1] },
          },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] },
          },
          googleUsers: {
            $sum: { $cond: [{ $eq: ["$provider", "google"] }, 1, 0] },
          },
          localUsers: {
            $sum: { $cond: [{ $eq: ["$provider", "local"] }, 1, 0] },
          },
          adminUsers: {
            $sum: {
              $cond: [{ $in: ["$role", ["user", "customer"]] }, 0, 1],
            },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: { user: { $ne: null } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const userStats = userStatsResult[0] || {};
  const orderStats = orderStatsResult[0] || {};

  return {
    totalUsers: userStats.totalUsers || 0,
    activeUsers: userStats.activeUsers || 0,
    inactiveUsers: userStats.inactiveUsers || 0,
    verifiedUsers: userStats.verifiedUsers || 0,
    googleUsers: userStats.googleUsers || 0,
    localUsers: userStats.localUsers || 0,
    adminUsers: userStats.adminUsers || 0,
    totalOrders: orderStats.totalOrders || 0,
    totalRevenue: orderStats.totalRevenue || 0,
  };
};

const getAdminUsers = catchAsync(async (req, res, next) => {
  const paginated = res.paginatedResults || {
    total: 0,
    page: 1,
    limit: 10,
    results: 0,
    totalPages: 1,
    data: [],
  };
  const users = paginated.data || [];

  const userIds = users.map((user) => user._id);
  const [{ orderStatsMap, notificationStatsMap, customerStatsMap }, stats] = await Promise.all([
    getUserInsightMaps(userIds),
    getAdminUserStats(),
  ]);

  const mappedUsers = users.map((user) =>
    buildAdminUserSummary(
      user,
      orderStatsMap.get(user._id.toString()),
      notificationStatsMap.get(user._id.toString()),
      customerStatsMap.get(user._id.toString())
    )
  );

  res.status(200).json({
    success: true,
    message: "Admin users fetched successfully",
    data: {
      stats,
      users: mappedUsers,
      pagination: {
        total: paginated.total || 0,
        page: paginated.page || 1,
        limit: paginated.limit || 10,
        results: paginated.results || mappedUsers.length,
        totalPages: paginated.totalPages || 1,
        next: paginated.next || null,
        previous: paginated.previous || null,
      },
    },
  });
});

const getAdminUserDetail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select(
      "email role provider profilePicture isVerified isActive membership tags adminNotes totalSpent orderCount lastOrderAt savedPaymentMethod cart wishlist addresses createdAt updatedAt"
    )
    .populate({ path: "adminNotes.author", select: "email name" })
    .lean();

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const { orderStatsMap, notificationStatsMap } = await getUserInsightMaps([user._id]);

  const [recentOrders, recentNotifications, recentLogins, customerIntelligence] = await Promise.all([
    Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("items totalAmount status paymentStatus paymentMethod referenceNumber createdAt")
      .lean(),
    Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("type title message isRead entityType createdAt")
      .lean(),
    LoginActivity.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .select("success failureReason provider ip deviceHint userAgent createdAt")
      .lean(),
    Customer.findOne({ userId: user._id })
      .populate("viewedProducts.product", "name images basePrice slug discountPercent category")
      .lean(),
  ]);

  // Tag entries that look suspicious so the UI can highlight them. "First
  // sighting" of an IP or device counts as new only if at least one prior
  // success exists — a brand-new account with one login isn't suspicious.
  const successCount = recentLogins.filter((l) => l.success).length;
  const seenIps = new Set();
  const seenDevices = new Set();
  const decoratedLogins = [...recentLogins].reverse().map((l) => {
    const isNewIp = l.ip && !seenIps.has(l.ip);
    const isNewDevice = l.deviceHint && !seenDevices.has(l.deviceHint);
    if (l.ip) seenIps.add(l.ip);
    if (l.deviceHint) seenDevices.add(l.deviceHint);
    return {
      ...l,
      newIp: l.success && successCount > 1 && isNewIp,
      newDevice: l.success && successCount > 1 && isNewDevice,
    };
  }).reverse();

  const summary = buildAdminUserSummary(
    user,
    orderStatsMap.get(user._id.toString()),
    notificationStatsMap.get(user._id.toString()),
    customerIntelligence || {}
  );

  res.status(200).json({
    success: true,
    message: "Admin user detail fetched successfully",
    data: {
      ...summary,
      addresses: user.addresses || [],
      recentOrders,
      recentNotifications,
      recentLogins: decoratedLogins,
      intelligence: customerIntelligence ? {
        behavioralScore: customerIntelligence.behavioralScore || 0,
        customerLifetimeValue: customerIntelligence.customerLifetimeValue || 0,
        predictedChurnRisk: customerIntelligence.predictedChurnRisk || 0,
        preferredCategories: customerIntelligence.preferredCategories || [],
        viewedProducts: (customerIntelligence.viewedProducts || []).map(vp => ({
          ...vp,
          product: vp.product ? normalizeWishlistItem(vp.product) : null
        })).filter(vp => vp.product),
      } : {
        behavioralScore: 0,
        customerLifetimeValue: 0,
        predictedChurnRisk: 0,
        preferredCategories: [],
        viewedProducts: []
      },
      activityTimeline: buildActivityTimeline({
        user,
        recentOrders,
        recentNotifications,
      }),
    },
  });
});

const updateAdminUserStatus = catchAsync(async (req, res, next) => {
  const { isActive, membership, tags, addAdminNote } = req.body;

  if (
    typeof isActive === "undefined" &&
    typeof membership === "undefined" &&
    typeof tags === "undefined" &&
    !addAdminNote
  ) {
    return next(
      new AppError(
        "isActive, membership, tags, or addAdminNote must be provided",
        400
      )
    );
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user._id.toString() === req.userInfo._id.toString()) {
    return next(new AppError("You cannot change your own account status here", 400));
  }

  if (isAdminRole(user.role)) {
    return next(new AppError("Only customer accounts can be updated from user management", 403));
  }

  const changes = [];
  if (typeof isActive === "boolean") {
    user.isActive = isActive;
    changes.push(isActive ? "activated" : "deactivated");
  }
  if (typeof membership === "string") {
    user.membership = membership;
    changes.push(`membership → ${membership}`);
  }

  // Tag mutation — accepts the full target set; the model's enum guard
  // filters anything unknown so the client doesn't need to validate.
  if (Array.isArray(tags)) {
    const cleaned = [...new Set(tags.filter((t) => USER_TAG_ENUM.includes(t)))];
    user.tags = cleaned;
    changes.push(`tags: ${cleaned.length ? cleaned.join(", ") : "cleared"}`);
  }

  // Append-only note. Capture author so the audit trail shows who said what.
  if (typeof addAdminNote === "string" && addAdminNote.trim()) {
    user.adminNotes.push({
      note: addAdminNote.trim().slice(0, 2000),
      author: req.userInfo._id,
      createdAt: new Date(),
    });
    changes.push("note added");
  }

  await user.save({ validateBeforeSave: false });

  const { orderStatsMap, notificationStatsMap, customerStatsMap } = await getUserInsightMaps([user._id]);

  res.status(200).json({
    success: true,
    message: changes.length ? `User ${changes.join(", ")}` : "User updated",
    data: buildAdminUserSummary(
      user.toObject(),
      orderStatsMap.get(user._id.toString()),
      notificationStatsMap.get(user._id.toString()),
      customerStatsMap.get(user._id.toString())
    ),
  });
});

/*
|--------------------------------------------------------------------------
| Bulk add/remove a single tag across many customers. Body is pre-validated
| by validateBulkUserTag — `tag` is one of USER_TAG_ENUM and `mode` is
| 'add' | 'remove'. Excludes admin accounts defensively even though the
| client should never send admin IDs here.
|--------------------------------------------------------------------------
*/
const bulkTagUsers = catchAsync(async (req, res) => {
  const { ids, tag, mode } = req.body;

  const filter = {
    _id: { $in: ids },
    role: { $in: ["user", "customer"] },
  };
  const update =
    mode === "add"
      ? { $addToSet: { tags: tag } }
      : { $pull: { tags: tag } };

  const result = await User.updateMany(filter, update);
  const matched = result.matchedCount ?? 0;
  const modified = result.modifiedCount ?? 0;

  // Failure here is an ID that was not a customer (or didn't exist). The
  // tag set is idempotent so "matched but not modified" is a no-op success
  // (e.g., tag already present on add, or already absent on remove).
  const failed = ids
    .filter((_id, i) => i >= matched)
    .map((id) => ({ id, reason: "not a customer or not found" }));

  req.adminAction = `Bulk tag ${mode} → ${tag} (${matched}/${ids.length})`;
  req.adminDetails = {
    total: ids.length,
    succeededCount: matched,
    failedCount: failed.length,
    modifiedCount: modified,
    tag,
    mode,
    ids,
  };

  res.status(200).json({
    success: true,
    total: ids.length,
    succeeded: ids.slice(0, matched),
    failed,
    modified,
  });
});

/*
|--------------------------------------------------------------------------
| Admin-triggered password reset (sends OTP email — same as forgotPassword)
|--------------------------------------------------------------------------
*/
const triggerAdminPasswordReset = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    "email role provider isActive resetPasswordOtp resetPasswordOtpExpires"
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (isAdminRole(user.role)) {
    return next(
      new AppError(
        "Admin accounts must reset their password through the auth flow",
        403
      )
    );
  }

  if (user.provider && user.provider !== "local") {
    return next(
      new AppError(
        `User signed in with ${user.provider}; they cannot reset a local password`,
        400
      )
    );
  }

  if (!user.email) {
    return next(new AppError("User has no email on file", 400));
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const html = buildEmailTemplate(
    "Password Reset Request",
    `<p>Hi,</p>
     <p>An admin at Saga Elite has triggered a password reset for your account.</p>
     <p>Your one-time code is:</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;color:#f2ca50;">${otp}</p>
     <p>This code expires in ${otpExpiryMinutes} minutes. If you did not request this, you can safely ignore this email.</p>`
  );

  await sendEmail({
    email: user.email,
    subject: "Saga Elite — password reset requested",
    html,
  });

  res.status(200).json({
    success: true,
    message: `Password reset email sent to ${user.email}`,
  });
});

const deleteAdminUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user._id.toString() === req.userInfo._id.toString()) {
    return next(new AppError("You cannot delete your own account here", 400));
  }

  if (isAdminRole(user.role)) {
    return next(new AppError("Only customer accounts can be deleted from user management", 403));
  }

  const wishlistProductIds = [...new Set((user.wishlist || []).map((entry) => entry.toString()))];

  if (wishlistProductIds.length) {
    const wishedProducts = await Product.find({ _id: { $in: wishlistProductIds } });
    await Promise.all(
      wishedProducts.map((product) => {
        product.wishCount = Math.max((product.wishCount || 0) - 1, 0);
        return product.save({ validateBeforeSave: false });
      })
    );
  }

  await Promise.all([
    Notification.deleteMany({ user: user._id }),
    User.findByIdAndDelete(user._id),
  ]);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: {
      _id: req.params.id,
    },
  });
});

const getCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const cart = (user.cart || [])
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  const totalPrice = cart.reduce((sum, item) => sum + item.subTotal, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  res.status(200).json({
    success: true,
    message: "Cart loaded successfully",
    data: {
      cart,
      totalPrice,
      totalQuantity,
    },
  });
});

const getWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userInfo.id)
    .populate({
      path: "wishlist",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const wishlist = (user.wishlist || []).map(normalizeWishlistItem);

  res.status(200).json({
    success: true,
    message: "Wishlist loaded successfully",
    data: {
      wishlist,
    },
  });
});

const addToCart = catchAsync(async (req, res, next) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  if (quantity <= 0) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    return next(new AppError("Product not found or no longer available", 404));
  }

  const selectedVariant = variantId
    ? product.variants.id(variantId)
    : product.variants[0];

  if (!selectedVariant) {
    return next(new AppError("Selected product variant not found", 400));
  }

  const user = await User.findById(req.userInfo.id);

  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const existingItem = user.cart.find(
    (item) =>
      item.product.toString() === productId.toString() &&
      item.variant.toString() === selectedVariant._id.toString()
  );

  const requestedQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  if (requestedQuantity > selectedVariant.stock) {
    return next(
      new AppError(
        `Only ${selectedVariant.stock} units are available for this variant`,
        400
      )
    );
  }

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
  } else {
    user.cart.push({
      product: product._id,
      variant: selectedVariant._id,
      quantity,
    });
    // Track add-to-cart events on the product (only on first add per user, to mirror
    // viewCount semantics — increasing quantity later does not re-fire).
    Product.updateOne(
      { _id: product._id },
      { $inc: { cartAddCount: 1 } }
    ).catch(() => {});
    UserActivityLog.create({
      userId: req.userInfo?.id || null,
      productId: product._id,
      action: "cart_add",
      category: product.category || "",
    }).catch(() => {});
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const cart = updatedUser.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  res.status(200).json({
    success: true,
    message: "Product added to cart",
    data: { cart },
  });
});

const updateCartItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity, variantId } = req.body;

  if (!itemId) {
    return next(new AppError("Cart item ID is required", 400));
  }

  if (quantity == null && !variantId) {
    return next(new AppError("Quantity or variant must be provided", 400));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const cartItem = user.cart.id(itemId);
  if (!cartItem) {
    return next(new AppError("Cart item not found", 404));
  }

  const product = await Product.findById(cartItem.product);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const currentVariant = product.variants.id(cartItem.variant);
  if (!currentVariant) {
    return next(new AppError("Product variant not found", 400));
  }

  const nextVariant = variantId ? product.variants.id(variantId) : currentVariant;
  if (!nextVariant) {
    return next(new AppError("Selected product variant not found", 400));
  }

  const nextQuantity = quantity == null ? cartItem.quantity : Number(quantity);

  if (Number.isNaN(nextQuantity)) {
    return next(new AppError("Quantity must be a valid number", 400));
  }

  if (nextQuantity <= 0) {
    user.cart.pull(itemId);
  } else {
    const duplicateItem = user.cart.find(
      (item) =>
        item._id.toString() !== itemId.toString() &&
        item.product.toString() === product._id.toString() &&
        item.variant.toString() === nextVariant._id.toString()
    );

    const requestedQuantity = duplicateItem
      ? duplicateItem.quantity + nextQuantity
      : nextQuantity;

    if (requestedQuantity > nextVariant.stock) {
      return next(
        new AppError(
          `Only ${nextVariant.stock} units are available for this variant`,
          400
        )
      );
    }

    if (duplicateItem) {
      duplicateItem.quantity = requestedQuantity;
      user.cart.pull(itemId);
    } else {
      cartItem.variant = nextVariant._id;
      cartItem.quantity = nextQuantity;
    }
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const cart = updatedUser.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  res.status(200).json({
    success: true,
    message: "Cart updated successfully",
    data: { cart },
  });
});

const removeCartItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;

  if (!itemId) {
    return next(new AppError("Cart item ID is required", 400));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const cartItem = user.cart.id(itemId);
  if (!cartItem) {
    return next(new AppError("Cart item not found", 404));
  }

  user.cart.pull(itemId);
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "cart.product",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const cart = updatedUser.cart
    .map(normalizeCartItem)
    .filter((item) => item !== null);

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    data: { cart },
  });
});

const addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError("Product not found or no longer available", 404));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  if (user.wishlist.some((entry) => entry.toString() === productId.toString())) {
    return res.status(200).json({
      success: true,
      message: "Product already in wishlist",
    });
  }

  user.wishlist.push(product._id);
  await user.save({ validateBeforeSave: false });

  product.wishCount = (product.wishCount || 0) + 1;
  await product.save({ validateBeforeSave: false });

  UserActivityLog.create({
    userId: req.userInfo?.id || null,
    productId: product._id,
    action: "wishlist_add",
    category: product.category || "",
  }).catch(() => {});

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "wishlist",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const wishlist = (updatedUser.wishlist || []).map(normalizeWishlistItem);

  res.status(200).json({
    success: true,
    message: "Product added to wishlist",
    data: { wishlist },
  });
});

const removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const user = await User.findById(req.userInfo.id);
  if (!user) {
    return next(new AppError("Authenticated user not found", 404));
  }

  const nextWishlist = user.wishlist.filter(
    (entry) => entry.toString() !== productId.toString()
  );

  const wasRemoved = nextWishlist.length !== user.wishlist.length;

  user.wishlist = nextWishlist;
  await user.save({ validateBeforeSave: false });

  if (wasRemoved) {
    const product = await Product.findById(productId);
    if (product) {
      product.wishCount = Math.max((product.wishCount || 0) - 1, 0);
      await product.save({ validateBeforeSave: false });
      UserActivityLog.create({
        userId: req.userInfo?.id || null,
        productId,
        action: "wishlist_remove",
        category: product.category || "",
      }).catch(() => {});
    }
  }

  const updatedUser = await User.findById(req.userInfo.id)
    .populate({
      path: "wishlist",
      populate: {
        path: "images",
        match: { isDeleted: false },
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  const wishlist = (updatedUser.wishlist || []).map(normalizeWishlistItem);

  res.status(200).json({
    success: true,
    message: "Item removed from wishlist",
    data: { wishlist },
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const users = await User.find({ role: 'customer' })
    .select('email firstName lastName isActive createdAt updatedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments({ role: 'customer' });

  res.status(200).json({
    status: "success",
    results: users.length,
    pagination: {
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
      limit,
    },
    data: {
      users,
    },
  });
});

const exportCustomersCsv = catchAsync(async (_req, res) => {
  const customers = await User.find({ role: { $in: ["customer", "user"] } })
    .select("email name createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const customerIds = customers.map((customer) => customer._id);
  const orderStats = customerIds.length
    ? await Order.aggregate([
        { $match: { user: { $in: customerIds } } },
        {
          $group: {
            _id: "$user",
            orderCount: { $sum: 1 },
            totalSpend: { $sum: "$totalAmount" },
          },
        },
      ])
    : [];

  const statsMap = new Map(orderStats.map((entry) => [String(entry._id), entry]));
  const rows = [
    ["email", "name", "orderCount", "totalSpend", "createdAt"].map(escapeCsvValue).join(","),
    ...customers.map((customer) => {
      const stats = statsMap.get(String(customer._id)) || {};
      return [
        customer.email || "",
        customer.name || "",
        stats.orderCount || 0,
        stats.totalSpend || 0,
        customer.createdAt ? new Date(customer.createdAt).toISOString() : "",
      ].map(escapeCsvValue).join(",");
    }),
  ];

  const csv = rows.join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="customers-export.csv"');
  res.status(200).send(csv);
});

// Self-service profile read. Returns the fields a customer can see/edit on
// their account page. Kept narrow on purpose — auth fields, role, and
// permissions never leak through here.
const getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userInfo._id || req.userInfo.id).select(
    "email name phoneNumber profilePicture provider isVerified membership createdAt"
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      email: user.email,
      name: user.name || "",
      phoneNumber: user.phoneNumber || "",
      profilePicture: user.profilePicture || null,
      provider: user.provider,
      isVerified: user.isVerified,
      membership: user.membership || "standard",
      requiresPhone: !user.phoneNumber, // Surfaces banner on shopping pages.
    },
  });
});

// Self-service profile update. Customers can edit only their own name and
// phone number through this endpoint. Phone is validated + normalized to
// canonical "+947XXXXXXXX" form before persist.
const updateMyProfile = catchAsync(async (req, res, next) => {
  const { name, phoneNumber } = req.body || {};

  const update = {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length > 120) {
      return next(new AppError("Name cannot exceed 120 characters", 400));
    }
    update.name = trimmed || null;
  }

  if (phoneNumber !== undefined) {
    if (phoneNumber === null || String(phoneNumber).trim() === "") {
      // Allow clearing the phone (rare, but valid).
      update.phoneNumber = null;
    } else {
      if (!isValidSriLankanMobile(phoneNumber)) {
        return next(
          new AppError(
            "Phone number must be a valid Sri Lankan mobile (e.g. 077 123 4567).",
            400
          )
        );
      }
      const normalized = normalizeSriLankanMobile(phoneNumber);

      // Reject if another user already owns this number — prevents two
      // accounts diverting WhatsApp OTPs to the same phone.
      const owner = await User.findOne({
        phoneNumber: normalized,
        _id: { $ne: req.userInfo._id || req.userInfo.id },
      }).select("_id");
      if (owner) {
        return next(
          new AppError(
            "This phone number is already linked to another account.",
            400
          )
        );
      }
      update.phoneNumber = normalized;
    }
  }

  if (Object.keys(update).length === 0) {
    return next(new AppError("No changes supplied", 400));
  }

  const updated = await User.findByIdAndUpdate(
    req.userInfo._id || req.userInfo.id,
    { $set: update },
    { new: true, runValidators: true }
  ).select("email name phoneNumber profilePicture provider isVerified membership");

  if (!updated) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      _id: updated._id,
      email: updated.email,
      name: updated.name || "",
      phoneNumber: updated.phoneNumber || "",
      profilePicture: updated.profilePicture || null,
      provider: updated.provider,
      isVerified: updated.isVerified,
      membership: updated.membership || "standard",
      requiresPhone: !updated.phoneNumber,
    },
  });
});

// ── Saved addresses (self-service) ─────────────────────────────────
const addressesMatch = (a, b) =>
  String(a?.street || "").trim().toLowerCase() ===
    String(b?.street || "").trim().toLowerCase() &&
  String(a?.postalCode || "").trim().toLowerCase() ===
    String(b?.postalCode || "").trim().toLowerCase();

const getMyAddresses = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.userInfo._id || req.userInfo.id).select("addresses");
  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    success: true,
    data: { addresses: user.addresses || [] },
  });
});

const addMyAddress = catchAsync(async (req, res, next) => {
  const { label, street, city, postalCode, country, isDefault } = req.body || {};

  if (!street || !city || !postalCode) {
    return next(new AppError("street, city and postalCode are required", 400));
  }

  const user = await User.findById(req.userInfo._id || req.userInfo.id);
  if (!user) return next(new AppError("User not found", 404));

  const incoming = {
    label: label ? String(label).trim() : undefined,
    street: String(street).trim(),
    city: String(city).trim(),
    postalCode: String(postalCode).trim(),
    country: String(country || "Sri Lanka").trim(),
    isDefault: Boolean(isDefault) || user.addresses.length === 0,
  };

  if (user.addresses.some((a) => addressesMatch(a, incoming))) {
    return res.status(200).json({
      success: true,
      message: "Address already saved",
      data: { addresses: user.addresses },
    });
  }

  if (incoming.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  user.addresses.push(incoming);
  await user.save({ validateModifiedOnly: true });

  res.status(201).json({
    success: true,
    message: "Address saved",
    data: { addresses: user.addresses },
  });
});

const removeMyAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;

  const user = await User.findById(req.userInfo._id || req.userInfo.id);
  if (!user) return next(new AppError("User not found", 404));

  const before = user.addresses.length;
  user.addresses = user.addresses.filter((a) => String(a._id) !== String(addressId));
  if (user.addresses.length === before) {
    return next(new AppError("Address not found", 404));
  }
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Address removed",
    data: { addresses: user.addresses },
  });
});

// ── My pending manual payments (Fix #1) ───────────────────────────
const PENDING_MANUAL_PAYMENT_STATUSES = [
  "pending_payment",
  "proof_submitted",
  "pending_bank_confirmation",
];

const getMyManualPayments = catchAsync(async (req, res) => {
  const userId = req.userInfo._id || req.userInfo.id;

  const payments = await ManualPayment.find({
    userId,
    status: { $in: PENDING_MANUAL_PAYMENT_STATUSES },
  })
    .populate({
      path: "orderId",
      select: "_id totalAmount items createdAt status",
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      payments: payments.map((p) => ({
        _id: p._id,
        slug: p.slug,
        referenceNumber: p.referenceNumber,
        amount: p.amount,
        status: p.status,
        expiresAt: p.expiresAt,
        createdAt: p.createdAt,
        order: p.orderId
          ? {
              _id: p.orderId._id,
              totalAmount: p.orderId.totalAmount,
              itemCount: Array.isArray(p.orderId.items) ? p.orderId.items.length : 0,
              createdAt: p.orderId.createdAt,
              status: p.orderId.status,
            }
          : null,
      })),
    },
  });
});

module.exports = {
  getAdminUsers,
  getAdminUserDetail,
  updateAdminUserStatus,
  bulkTagUsers,
  triggerAdminPasswordReset,
  deleteAdminUser,
  getAllUsers,
  exportCustomersCsv,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getMyProfile,
  updateMyProfile,
  getMyAddresses,
  addMyAddress,
  removeMyAddress,
  getMyManualPayments,
};
