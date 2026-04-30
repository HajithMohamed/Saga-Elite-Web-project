const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Order = require("../Models/Order");
const ManualPayment = require("../Models/ManualPayment");
const User = require("../Models/User");
const { generateUniqueReference } = require("../Utils/referenceGenerator");
const { createNotification, broadcastNotification } = require("../Utils/notification-service");
const { SOCKET_EVENTS, emitToAll, emitToUser } = require("../Utils/socket-service");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const { cleanPhoneNumber, parsePhoneList, sendWhatsAppMessage } = require("../Utils/whatsapp-service");

const ACTIVE_STATUSES = ["pending_payment", "proof_submitted"];
const ADMIN_ROLES = ["admin", "super_admin", "superadmin"];

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getBankDetails = () => ({
  bankName: process.env.MANUAL_PAYMENT_BANK_NAME || process.env.BANK_NAME || "",
  accountName:
    process.env.MANUAL_PAYMENT_ACCOUNT_NAME || process.env.BANK_ACCOUNT_NAME || "",
  accountNumber:
    process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER || process.env.BANK_ACCOUNT_NUMBER || "",
  branch: process.env.MANUAL_PAYMENT_BANK_BRANCH || process.env.BANK_BRANCH || "",
  swiftCode: process.env.MANUAL_PAYMENT_SWIFT_CODE || process.env.BANK_SWIFT_CODE || "",
  transferNote:
    process.env.MANUAL_PAYMENT_TRANSFER_NOTE ||
    "Use the reference number exactly as shown when making your transfer.",
  supportEmail:
    process.env.MANUAL_PAYMENT_SUPPORT_EMAIL || process.env.BANK_SUPPORT_EMAIL || process.env.EMAIL || "",
  supportWhatsapp:
    process.env.MANUAL_PAYMENT_SUPPORT_WHATSAPP || process.env.BANK_SUPPORT_WHATSAPP || "",
  currency: process.env.MANUAL_PAYMENT_CURRENCY || "LKR",
});

