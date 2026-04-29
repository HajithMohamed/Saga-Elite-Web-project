const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const User = require("../Models/User");
const Order = require("../Models/Order");
const Notification = require("../Models/Notification");

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
      image: product.images?.[0]?.url || null,
    },
    variant: {
      id: variant._id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
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

const buildAdminUserSummary = (user, orderStats = {}, notificationStats = {}) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  provider: user.provider,
  profilePicture: user.profilePicture || null,
  isVerified: user.isVerified,
  isActive: user.isActive,
  savedPaymentMethod: user.savedPaymentMethod || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  relationship: {
    cartCount: user.cart?.length || 0,
    wishlistCount: user.wishlist?.length || 0,
    addressesCount: user.addresses?.length || 0,
    orderCount: orderStats.orderCount || 0,
    deliveredOrders: orderStats.deliveredOrders || 0,
    pendingOrders: orderStats.pendingOrders || 0,
    totalSpent: orderStats.totalSpent || 0,
    lastOrderAt: orderStats.lastOrderAt || null,
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
    };
  }

  const [orderStats, notificationStats] = await Promise.all([
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
  ]);

  return {
    orderStatsMap: new Map(
      orderStats.map((entry) => [entry._id.toString(), entry])
    ),
    notificationStatsMap: new Map(
      notificationStats.map((entry) => [entry._id.toString(), entry])
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

const getAdminUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
    .select(
      "email role provider profilePicture isVerified isActive savedPaymentMethod cart wishlist addresses createdAt updatedAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((user) => user._id);
  const { orderStatsMap, notificationStatsMap } = await getUserInsightMaps(userIds);

  const mappedUsers = users.map((user) =>
    buildAdminUserSummary(
      user,
      orderStatsMap.get(user._id.toString()),
      notificationStatsMap.get(user._id.toString())
    )
  );

  const stats = mappedUsers.reduce(
    (accumulator, user) => {
      accumulator.totalUsers += 1;
      accumulator.activeUsers += user.isActive ? 1 : 0;
      accumulator.inactiveUsers += user.isActive ? 0 : 1;
      accumulator.verifiedUsers += user.isVerified ? 1 : 0;
      accumulator.googleUsers += user.provider === "google" ? 1 : 0;
      accumulator.localUsers += user.provider === "local" ? 1 : 0;
      accumulator.adminUsers += user.role === "user" ? 0 : 1;
      accumulator.totalOrders += user.relationship.orderCount;
      accumulator.totalRevenue += user.relationship.totalSpent;
      return accumulator;
    },
    {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      verifiedUsers: 0,
      googleUsers: 0,
      localUsers: 0,
      adminUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
    }
  );

  res.status(200).json({
    success: true,
    message: "Admin users fetched successfully",
    data: {
      stats,
      users: mappedUsers,
    },
  });
});

const getAdminUserDetail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select(
      "email role provider profilePicture isVerified isActive savedPaymentMethod cart wishlist addresses createdAt updatedAt"
    )
    .lean();

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const { orderStatsMap, notificationStatsMap } = await getUserInsightMaps([user._id]);

  const [recentOrders, recentNotifications] = await Promise.all([
    Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("items totalAmount status paymentStatus paymentMethod createdAt")
      .lean(),
    Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("type title message isRead entityType createdAt")
      .lean(),
  ]);

  const summary = buildAdminUserSummary(
    user,
    orderStatsMap.get(user._id.toString()),
    notificationStatsMap.get(user._id.toString())
  );

  res.status(200).json({
    success: true,
    message: "Admin user detail fetched successfully",
    data: {
      ...summary,
      addresses: user.addresses || [],
      recentOrders,
      recentNotifications,
      activityTimeline: buildActivityTimeline({
        user,
        recentOrders,
        recentNotifications,
      }),
    },
  });
});

const updateAdminUserStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return next(new AppError("isActive must be provided as true or false", 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user._id.toString() === req.userInfo._id.toString()) {
    return next(new AppError("You cannot change your own account status here", 400));
  }

  if (user.role !== "user") {
    return next(new AppError("Only customer accounts can be updated from user management", 403));
  }

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });

  const { orderStatsMap, notificationStatsMap } = await getUserInsightMaps([user._id]);

  res.status(200).json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    data: buildAdminUserSummary(
      user.toObject(),
      orderStatsMap.get(user._id.toString()),
      notificationStatsMap.get(user._id.toString())
    ),
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

  if (user.role !== "user") {
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

  const cart = user.cart
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
  const { quantity } = req.body;

  if (!itemId) {
    return next(new AppError("Cart item ID is required", 400));
  }

  if (quantity == null || isNaN(quantity)) {
    return next(new AppError("Quantity must be provided", 400));
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

  const variant = product.variants.id(cartItem.variant);
  if (!variant) {
    return next(new AppError("Product variant not found", 400));
  }

  if (quantity <= 0) {
    user.cart.pull(itemId);
  } else {
    if (quantity > variant.stock) {
      return next(
        new AppError(
          `Only ${variant.stock} units are available for this variant`,
          400
        )
      );
    }
    cartItem.quantity = quantity;
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

module.exports = {
  getAdminUsers,
  getAdminUserDetail,
  updateAdminUserStatus,
  deleteAdminUser,
  getAllUsers,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
