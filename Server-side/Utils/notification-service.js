const Notification = require("../Models/Notification");
const User = require("../Models/User");

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

  return Notification.create({
    user: userId,
    type,
    title,
    message,
    entityRef,
    entityType,
    isRead: false,
    meta,
  });
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

  return Notification.insertMany(docs);
};

module.exports = {
  createNotification,
  broadcastNotification,
};