const getAdminEmails = async () => {
  const configuredRecipients = String(process.env.MANUAL_PAYMENT_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (configuredRecipients.length) {
    return configuredRecipients;
  }

  const admins = await User.find({
    role: { $in: ADMIN_ROLES },
    isActive: true,
  })
    .select("email")
    .lean();

  return admins.map((admin) => admin.email).filter(Boolean);
};

const getAdminWhatsAppRecipients = () =>
  parsePhoneList(
    process.env.MANUAL_PAYMENT_ADMIN_WHATSAPP_NUMBERS ||
      process.env.MANUAL_PAYMENT_ADMIN_WHATSAPP_NUMBER ||
      "",
  );

const sendAdminEmailAlert = async (subject, html) => {
  const recipients = await getAdminEmails();

  if (!recipients.length) {
    return;
  }

  await sendEmail({
    email: recipients.join(","),
    subject,
    html,
  });
};

const sendAdminWhatsAppAlert = async (message) => {
  const recipients = getAdminWhatsAppRecipients();

  for (const recipient of recipients) {
    try {
      await sendWhatsAppMessage({ to: recipient, message });
    } catch (error) {
      console.error("Failed to send admin WhatsApp alert:", error);
    }
  }
};

const buildProofEmail = (order, payment) =>
  buildEmailTemplate(
    "New payment proof submitted",
    `<p>A customer submitted bank transfer proof for order <strong>${order._id}</strong>.</p>
     <p><strong>Reference:</strong> ${payment.referenceNumber}</p>
     <p><strong>Amount:</strong> ${payment.currency} ${formatCurrency(payment.amount)}</p>
     <p>Open the admin payment verification queue to review the receipt image and confirm the payment.</p>`
  );

const buildDecisionEmail = (title, order, payment, reason) =>
  buildEmailTemplate(
    title,
    `<p>Your bank transfer reference <strong>${payment.referenceNumber}</strong> for order <strong>${order._id}</strong> has been reviewed.</p>
     ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
     <p>Please check your Saga Elite account for the latest payment status.</p>`
  );

const syncOrderWithPayment = async (order, payment, { status, paymentStatus, clearExpiry = false }) => {
  order.paymentMethod = "manual_bank_transfer";
  order.referenceNumber = payment.referenceNumber;
  order.paymentProofUrl = payment.proofUrl || order.paymentProofUrl || null;
  order.status = status;
  order.paymentStatus = paymentStatus;

  if (clearExpiry) {
    order.expiresAt = undefined;
  }

  await order.save({ validateModifiedOnly: true });
};

const buildManualPaymentSummary = (payment) => ({
  _id: payment._id,
  referenceNumber: payment.referenceNumber,
  orderId: payment.orderId,
  userId: payment.userId,
  amount: payment.amount,
  currency: payment.currency,
  proofUrl: payment.proofUrl,
  proofSubmittedAt: payment.proofSubmittedAt,
  status: payment.status,
  generatedAt: payment.generatedAt,
  expiresAt: payment.expiresAt,
  expiredAt: payment.expiredAt,
  verifiedAt: payment.verifiedAt,
  verifiedBy: payment.verifiedBy,
  rejectionReason: payment.rejectionReason,
  adminNotes: payment.adminNotes,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const generateReference = catchAsync(async (req, res, next) => {
  const { orderId, amount } = req.body;

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new AppError("A valid orderId is required", 400));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (!order.user || String(order.user) !== String(req.userInfo._id)) {
    return next(new AppError("You are not authorized to access this order", 403));
  }

  if (!["manual_bank_transfer", "manual"].includes(order.paymentMethod)) {
    return next(new AppError("This order is not configured for bank transfer", 400));
  }

  if (["confirmed", "shipped", "delivered", "cancelled"].includes(order.status)) {
    return next(new AppError("This order can no longer generate a payment reference", 400));
  }

  const providedAmount = amount !== undefined && amount !== null ? Number(amount) : null;
  if (amount !== undefined && amount !== null && !Number.isFinite(providedAmount)) {
    return next(new AppError("Amount must be a valid number", 400));
  }

  if (providedAmount !== null && Number.isFinite(providedAmount) && providedAmount !== Number(order.totalAmount)) {
    return next(new AppError("Amount does not match the order total", 400));
  }

  let activePayment = await ManualPayment.findOne({
    orderId: order._id,
    status: { $in: ACTIVE_STATUSES },
  }).sort({ createdAt: -1 });

  const now = new Date();

  if (activePayment && activePayment.expiresAt && activePayment.expiresAt <= now) {
    activePayment.status = "expired";
    activePayment.expiredAt = activePayment.expiredAt || now;
    await activePayment.save({ validateModifiedOnly: true });
    activePayment = null;
  }

  if (activePayment) {
    const bankDetails = getBankDetails();

    await syncOrderWithPayment(order, activePayment, {
      status: "pending_payment",
      paymentStatus: "pending",
      clearExpiry: true,
    });

    return res.status(200).json({
      success: true,
      message: "Active payment reference already exists for this order",
      data: {
        manualPayment: buildManualPaymentSummary(activePayment),
        referenceNumber: activePayment.referenceNumber,
        amount: activePayment.amount,
        expiresAt: activePayment.expiresAt,
        bankDetails,
        orderId: order._id,
      },
    });
  }

  const referenceNumber = await generateUniqueReference(order._id, ManualPayment);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const bankDetails = getBankDetails();

  const manualPayment = await ManualPayment.create({
    referenceNumber,
    orderId: order._id,
    userId: req.userInfo._id,
    amount: Number(order.totalAmount),
    currency: bankDetails.currency,
    status: "pending_payment",
    expiresAt,
  });

  await syncOrderWithPayment(order, manualPayment, {
    status: "pending_payment",
    paymentStatus: "pending",
    clearExpiry: true,
  });

  return res.status(201).json({
    success: true,
    message: "Manual payment reference generated successfully",
    data: {
      manualPayment: buildManualPaymentSummary(manualPayment),
      referenceNumber,
      amount: manualPayment.amount,
      expiresAt: manualPayment.expiresAt,
      bankDetails,
      orderId: order._id,
    },
  });
});

const submitProof = catchAsync(async (req, res, next) => {
  const { referenceNumber, proofUrl } = req.body;

  if (!referenceNumber || !String(referenceNumber).trim()) {
    return next(new AppError("Reference number is required", 400));
  }

  if (!proofUrl || !String(proofUrl).trim()) {
    return next(new AppError("Proof URL is required", 400));
  }

  const payment = await ManualPayment.findOne({ referenceNumber: String(referenceNumber).trim() })
    .populate({
      path: "orderId",
      populate: {
        path: "user",
        select: "email role profilePicture",
      },
    })
    .populate("userId", "email role profilePicture");

  if (!payment) {
    return next(new AppError("Payment reference not found", 404));
  }

  if (String(payment.userId?._id || payment.userId) !== String(req.userInfo._id)) {
    return next(new AppError("You are not authorized to submit proof for this payment", 403));
  }

  const now = new Date();
  if (payment.expiresAt && payment.expiresAt <= now && payment.status !== "verified") {
    payment.status = "expired";
    payment.expiredAt = payment.expiredAt || now;
    await payment.save({ validateModifiedOnly: true });
    return next(new AppError("This payment reference has expired. Please generate a new one.", 400));
  }

  if (!["pending_payment", "proof_submitted", "rejected"].includes(payment.status)) {
    return next(new AppError("This payment cannot accept proof submission", 400));
  }

  const proofUrlValue = String(proofUrl).trim();
  payment.proofUrl = proofUrlValue;
  payment.proofSubmittedAt = now;
  payment.status = "proof_submitted";
  payment.rejectionReason = null;
  payment.adminNotes = null;

  await payment.save({ validateModifiedOnly: true });

  const order = payment.orderId;
  if (order) {
    await syncOrderWithPayment(order, payment, {
      status: "verification_pending",
      paymentStatus: "pending",
      clearExpiry: true,
    });
  }

  const orderId = order?._id || payment.orderId?._id;
  const customerEmail = order?.user?.email || payment.userId?.email || null;

  await broadcastNotification({
    type: "admin",
    title: "New payment proof submitted",
    message: `Payment proof was submitted for order ${orderId} with reference ${payment.referenceNumber}.`,
    entityRef: orderId,
    entityType: "ManualPayment",
    meta: {
      orderId,
      referenceNumber: payment.referenceNumber,
      paymentId: payment._id,
      status: payment.status,
    },
    filter: { role: { $in: ADMIN_ROLES } },
  });

  await createNotification({
    userId: payment.userId?._id || payment.userId,
    type: "order",
    title: "Payment proof submitted",
    message: `We received proof for reference ${payment.referenceNumber}. Your payment is now pending verification.`,
    entityRef: orderId,
    entityType: "ManualPayment",
    meta: {
      orderId,
      referenceNumber: payment.referenceNumber,
      paymentId: payment._id,
      status: payment.status,
    },
  });

  emitToUser(payment.userId?._id || payment.userId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: payment.userId?._id || payment.userId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "payment-proof-submitted",
  });

  emitToAll(SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: payment.userId?._id || payment.userId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "payment-proof-submitted",
  });

  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: "payment-proof-submitted",
    paymentId: payment._id,
    orderId,
    userId: payment.userId?._id || payment.userId,
  });

  const proofEmail = buildEmailTemplate(
    "Payment proof submitted",
    `<p>We received your proof for reference <strong>${payment.referenceNumber}</strong>.</p>
     <p>Your payment is now pending verification by the Saga Elite team.</p>`
  );

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: "We received your payment proof",
        html: proofEmail,
      });
    } catch (emailError) {
      console.error("Failed to send proof submission email to customer:", emailError);
    }
  }

  const adminEmailBody = buildProofEmail(order, payment);
  try {
    await sendAdminEmailAlert("New payment proof submitted", adminEmailBody);
  } catch (emailError) {
    console.error("Failed to send admin payment proof email:", emailError);
  }

  await sendAdminWhatsAppAlert(
    `Saga Elite: new payment proof submitted for order ${orderId}. Reference ${payment.referenceNumber}.`
  );

  return res.status(200).json({
    success: true,
    message: "Payment proof submitted successfully",
    data: {
      ...buildManualPaymentSummary(payment),
      bankDetails: getBankDetails(),
    },
  });
});

