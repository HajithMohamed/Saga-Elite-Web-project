const Notification = require("../Models/Notification");
const User = require("../Models/User");
const SOCKET_EVENTS = require("./socket-events");
const { emitToAll, emitToUser, emitToAdmins } = require("./socket-service");

const createNotification = async ({
  userId,
  type,
  title,
  message,
  entityRef,
  entityType,
  meta = {},
}) => {
  if (!userId || !type || !title || !message) {
    throw new Error("Missing notification parameters");
  }

  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    entityRef,
    entityType,
    isRead: false,
    meta,
  });

  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_REFRESH, {
    scope: "user",
    userId,
    notificationId: notification._id,
    type,
  });

  if (["admin", "super_admin", "superadmin"].includes(String(type).toLowerCase())) {
    emitToAdmins(SOCKET_EVENTS.NOTIFICATION_REFRESH, {
      scope: "admin",
      notificationId: notification._id,
      type,
    });
  }

  emitToAll(SOCKET_EVENTS.NOTIFICATION_REFRESH, {
    scope: "user",
    userId,
    notificationId: notification._id,
    type,
  });

  return notification;
};

const broadcastNotification = async ({
  type,
  title,
  message,
  entityRef,
  entityType,
  meta = {},
  filter = {},
}) => {
  if (!type || !title || !message) {
    throw new Error("Missing broadcast notification parameters");
  }

  const users = await User.find(filter).select("_id").lean();
  if (!users || users.length === 0) {
    return [];
  }

  const docs = users.map((user) => ({
    user: user._id,
    type,
    title,
    message,
    entityRef,
    entityType,
    isRead: false,
    meta,
  }));

  const notifications = await Notification.insertMany(docs);

  emitToAdmins(SOCKET_EVENTS.NOTIFICATION_REFRESH, {
    scope: "admin",
    audience: "broadcast",
    count: notifications.length,
    type,
  });

  emitToAll(SOCKET_EVENTS.NOTIFICATION_REFRESH, {
    scope: "admin",
    audience: "broadcast",
    count: notifications.length,
    type,
  });

  return notifications;
};

module.exports = {
  createNotification,
  broadcastNotification,
};
