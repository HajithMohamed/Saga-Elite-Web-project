const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");
const Notification = require("../Models/Notification");
const User = require("../Models/User");
const Product = require("../Models/Product");
const Drop = require("../Models/Drop");
const {
  createNotification,
  broadcastNotification,
} = require("../Utils/notification-service");

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getNotifications = catchAsync(async (req, res, next) => {
  const userId = req.userInfo?._id;

  if (!userId) {
    return next(new AppError("User not authenticated. Please login first", 401));
  }

  try {
    await generateUpcomingRemindersForUser(userId);
  } catch (error) {
    console.error("Failed to generate upcoming reminders:", error);
  }

  const notifications = await Notification.find({ user: userId })
    .sort({ isRead: 1, createdAt: -1 })
    .lean();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: { notifications, unreadCount },
  });
});

const getAdminNotifications = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    type,
    isRead,
    userEmail,
  } = req.query;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {};

  if (type && type !== "all") {
    filter.type = type;
  }

  if (typeof isRead !== "undefined" && isRead !== "") {
    filter.isRead = String(isRead).toLowerCase() === "true";
  }

  if (search) {
    const regex = new RegExp(escapeRegExp(search), "i");
    filter.$or = [
      { title: regex },
      { message: regex },
    ];
  }

  if (userEmail) {
    const userRegex = new RegExp(escapeRegExp(userEmail), "i");
    const users = await User.find({
      $or: [{ email: userRegex }, { name: userRegex }],
    })
      .select("_id")
      .lean();

    if (!users.length) {
      return res.status(200).json({
        success: true,
        message: "Admin notifications fetched successfully",
        data: {
          notifications: [],
          pagination: {
            currentPage,
            limit: pageLimit,
            totalPages: 0,
            totalCount: 0,
          },
        },
      });
    }

    filter.user = users.map((user) => user._id);
  }

  const totalCount = await Notification.countDocuments(filter);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageLimit) : 1;

  const notifications = await Notification.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * pageLimit)
    .limit(pageLimit)
    .lean();

  res.status(200).json({
    success: true,
    message: "Admin notifications fetched successfully",
    data: {
      notifications,
      pagination: {
        currentPage,
        limit: pageLimit,
        totalPages,
        totalCount,
      },
    },
  });
});

const getAdminNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;

  if (!notificationId) {
    return next(new AppError("Notification id is required", 400));
  }

  const notification = await Notification.findById(notificationId)
    .populate("user", "name email role")
    .lean();

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Admin notification fetched successfully",
    data: notification,
  });
});

const updateNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  if (!notificationId) {
    return next(new AppError("Notification id is required", 400));
  }

  const allowedFields = ["title", "message", "isRead", "type", "entityType"];
  const updates = filterObj(req.body, ...allowedFields);

  if (typeof updates.isRead === "string") {
    updates.isRead = updates.isRead.toLowerCase() === "true";
  }

  if (updates.title !== undefined && String(updates.title).trim() === "") {
    return next(new AppError("Notification title cannot be empty", 400));
  }

  if (updates.message !== undefined && String(updates.message).trim() === "") {
    return next(new AppError("Notification message cannot be empty", 400));
  }

  if (Object.keys(updates).length === 0) {
    return next(new AppError("At least one field is required to update", 400));
  }

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  Object.assign(notification, updates);
  await notification.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Notification updated successfully",
    data: notification,
  });
});

const deleteNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;

  if (!notificationId) {
    return next(new AppError("Notification id is required", 400));
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});

const generateUpcomingRemindersForUser = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: "cart.product",
      populate: {
        path: "drop",
        model: "Drop",
      },
    })
    .populate({
      path: "wishlist",
      populate: {
        path: "drop",
        model: "Drop",
      },
    })
    .lean();

  if (!user) return;

  const now = new Date();
  const upcomingCutoff = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const candidateDrops = new Map();

  const addCandidates = (product, label) => {
    if (!product?.drop || !product.drop.releaseDate) return;
    const releaseDate = new Date(product.drop.releaseDate);
    if (releaseDate > now && releaseDate <= upcomingCutoff) {
      candidateDrops.set(product.drop._id.toString(), {
        drop: product.drop,
        labels: new Set([label]),
      });
    }
  };

  (user.cart || []).forEach((item) => addCandidates(item.product, "cart"));
  (user.wishlist || []).forEach((product) => addCandidates(product, "wishlist"));

  for (const candidate of candidateDrops.values()) {
    const { drop, labels } = candidate;
    const existing = await Notification.exists({
      user: userId,
      type: "reminder",
      entityRef: drop._id,
      entityType: "Drop",
    });

    if (existing) continue;

    const relation = Array.from(labels).join(" & ");
    const title = `Upcoming drop reminder`;
    const message = `Your ${relation} item${relation.includes("&") ? "s" : ""} belong to the drop “${drop.name}” releasing on ${new Date(
      drop.releaseDate,
    ).toLocaleDateString()}.`;

    await createNotification({
      userId,
      type: "reminder",
      title,
      message,
      entityRef: drop._id,
      entityType: "Drop",
      meta: { dropSlug: drop.slug },
    });
  }
};

const markNotificationRead = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.userInfo?._id;

  if (!userId) {
    return next(new AppError("User not authenticated", 401));
  }

  const notification = await Notification.findOne({ _id: notificationId, user: userId });

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  if (notification.isRead) {
    return res.status(200).json({
      success: true,
      message: "Notification already read",
    });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

const sendAdminMessage = catchAsync(async (req, res, next) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return next(new AppError("Title and message are required", 400));
  }

  const users = await User.find({ isActive: true }).select("_id").lean();

  for (const user of users) {
    await createNotification({
      userId: user._id,
      type: "admin",
      title,
      message,
    });
  }

  res.status(200).json({
    success: true,
    message: "Admin message sent to active users",
  });
});

const getAllNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find()
    .populate('user', 'email firstName lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalNotifications = await Notification.countDocuments();

  res.status(200).json({
    status: "success",
    results: notifications.length,
    pagination: {
      total: totalNotifications,
      page,
      pages: Math.ceil(totalNotifications / limit),
      limit,
    },
    data: {
      notifications,
    },
  });
});

module.exports = {
  getNotifications,
  markNotificationRead,
  sendAdminMessage,
  getAdminNotifications,
  getAdminNotification,
  updateNotification,
  deleteNotification,
  getAllNotifications,
};