const getMyPaymentStatus = catchAsync(async (req, res, next) => {
  const { referenceNumber } = req.params;

  const payment = await ManualPayment.findOne({ referenceNumber })
    .populate({
      path: "orderId",
      populate: {
        path: "user",
        select: "email role profilePicture",
      },
    })
    .populate("userId", "email role profilePicture");

  if (!payment) {
    return next(new AppError("Payment reference not found", 404));
  }

  if (String(payment.userId?._id || payment.userId) !== String(req.userInfo._id)) {
    return next(new AppError("You are not authorized to view this payment", 403));
  }

  return res.status(200).json({
    success: true,
    message: "Payment status fetched successfully",
    data: {
      ...buildManualPaymentSummary(payment),
      bankDetails: getBankDetails(),
    },
  });
});

const getPendingPayments = catchAsync(async (req, res, next) => {
  const status = String(req.query.status || "proof_submitted").trim();
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.max(1, Number.parseInt(req.query.limit || "20", 10) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const [totalCount, payments] = await Promise.all([
    ManualPayment.countDocuments(filter),
    ManualPayment.find(filter)
      .populate({
        path: "orderId",
        populate: {
          path: "user",
          select: "email role profilePicture",
        },
      })
      .populate("userId", "email role profilePicture")
      .sort({ proofSubmittedAt: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    message: "Manual payment queue fetched successfully",
    data: {
      payments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
      },
    },
  });
});

const getPaymentById = catchAsync(async (req, res, next) => {
  const payment = await ManualPayment.findById(req.params.id)
    .populate({
      path: "orderId",
      populate: {
        path: "user",
        select: "email role profilePicture",
      },
    })
    .populate("userId", "email role profilePicture");

  if (!payment) {
    return next(new AppError("Manual payment not found", 404));
  }

  return res.status(200).json({
    success: true,
    message: "Manual payment fetched successfully",
    data: {
      ...buildManualPaymentSummary(payment),
      bankDetails: getBankDetails(),
    },
  });
});

const verifyPayment = catchAsync(async (req, res, next) => {
  const { action, rejectionReason, adminNotes } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return next(new AppError("Action must be either approve or reject", 400));
  }

  const payment = await ManualPayment.findById(req.params.id)
    .populate({
      path: "orderId",
      populate: {
        path: "user",
        select: "email role profilePicture",
      },
    })
    .populate("userId", "email role profilePicture");

  if (!payment) {
    return next(new AppError("Manual payment not found", 404));
  }

  const order = payment.orderId;

  if (!order) {
    return next(new AppError("Linked order not found", 404));
  }

  if (payment.status === "expired") {
    return next(new AppError("This payment reference has already expired", 400));
  }

  const customerUserId = order.user?._id || order.user || payment.userId?._id || payment.userId;
  const customerEmail = order.user?.email || payment.userId?.email || null;
  const customerPhone = cleanPhoneNumber(order.contactNumber);
  const orderId = order._id;

  if (action === "approve") {
    payment.status = "verified";
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.userInfo._id;
    payment.rejectionReason = null;
    payment.adminNotes = adminNotes?.trim() || null;

    await syncOrderWithPayment(order, payment, {
      status: "confirmed",
      paymentStatus: "paid",
      clearExpiry: true,
    });

    await payment.save({ validateModifiedOnly: true });

    if (customerUserId) {
      await createNotification({
        userId: customerUserId,
        type: "order",
        title: "Payment verified",
        message: `Your payment for order ${orderId} has been verified successfully.`,
        entityRef: orderId,
        entityType: "Order",
        meta: {
          orderId,
          referenceNumber: payment.referenceNumber,
          paymentId: payment._id,
          status: "verified",
        },
      });
    }

    if (customerEmail) {
      try {
        await sendEmail({
          email: customerEmail,
          subject: "Your Saga Elite payment has been verified",
          html: buildDecisionEmail("Payment verified", order, payment),
        });
      } catch (emailError) {
        console.error("Failed to send verification email to customer:", emailError);
      }
    }

    if (customerPhone) {
      try {
        await sendWhatsAppMessage({
          to: customerPhone,
          message: `Saga Elite: your payment for order ${orderId} has been verified successfully. Thank you for your purchase.`,
        });
      } catch (whatsAppError) {
        console.error("Failed to send payment verification WhatsApp message:", whatsAppError);
      }
    }

    emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
      userId: customerUserId,
      paymentId: payment._id,
      orderId,
      referenceNumber: payment.referenceNumber,
      status: payment.status,
      source: "payment-verified",
    });

    emitToAll(SOCKET_EVENTS.PAYMENT_REFRESH, {
      userId: customerUserId,
      paymentId: payment._id,
      orderId,
      referenceNumber: payment.referenceNumber,
      status: payment.status,
      source: "payment-verified",
    });

    emitToAll(SOCKET_EVENTS.ORDER_REFRESH, {
      userId: customerUserId,
      orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      source: "payment-verified",
    });

    emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
      source: "payment-verified",
      paymentId: payment._id,
      orderId,
      userId: customerUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        ...buildManualPaymentSummary(payment),
        bankDetails: getBankDetails(),
      },
    });
  }

  payment.status = "rejected";
  payment.rejectionReason = rejectionReason?.trim() || "Payment proof rejected";
  payment.adminNotes = adminNotes?.trim() || payment.rejectionReason;
  await payment.save({ validateModifiedOnly: true });

  await syncOrderWithPayment(order, payment, {
    status: "verification_pending",
    paymentStatus: "failed",
    clearExpiry: true,
  });

  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: "order",
      title: "Payment proof rejected",
      message: `Your proof for order ${orderId} was rejected. ${payment.rejectionReason}`,
      entityRef: orderId,
      entityType: "Order",
      meta: {
        orderId,
        referenceNumber: payment.referenceNumber,
        paymentId: payment._id,
        status: "rejected",
        rejectionReason: payment.rejectionReason,
      },
    });
  }

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: "Your Saga Elite payment proof was rejected",
        html: buildDecisionEmail("Payment proof rejected", order, payment, payment.rejectionReason),
      });
    } catch (emailError) {
      console.error("Failed to send rejection email to customer:", emailError);
    }
  }

  if (customerPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        message: `Saga Elite: your payment proof for order ${orderId} was rejected. ${payment.rejectionReason} Please submit an updated receipt within 24 hours to avoid cancellation.`,
      });
    } catch (whatsAppError) {
      console.error("Failed to send payment rejection WhatsApp message:", whatsAppError);
    }
  }

  emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "payment-rejected",
  });

  emitToAll(SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "payment-rejected",
  });

  emitToAll(SOCKET_EVENTS.ORDER_REFRESH, {
    userId: customerUserId,
    orderId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    source: "payment-rejected",
  });

  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: "payment-rejected",
    paymentId: payment._id,
    orderId,
    userId: customerUserId,
  });

  return res.status(200).json({
    success: true,
    message: "Payment rejected successfully",
    data: {
      ...buildManualPaymentSummary(payment),
      bankDetails: getBankDetails(),
    },
  });
});

module.exports = {
  generateReference,
  submitProof,
  getMyPaymentStatus,
  getPendingPayments,
  getPaymentById,
  verifyPayment,
};