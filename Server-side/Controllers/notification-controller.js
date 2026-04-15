const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Notification = require("../Models/Notification");
const User = require("../Models/User");
const Product = require("../Models/Product");
const Drop = require("../Models/Drop");
const {
  createNotification,
  broadcastNotification,
} = require("../Utils/notification-service");

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

const markNotificationRead = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;

  if (!notificationId) {
    return next(new AppError("Notification id is required", 400));
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    user: req.userInfo._id,
  });

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  notification.isRead = true;
  await notification.save({ validateModifiedOnly: true });

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

  await broadcastNotification({
    type: "admin",
    title,
    message,
    entityType: "AdminMessage",
    meta: { createdBy: req.userInfo._id },
    filter: { isActive: true },
  });

  res.status(201).json({
    success: true,
    message: "Admin message sent to all active users",
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

module.exports = {
  getNotifications,
  markNotificationRead,
  sendAdminMessage,
};
