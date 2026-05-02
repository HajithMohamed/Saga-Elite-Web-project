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
const { sendWhatsAppMessage, cleanPhoneNumber } = require("../Utils/whatsapp-service");
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
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
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