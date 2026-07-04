const mongoose = require("mongoose");
const crypto = require("crypto");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Order = require("../Models/Order");
const ManualPayment = require("../Models/ManualPayment");
const User = require("../Models/User");
const Guest = require("../Models/Guest");
const { generateUniqueReference } = require("../Utils/referenceGenerator");
const { ADMIN_ROLES } = require("../Utils/admin-roles");
const { createNotification, broadcastNotification } = require("../Utils/notification-service");
const { SOCKET_EVENTS, emitToAll, emitToUser } = require("../Utils/socket-service");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const { cleanPhoneNumber, parsePhoneList, sendWhatsAppMessage } = require("../Utils/whatsapp-service");
const logger = require("../Utils/logger");
const uploadToCloudinary = require("../Utils/image-upload");
const { processReceipt } = require("../Utils/receipt-ocr");
const {
  PAYHERE_STATUS,
  isPayHereConfigured,
  isPayHereSandbox,
  getMerchantId,
  getCheckoutUrl,
  formatAmount,
  generateCheckoutHash,
  verifyNotifySignature,
} = require("../Utils/payhere-service");

const ACTIVE_STATUSES = ["pending_payment", "proof_submitted"];

const clientShopUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

// Resolve the canonical email tied to a manual payment — registered user
// email if userId is set, otherwise the order's guestEmail, otherwise the
// guest record. Used both for guest-auth checks and for resending payment
// links.
const resolvePaymentEmail = async (payment) => {
  if (!payment) return "";

  if (payment.userId) {
    const userId =
      payment.userId?._id || payment.userId?.id || payment.userId;
    if (payment.userId?.email) return normalizeEmail(payment.userId.email);
    if (userId) {
      const user = await User.findById(userId).select("email").lean();
      if (user?.email) return normalizeEmail(user.email);
    }
  }

  const order = payment.orderId && typeof payment.orderId === "object"
    ? payment.orderId
    : null;

  if (order?.guestEmail) return normalizeEmail(order.guestEmail);
  if (order?.user?.email) return normalizeEmail(order.user.email);

  if (payment.guestId) {
    const guestId =
      payment.guestId?._id || payment.guestId?.id || payment.guestId;
    if (payment.guestId?.email) return normalizeEmail(payment.guestId.email);
    if (guestId) {
      const guest = await Guest.findById(guestId).select("email").lean();
      if (guest?.email) return normalizeEmail(guest.email);
    }
  }

  if (!order && payment.orderId) {
    const fallbackOrder = await Order.findById(payment.orderId)
      .select("guestEmail user")
      .populate("user", "email")
      .lean();
    if (fallbackOrder?.guestEmail) return normalizeEmail(fallbackOrder.guestEmail);
    if (fallbackOrder?.user?.email) return normalizeEmail(fallbackOrder.user.email);
  }

  return "";
};

const populatePaymentForAccess = (query) =>
  query
    .populate({
      path: "orderId",
      populate: {
        path: "user",
        select: "email role profilePicture",
      },
    })
    .populate("userId", "email role profilePicture");

// Match by reference number or URL slug — same lookup used for status reads
// and receipt submission so payment-page slugs work end-to-end.
const findPaymentByIdentifier = async (identifier) => {
  const trimmed = String(identifier || "").trim();
  if (!trimmed) return null;

  return populatePaymentForAccess(
    ManualPayment.findOne({
      $or: [
        { referenceNumber: trimmed.toUpperCase() },
        { slug: trimmed.toLowerCase() },
      ],
    })
  );
};

// Authorize access to a manual payment for either an authenticated user
// (via userId match) OR an unauthenticated visitor presenting the email
// used at checkout. Throws AppError on mismatch.
const authorizePaymentAccess = async (payment, req, providedEmail) => {
  const userId = req.userInfo?._id ? String(req.userInfo._id) : null;

  if (userId) {
    const paymentUserId = payment.userId?._id || payment.userId;
    if (paymentUserId && String(paymentUserId) === userId) {
      return { matchedBy: "user" };
    }
  }

  const candidateEmail = normalizeEmail(
    providedEmail ||
      req.body?.email ||
      req.query?.email ||
      req.headers?.["x-payment-email"] ||
      ""
  );

  if (!candidateEmail) {
    throw new AppError(
      "Please provide the email address used when placing this order to view or update payment.",
      401
    );
  }

  const expectedEmail = await resolvePaymentEmail(payment);

  if (expectedEmail && expectedEmail === candidateEmail) {
    return { matchedBy: "email" };
  }

  throw new AppError(
    "The email you entered does not match the order on this payment reference.",
    403
  );
};

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getBankDetails = () => ({
  bankName: process.env.MANUAL_PAYMENT_BANK_NAME || "Sampath Bank",
  accountName: process.env.MANUAL_PAYMENT_ACCOUNT_NAME || "N.Gayathree",
  accountNumber: process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER || "108052612262",
  branch: process.env.MANUAL_PAYMENT_BANK_BRANCH || "Hatton",
  swiftCode: process.env.MANUAL_PAYMENT_SWIFT_CODE || "BSAMLKLX",
  currency: process.env.MANUAL_PAYMENT_CURRENCY || "LKR",
  transferNote: process.env.MANUAL_PAYMENT_TRANSFER_NOTE ||
    "Include your reference number exactly as shown in the transfer note/remarks field.",
  supportEmail: process.env.MANUAL_PAYMENT_SUPPORT_EMAIL || "sagaaelite@gmail.com",
  supportWhatsapp: process.env.MANUAL_PAYMENT_SUPPORT_WHATSAPP || "+94 77 070 4274",
  // Optional: a real LANKAQR PNG URL (uploaded by merchant from internet
  // banking). When set, the customer payment page renders this image
  // instead of the text-fallback QR generated client-side.
  qrImageUrl: process.env.MANUAL_PAYMENT_QR_IMAGE_URL || null,
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
      logger.error("Failed to send admin WhatsApp alert", { error, recipient });
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
  // Preserve the order's existing paymentMethod when the payment is a card
  // record — only manual bank transfer flows should rewrite it. Without this
  // guard, admin-verifying a card payment would flip the order's method to
  // "manual_bank_transfer" and break later reporting / refund logic.
  if (payment.paymentType !== "card") {
    order.paymentMethod = "manual_bank_transfer";
  }
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
  slug: payment.slug,
  referenceNumber: payment.referenceNumber,
  orderId: payment.orderId,
  userId: payment.userId,
  amount: payment.amount,
  currency: payment.currency,
  paymentType: payment.paymentType || "manual_bank_transfer",
  cardDetails: payment.cardDetails || null,
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
  ocr: payment.ocr || null,
  extensionGranted: payment.extensionGranted,
  extensionRequestedAt: payment.extensionRequestedAt,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const buildManualPaymentResponse = (manualPayment, bankDetails) => ({
  slug: manualPayment.slug,
  referenceNumber: manualPayment.referenceNumber,
  amount: manualPayment.amount,
  orderId: manualPayment.orderId,
  expiresAt: manualPayment.expiresAt,
  bankDetails,
  manualPayment: buildManualPaymentSummary(manualPayment),
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
      referenceNumber: activePayment.referenceNumber,
      amount: activePayment.amount,
      orderId: order._id,
      data: buildManualPaymentResponse(activePayment, bankDetails),
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
    referenceNumber,
    amount: manualPayment.amount,
    orderId: order._id,
    data: buildManualPaymentResponse(manualPayment, bankDetails),
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

  const payment = await findPaymentByIdentifier(referenceNumber);

  if (!payment) {
    return next(new AppError("Payment reference not found", 404));
  }

  await authorizePaymentAccess(payment, req);

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
      logger.error("Failed to send proof submission email to customer", {
        error: emailError?.message || String(emailError),
      });
    }
  }

  // WhatsApp parity for the proof-received notification — same lifecycle
  // event the email above covers, so customers who opted into WhatsApp also
  // see it in real time.
  const customerProofPhone = cleanPhoneNumber(order?.contactNumber);
  if (customerProofPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerProofPhone,
        message: `Saga Elite: we received your payment proof for reference ${payment.referenceNumber}. It is now pending verification by our team.`,
      });
    } catch (whatsAppError) {
      logger.error("Failed to send proof submission WhatsApp message", {
        error: whatsAppError?.message || String(whatsAppError),
      });
    }
  }

  const adminEmailBody = buildProofEmail(order, payment);
  try {
    await sendAdminEmailAlert("New payment proof submitted", adminEmailBody);
  } catch (emailError) {
    logger.error("Failed to send admin payment proof email", { emailError });
  }

  try {
    await sendAdminWhatsAppAlert(
      `Saga Elite: new payment proof submitted for order ${orderId}. Reference ${payment.referenceNumber}.`
    );
  } catch (whatsAppError) {
    logger.error("Failed to dispatch admin WhatsApp proof alert", {
      error: whatsAppError?.message || String(whatsAppError),
    });
  }

  return res.status(200).json({
    success: true,
    message: "Payment proof submitted successfully",
    data: {
      ...buildManualPaymentSummary(payment),
      bankDetails: getBankDetails(),
    },
  });
});

// Map PAN prefix to a card brand. Covers the major networks we'd see in Sri
// Lanka; unknown prefixes return "unknown" rather than throwing so a typo
// doesn't kill the demo flow.
const detectCardBrand = (pan) => {
  const digits = String(pan || "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  return "unknown";
};

// Sample card-payment submission. This is the placeholder for the PayHere
// gateway: customer enters card details on the demo gateway page, we record
// last4 + brand + cardholder + a generated gateway reference (NEVER the full
// PAN or CVV) and queue the record for admin verification — same admin
// queue used for manual bank transfers, just under the "Card" tab.
//
// When PayHere is wired up post-hosting, replace the body of this handler
// with a PayHere notify-URL handler that flips `simulated` to false and
// auto-verifies on `status_code === "2"`.
const submitSampleCardPayment = catchAsync(async (req, res, next) => {
  const { orderId, cardholderName, cardNumber, expiryMonth, expiryYear } = req.body;

  const order = await Order.findById(orderId).populate("user", "email role profilePicture");
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (order.paymentMethod !== "card") {
    return next(new AppError("This order was not placed with a card payment method", 400));
  }

  if (["confirmed", "shipped", "delivered", "cancelled", "refunded"].includes(order.status)) {
    return next(new AppError("This order can no longer accept card payments", 400));
  }

  // Reuse an in-flight payment record if the customer reloaded the demo
  // gateway screen and resubmitted — otherwise create a new one.
  let payment = await ManualPayment.findOne({
    orderId: order._id,
    paymentType: "card",
    status: { $in: ACTIVE_STATUSES },
  });

  // Authorize before we mutate anything. For guests we accept the email used
  // at checkout (passed in body or header); for logged-in users the
  // userInfo check happens implicitly via order ownership.
  if (req.userInfo?._id) {
    const orderUserId = order.user?._id || order.user;
    if (orderUserId && String(orderUserId) !== String(req.userInfo._id)) {
      return next(new AppError("You are not authorized to pay for this order", 403));
    }
  } else {
    const providedEmail = normalizeEmail(req.body.email || req.headers["x-payment-email"] || "");
    const expectedEmail = normalizeEmail(order.guestEmail || order.user?.email || "");
    if (!providedEmail || !expectedEmail || providedEmail !== expectedEmail) {
      return next(new AppError("Email does not match the order — please use the email you provided at checkout", 403));
    }
  }

  const now = new Date();
  const last4 = cardNumber.slice(-4);
  const brand = detectCardBrand(cardNumber);
  const gatewayReference = `SAMPLE-CARD-${crypto.randomUUID()}`;

  if (!payment) {
    const referenceNumber = await generateUniqueReference(order._id, ManualPayment);
    payment = await ManualPayment.create({
      referenceNumber,
      orderId: order._id,
      userId: order.user?._id || order.user || undefined,
      amount: Number(order.totalAmount),
      currency: "LKR",
      paymentType: "card",
      status: "proof_submitted",
      proofSubmittedAt: now,
      cardDetails: {
        cardholderName,
        last4,
        expiryMonth,
        expiryYear,
        brand,
        gatewayReference,
        simulated: true,
      },
    });
  } else {
    payment.status = "proof_submitted";
    payment.proofSubmittedAt = now;
    payment.rejectionReason = null;
    payment.adminNotes = null;
    payment.cardDetails = {
      cardholderName,
      last4,
      expiryMonth,
      expiryYear,
      brand,
      gatewayReference,
      simulated: true,
    };
    await payment.save({ validateModifiedOnly: true });
  }

  // Hold the order at verification_pending so admin can approve/reject.
  // Skip the generic syncOrderWithPayment helper because it forces
  // paymentMethod back to "manual_bank_transfer" — we need to keep "card".
  order.referenceNumber = payment.referenceNumber;
  order.status = "verification_pending";
  order.paymentStatus = "pending";
  order.expiresAt = undefined;
  await order.save({ validateModifiedOnly: true });

  // Repopulate for the response + notifications.
  await payment.populate({
    path: "orderId",
    populate: { path: "user", select: "email role profilePicture" },
  });
  await payment.populate("userId", "email role profilePicture");

  const customerUserId = order.user?._id || order.user || payment.userId?._id || payment.userId;
  const customerEmail = order.user?.email || payment.userId?.email || order.guestEmail || null;
  const customerPhone = cleanPhoneNumber(order.contactNumber);

  await broadcastNotification({
    type: "admin",
    title: "Sample card payment submitted",
    message: `Order ${order._id} — card ending ${last4} (${brand}). Awaiting admin verification.`,
    entityRef: order._id,
    entityType: "ManualPayment",
    meta: {
      orderId: order._id,
      referenceNumber: payment.referenceNumber,
      paymentId: payment._id,
      status: payment.status,
      paymentType: "card",
    },
    filter: { role: { $in: ADMIN_ROLES } },
  });

  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: "order",
      title: "Card payment received — verification in progress",
      message: `We received your card payment for order ${order._id}. Our team will confirm shortly.`,
      entityRef: order._id,
      entityType: "ManualPayment",
      meta: {
        orderId: order._id,
        referenceNumber: payment.referenceNumber,
        paymentId: payment._id,
        status: payment.status,
        paymentType: "card",
      },
    });
  }

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: "Saga Elite — card payment received (verification in progress)",
        html: buildEmailTemplate(
          "Card payment received",
          `<p>Thanks! We've received your card payment for order <strong>${order._id}</strong>.</p>
           <p><strong>Card:</strong> ${brand.toUpperCase()} ending ${last4}</p>
           <p><strong>Amount:</strong> ${payment.currency} ${formatCurrency(payment.amount)}</p>
           <p>Our team will verify the transaction and confirm your order shortly.</p>`
        ),
      });
    } catch (emailError) {
      logger.error("Failed to send card-payment receipt email", { error: emailError?.message });
    }
  }

  if (customerPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        message: `Saga Elite: card payment received for order ${order._id} (${brand.toUpperCase()} ending ${last4}). We'll confirm verification shortly.`,
      });
    } catch (whatsAppError) {
      logger.error("Failed to send card-payment WhatsApp", { error: whatsAppError?.message });
    }
  }

  emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId: order._id,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "card-submitted",
  });
  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: "card-submitted",
    paymentId: payment._id,
    orderId: order._id,
    userId: customerUserId,
  });

  return res.status(200).json({
    success: true,
    message: "Card payment submitted — admin verification in progress",
    data: {
      ...buildManualPaymentSummary(payment),
      orderId: order._id,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PayHere card payment
//
// Flow:
//   1. Order is placed with paymentMethod "card" (order-controller) → the
//      customer lands on the card-payment page.
//   2. The page calls `initiatePayHereCardPayment` → we create/reuse a card
//      ManualPayment record and return a PayHere-signed payment object.
//   3. The browser hands that object to PayHere's JS SDK; the customer pays on
//      PayHere's PCI-compliant popup (we never see PAN/CVV).
//   4. PayHere calls `handlePayHereNotify` (server-to-server) — the single
//      source of truth — which verifies the signature and confirms the order.
// ─────────────────────────────────────────────────────────────────────────────

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

// Public — the frontend uses this to decide whether to launch PayHere or fall
// back to the legacy sample card form. Never exposes the merchant secret.
const getPayHereConfig = catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      enabled: isPayHereConfigured(),
      sandbox: isPayHereSandbox(),
    },
  });
});

// Shared notification/socket/email/WhatsApp fan-out for a card payment that has
// been confirmed by the gateway. Mirrors the approve branch of verifyPayment.
const notifyCardPaymentVerified = async (payment, order, source = "payhere") => {
  const orderId = order?._id || payment.orderId?._id || payment.orderId;
  const customerUserId =
    order?.user?._id || order?.user || payment.userId?._id || payment.userId;
  const customerEmail =
    order?.user?.email || payment.userId?.email || order?.guestEmail || null;
  const customerPhone = cleanPhoneNumber(order?.contactNumber);

  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: "order",
      title: "Card payment successful",
      message: `Your card payment for order ${orderId} was successful — your order is confirmed.`,
      entityRef: orderId,
      entityType: "Order",
      meta: {
        orderId,
        referenceNumber: payment.referenceNumber,
        paymentId: payment._id,
        status: "verified",
        paymentType: "card",
        source,
      },
    });
  }

  await broadcastNotification({
    type: "admin",
    title: "Card payment received (PayHere)",
    message: `Order ${orderId} was paid by card via PayHere. Reference ${payment.referenceNumber}.`,
    entityRef: orderId,
    entityType: "Order",
    meta: {
      orderId,
      referenceNumber: payment.referenceNumber,
      paymentId: payment._id,
      status: "verified",
      paymentType: "card",
      source,
    },
    filter: { role: { $in: ADMIN_ROLES } },
  });

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: "Your Saga Elite card payment was successful",
        html: buildEmailTemplate(
          "Payment successful",
          `<p>Thank you! Your card payment for order <strong>${orderId}</strong> was successful.</p>
           <p><strong>Reference:</strong> ${payment.referenceNumber}</p>
           <p><strong>Amount:</strong> ${payment.currency} ${formatCurrency(payment.amount)}</p>
           <p>Your order is now confirmed and being prepared.</p>`
        ),
      });
    } catch (emailError) {
      logger.error("Failed to send card-payment success email", {
        error: emailError?.message,
      });
    }
  }

  if (customerPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        message: `Saga Elite: your card payment for order ${orderId} was successful. Your order is confirmed — thank you!`,
      });
    } catch (whatsAppError) {
      logger.error("Failed to send card-payment success WhatsApp", {
        error: whatsAppError?.message,
      });
    }
  }

  emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: `card-${source}-verified`,
  });
  emitToAll(SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: `card-${source}-verified`,
  });
  emitToAll(SOCKET_EVENTS.ORDER_REFRESH, {
    userId: customerUserId,
    orderId,
    status: order?.status,
    paymentStatus: order?.paymentStatus,
    source: `card-${source}-verified`,
  });
  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: `card-${source}-verified`,
    paymentId: payment._id,
    orderId,
    userId: customerUserId,
  });
};

// Fan-out for a card payment the gateway reported as canceled/failed. The order
// is held at verification_pending so the customer can retry or switch methods.
const notifyCardPaymentFailed = async (payment, order, reason) => {
  const orderId = order?._id || payment.orderId?._id || payment.orderId;
  const customerUserId =
    order?.user?._id || order?.user || payment.userId?._id || payment.userId;
  const customerEmail =
    order?.user?.email || payment.userId?.email || order?.guestEmail || null;
  const detail = reason ? ` (${reason})` : "";

  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: "order",
      title: "Card payment not completed",
      message: `Your card payment for order ${orderId} did not go through${detail}. You can try again from your order.`,
      entityRef: orderId,
      entityType: "Order",
      meta: {
        orderId,
        referenceNumber: payment.referenceNumber,
        paymentId: payment._id,
        status: "rejected",
        paymentType: "card",
      },
    });
  }

  if (customerEmail) {
    try {
      await sendEmail({
        email: customerEmail,
        subject: "Your Saga Elite card payment didn't go through",
        html: buildEmailTemplate(
          "Card payment not completed",
          `<p>We couldn't complete your card payment for order <strong>${orderId}</strong>${detail}.</p>
           <p>Your order is still reserved for a short time — you can retry the payment or choose bank transfer instead.</p>`
        ),
      });
    } catch (emailError) {
      logger.error("Failed to send card-payment failed email", {
        error: emailError?.message,
      });
    }
  }

  emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: "card-payhere-failed",
  });
  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: "card-payhere-failed",
    paymentId: payment._id,
    orderId,
    userId: customerUserId,
  });
};

const initiatePayHereCardPayment = catchAsync(async (req, res, next) => {
  if (!isPayHereConfigured()) {
    return next(new AppError("Card payments are not available right now", 503));
  }

  const { orderId } = req.body;
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return next(new AppError("A valid orderId is required", 400));
  }

  const order = await Order.findById(orderId).populate(
    "user",
    "email role profilePicture"
  );
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (order.paymentMethod !== "card") {
    return next(
      new AppError("This order was not placed with a card payment method", 400)
    );
  }

  if (
    ["confirmed", "shipped", "delivered", "cancelled", "refunded"].includes(
      order.status
    )
  ) {
    return next(new AppError("This order can no longer accept card payments", 400));
  }

  // Authorize the payer — a logged-in user must own the order; a guest must
  // present the email used at checkout (body or x-payment-email header).
  if (req.userInfo?._id) {
    const orderUserId = order.user?._id || order.user;
    if (orderUserId && String(orderUserId) !== String(req.userInfo._id)) {
      return next(new AppError("You are not authorized to pay for this order", 403));
    }
  } else {
    const providedEmail = normalizeEmail(
      req.body.email || req.headers["x-payment-email"] || ""
    );
    const expectedEmail = normalizeEmail(
      order.guestEmail || order.user?.email || ""
    );
    if (!providedEmail || !expectedEmail || providedEmail !== expectedEmail) {
      return next(
        new AppError(
          "Email does not match the order — please use the email you provided at checkout",
          403
        )
      );
    }
  }

  // Reuse an in-flight card record if the customer relaunched the popup;
  // otherwise create one. The referenceNumber doubles as the PayHere order_id
  // so the notify webhook can map back to this payment.
  let payment = await ManualPayment.findOne({
    orderId: order._id,
    paymentType: "card",
    status: { $in: ACTIVE_STATUSES },
  });

  if (!payment) {
    const referenceNumber = await generateUniqueReference(order._id, ManualPayment);
    payment = await ManualPayment.create({
      referenceNumber,
      orderId: order._id,
      userId: order.user?._id || order.user || undefined,
      amount: Number(order.totalAmount),
      currency: "LKR",
      paymentType: "card",
      status: "pending_payment",
      cardDetails: { simulated: false },
    });
  } else if (Number(payment.amount) !== Number(order.totalAmount)) {
    // Keep the record's amount aligned with the order total so the hash we sign
    // always matches what PayHere will charge.
    payment.amount = Number(order.totalAmount);
    await payment.save({ validateModifiedOnly: true });
  }

  const merchantId = getMerchantId();
  const currency = "LKR";
  const amount = Number(order.totalAmount);
  const orderRef = payment.referenceNumber;
  const hash = generateCheckoutHash({
    merchantId,
    orderId: orderRef,
    amount,
    currency,
  });

  const email = normalizeEmail(
    order.user?.email || order.guestEmail || req.body.email || ""
  );
  const rawName = String(
    req.body.customerName ||
      `${req.body.firstName || ""} ${req.body.lastName || ""}`
  ).trim();
  const fallbackName = email ? email.split("@")[0] : "Saga";
  const [firstNameRaw, ...restName] = (rawName || fallbackName).split(/\s+/);
  // PayHere requires a non-empty first_name / last_name.
  const firstName = firstNameRaw || "Saga";
  const lastName = restName.join(" ") || "Customer";

  const backendUrl = trimTrailingSlash(process.env.BACKEND_URL || "");
  const notifyUrl =
    process.env.PAYHERE_NOTIFY_URL ||
    (backendUrl ? `${backendUrl}/api/webhooks/payhere` : "");
  const shopUrl = trimTrailingSlash(clientShopUrl());
  const returnUrl = `${shopUrl}/shopping/card-payment/${order._id}?payment=success`;
  const cancelUrl = `${shopUrl}/shopping/card-payment/${order._id}?payment=cancelled`;

  if (!notifyUrl) {
    logger.warn(
      "PayHere initiate: BACKEND_URL / PAYHERE_NOTIFY_URL is not set — the notify webhook will not fire, so payments cannot auto-confirm"
    );
  }

  return res.status(200).json({
    success: true,
    message: "PayHere payment initiated",
    data: {
      sandbox: isPayHereSandbox(),
      checkoutUrl: getCheckoutUrl(),
      referenceNumber: orderRef,
      orderId: order._id,
      amount: formatAmount(amount),
      currency,
      payment: {
        sandbox: isPayHereSandbox(),
        merchant_id: merchantId,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        order_id: orderRef,
        items: `Saga Elite Order ${order._id}`,
        amount: formatAmount(amount),
        currency,
        hash,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: order.contactNumber || "",
        address: String(order.shippingAddress || "").slice(0, 200) || "N/A",
        city: String(req.body.city || "").trim() || "N/A",
        country: "Sri Lanka",
      },
    },
  });
});

// Server-to-server notify_url handler — the single source of truth for a
// PayHere card payment. PayHere POSTs application/x-www-form-urlencoded here.
const handlePayHereNotify = catchAsync(async (req, res) => {
  const {
    merchant_id: merchantId,
    order_id: orderRef,
    payment_id: paymentId,
    payhere_amount: payhereAmount,
    payhere_currency: payhereCurrency,
    status_code: statusCode,
    md5sig: receivedSig,
    method,
    status_message: statusMessage,
    card_holder_name: cardHolderName,
    card_no: cardNo,
  } = req.body || {};

  if (!isPayHereConfigured()) {
    logger.error("PayHere notify received but the gateway is not configured");
    return res.status(503).send("PayHere not configured");
  }

  // The signature is the gate: only a callback PayHere actually signed with our
  // merchant secret is trusted. Everything else is rejected without side effects.
  const signatureValid = verifyNotifySignature({
    merchantId,
    orderId: orderRef,
    payhereAmount,
    payhereCurrency,
    statusCode,
    receivedSig,
  });

  if (merchantId !== getMerchantId() || !signatureValid) {
    logger.warn("PayHere notify rejected: signature/merchant mismatch", {
      orderRef,
      merchantId,
    });
    return res.status(403).send("Invalid signature");
  }

  const payment = await ManualPayment.findOne({
    referenceNumber: String(orderRef || "").toUpperCase(),
  })
    .populate({
      path: "orderId",
      populate: { path: "user", select: "email role profilePicture" },
    })
    .populate("userId", "email role profilePicture");

  if (!payment) {
    // Ack so PayHere stops retrying — a missing record won't appear on retry.
    logger.warn("PayHere notify: no payment found for reference", { orderRef });
    return res.status(200).send("OK");
  }

  // Always record the raw gateway response for audit, even on duplicate hits.
  payment.payhere = {
    paymentId: paymentId || payment.payhere?.paymentId || null,
    statusCode: String(statusCode ?? ""),
    statusMessage: statusMessage || null,
    method: method || null,
    capturedAmount: payhereAmount != null ? Number(payhereAmount) : null,
    capturedCurrency: payhereCurrency || null,
    notifiedAt: new Date(),
  };
  payment.paymentType = "card";

  const order = payment.orderId;

  // Idempotency — PayHere retries notifications. Never re-run confirmation side
  // effects once we've verified this payment.
  if (payment.status === "verified") {
    await payment.save({ validateModifiedOnly: true });
    return res.status(200).send("OK");
  }

  if (String(statusCode) === PAYHERE_STATUS.SUCCESS) {
    // Amount-tamper guard — the signed payhere_amount must equal the order
    // total. A mismatch is held for manual admin review, never auto-confirmed.
    const expected = formatAmount(payment.amount);
    const captured = formatAmount(payhereAmount);

    payment.cardDetails = {
      ...(payment.cardDetails?.toObject?.() || payment.cardDetails || {}),
      cardholderName: cardHolderName || payment.cardDetails?.cardholderName || null,
      last4: cardNo
        ? String(cardNo).replace(/\D/g, "").slice(-4)
        : payment.cardDetails?.last4 || null,
      brand: method || payment.cardDetails?.brand || null,
      gatewayReference: paymentId || payment.cardDetails?.gatewayReference || null,
      simulated: false,
    };

    if (expected !== captured) {
      payment.status = "proof_submitted";
      payment.adminNotes = `PayHere amount mismatch: expected ${expected}, received ${captured}. Held for manual review.`;
      await payment.save({ validateModifiedOnly: true });

      if (order) {
        await syncOrderWithPayment(order, payment, {
          status: "verification_pending",
          paymentStatus: "pending",
          clearExpiry: true,
        });
      }

      await broadcastNotification({
        type: "admin",
        title: "PayHere payment needs review (amount mismatch)",
        message: `Order ${order?._id || orderRef}: PayHere charged ${captured} but the order total is ${expected}. Reference ${payment.referenceNumber}.`,
        entityRef: order?._id,
        entityType: "ManualPayment",
        meta: {
          orderId: order?._id,
          referenceNumber: payment.referenceNumber,
          paymentId: payment._id,
          status: payment.status,
          paymentType: "card",
        },
        filter: { role: { $in: ADMIN_ROLES } },
      });

      logger.error("PayHere amount mismatch held for review", {
        orderRef,
        expected,
        captured,
      });
      return res.status(200).send("OK");
    }

    payment.status = "verified";
    payment.verifiedAt = new Date();
    payment.rejectionReason = null;
    await payment.save({ validateModifiedOnly: true });

    if (order) {
      await syncOrderWithPayment(order, payment, {
        status: "confirmed",
        paymentStatus: "paid",
        clearExpiry: true,
      });
    }

    await notifyCardPaymentVerified(payment, order, "payhere");
    return res.status(200).send("OK");
  }

  // PayHere "pending" (rare for cards — e.g. bank-backed instruments). Leave the
  // record open so a later success/failure notification can resolve it.
  if (String(statusCode) === PAYHERE_STATUS.PENDING) {
    payment.status = "pending_payment";
    await payment.save({ validateModifiedOnly: true });
    return res.status(200).send("OK");
  }

  // Canceled / failed / chargedback.
  payment.status = "rejected";
  payment.rejectionReason = statusMessage || "Card payment was not completed.";
  await payment.save({ validateModifiedOnly: true });

  if (order) {
    await syncOrderWithPayment(order, payment, {
      status: "verification_pending",
      paymentStatus: "failed",
      clearExpiry: true,
    });
  }

  await notifyCardPaymentFailed(payment, order, statusMessage);
  return res.status(200).send("OK");
});

// New flow: customer submits the receipt file directly. We OCR the file before
// storing anything — if the reference number and amount can't be read, the
// upload is refused and nothing hits Cloudinary or the DB. If both extract
// cleanly and match, we auto-verify the payment and confirm the order. If the
// reference is on the slip but the amount is wrong (or vice versa), we store
// the proof and auto-reject so admin has an audit trail.
const submitWithReceipt = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Receipt file is required", 400));
  }

  const referenceInput = String(req.body.referenceNumber || "").trim();
  if (!referenceInput) {
    return next(new AppError("Reference number is required", 400));
  }

  const payment = await findPaymentByIdentifier(referenceInput);

  if (!payment) {
    return next(new AppError("Payment reference not found", 404));
  }

  await authorizePaymentAccess(payment, req);

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

  // Sanitize-before-store: OCR runs on the raw buffer. We only persist the
  // file to Cloudinary if the receipt is readable enough to make a decision.
  const ocrResult = await processReceipt(req.file.buffer, req.file.mimetype, {
    referenceNumber: payment.referenceNumber,
    amount: payment.amount,
  });

  if (!ocrResult.ok) {
    logger.info("Receipt rejected at OCR gate", {
      paymentId: payment._id,
      reason: ocrResult.reason,
    });
    return next(new AppError(ocrResult.message, 400));
  }

  // Store the receipt only after OCR has accepted it.
  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "saga-elite/receipts",
      req.file.mimetype
    );
  } catch (uploadError) {
    logger.error("Receipt Cloudinary upload failed", { error: uploadError?.message });
    return next(new AppError("Could not store receipt. Please try again in a moment.", 502));
  }

  payment.proofUrl = uploadResult.secure_url;
  payment.proofSubmittedAt = now;
  payment.ocr = {
    extractedText: ocrResult.ocrText?.slice(0, 8000) || null,
    extractedReference: ocrResult.extractedReference || null,
    extractedAmount: ocrResult.extractedAmount ?? null,
    referenceMatched: ocrResult.referenceMatched,
    amountMatched: ocrResult.amountMatched,
    decision: ocrResult.decision,
    decisionReason: ocrResult.decisionReason?.slice(0, 500) || null,
    processedAt: now,
  };

  // OCR alone never produces a final "verified" status. A receipt that
  // matches reference + amount only confirms the customer has *uploaded* a
  // believable slip — not that the bank has cleared the credit. Real
  // verification happens in bank-email-watcher.js when the bank's credit
  // alert email arrives. Here, the best the OCR layer can offer is a
  // provisional "ocr_matched" hold that ages into "verified" once the
  // bank confirms.
  if (ocrResult.decision === "ocr_matched") {
    payment.status = "pending_bank_confirmation";
    payment.rejectionReason = null;
    payment.adminNotes = null;
  } else if (ocrResult.decision === "auto_rejected") {
    payment.status = "rejected";
    payment.rejectionReason = ocrResult.decisionReason || "Receipt did not match order details.";
    payment.adminNotes = null;
  } else {
    payment.status = "proof_submitted";
    payment.rejectionReason = null;
    payment.adminNotes = null;
  }

  await payment.save({ validateModifiedOnly: true });

  const order = payment.orderId;
  if (order) {
    if (ocrResult.decision === "auto_rejected") {
      await syncOrderWithPayment(order, payment, {
        status: "verification_pending",
        paymentStatus: "failed",
        clearExpiry: true,
      });
    } else {
      // Both ocr_matched and manual_review hold the order at
      // verification_pending until the bank confirms (or admin overrides).
      await syncOrderWithPayment(order, payment, {
        status: "verification_pending",
        paymentStatus: "pending",
        clearExpiry: true,
      });
    }
  }

  const orderId = order?._id || payment.orderId?._id;
  const customerUserId = order?.user?._id || order?.user || payment.userId?._id || payment.userId;
  const customerEmail = order?.user?.email || payment.userId?.email || null;
  const customerPhone = cleanPhoneNumber(order?.contactNumber);

  // Notify admin (always, regardless of decision — they want visibility on every receipt)
  const adminTitle =
    ocrResult.decision === "ocr_matched"
      ? "Receipt OCR-matched (awaiting bank confirmation)"
      : ocrResult.decision === "auto_rejected"
        ? "Receipt auto-rejected"
        : "New payment proof submitted";

  await broadcastNotification({
    type: "admin",
    title: adminTitle,
    message: `Order ${orderId} reference ${payment.referenceNumber}: ${ocrResult.decisionReason}`,
    entityRef: orderId,
    entityType: "ManualPayment",
    meta: {
      orderId,
      referenceNumber: payment.referenceNumber,
      paymentId: payment._id,
      status: payment.status,
      decision: ocrResult.decision,
    },
    filter: { role: { $in: ADMIN_ROLES } },
  });

  // Notify customer with decision-specific copy. ocr_matched is *not*
  // verified — only "we like the look of your receipt, now we wait for the
  // bank to confirm". Be careful with the language so customers aren't
  // confused into thinking the order is fully cleared.
  const customerNotificationByDecision = {
    ocr_matched: {
      title: "Receipt received — awaiting bank confirmation",
      message: `We received your receipt for order ${orderId} and the details look right. We'll confirm your order as soon as your bank notifies us of the credit (usually within a few minutes).`,
    },
    auto_rejected: {
      title: "Receipt didn't match — please re-upload",
      message: `Your receipt for order ${orderId} could not be matched. ${ocrResult.decisionReason} Please upload a clearer or correct receipt.`,
    },
    manual_review: {
      title: "Payment proof received",
      message: `We received your receipt for order ${orderId}. It is awaiting manual verification by our team.`,
    },
  };

  const customerNotification = customerNotificationByDecision[ocrResult.decision] || customerNotificationByDecision.manual_review;
  if (customerUserId) {
    await createNotification({
      userId: customerUserId,
      type: "order",
      title: customerNotification.title,
      message: customerNotification.message,
      entityRef: orderId,
      entityType: "ManualPayment",
      meta: {
        orderId,
        referenceNumber: payment.referenceNumber,
        paymentId: payment._id,
        status: payment.status,
        decision: ocrResult.decision,
      },
    });
  }

  // Email customer
  if (customerEmail) {
    try {
      const emailSubjectByDecision = {
        ocr_matched: "Saga Elite — receipt received, awaiting bank confirmation",
        auto_rejected: "Your Saga Elite receipt didn't match — action needed",
        manual_review: "We received your payment proof",
      };
      const emailBody = buildEmailTemplate(
        customerNotification.title,
        `<p>${customerNotification.message}</p>
         <p><strong>Reference:</strong> ${payment.referenceNumber}</p>
         <p><strong>Amount:</strong> ${payment.currency} ${Number(payment.amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</p>`
      );
      await sendEmail({
        email: customerEmail,
        subject: emailSubjectByDecision[ocrResult.decision] || emailSubjectByDecision.manual_review,
        html: emailBody,
      });
    } catch (emailError) {
      logger.error("Failed to send customer receipt-decision email", { emailError });
    }
  }

  // WhatsApp customer for every receipt-decision branch. Customers expect
  // updates on the same channel as order confirmation, and silence between
  // upload and bank confirmation breeds support tickets.
  if (customerPhone) {
    const customerWhatsAppByDecision = {
      ocr_matched: `Saga Elite: receipt received for order ${orderId} (${payment.referenceNumber}). Awaiting bank confirmation — usually within minutes.`,
      auto_rejected: `Saga Elite: your receipt for order ${orderId} (${payment.referenceNumber}) couldn't be matched. ${ocrResult.decisionReason || ""} Please upload a clearer copy.`.trim(),
      manual_review: `Saga Elite: receipt received for order ${orderId} (${payment.referenceNumber}). Our team will verify it shortly and message you back.`,
    };
    const whatsAppBody = customerWhatsAppByDecision[ocrResult.decision];
    if (whatsAppBody) {
      try {
        await sendWhatsAppMessage({ to: customerPhone, message: whatsAppBody });
      } catch (whatsAppError) {
        logger.error("Failed to send receipt-decision WhatsApp message", {
          error: whatsAppError?.message || String(whatsAppError),
          decision: ocrResult.decision,
        });
      }
    }
  }

  // Admin email — always so admin can audit auto-decisions
  try {
    const adminBody = buildEmailTemplate(
      adminTitle,
      `<p>Order <strong>${orderId}</strong> — reference <strong>${payment.referenceNumber}</strong></p>
       <p><strong>Decision:</strong> ${ocrResult.decision}</p>
       <p><strong>Reason:</strong> ${ocrResult.decisionReason}</p>
       <p><strong>Extracted reference:</strong> ${ocrResult.extractedReference || "(none)"}</p>
       <p><strong>Extracted amount:</strong> ${ocrResult.extractedAmount ?? "(none)"}</p>
       <p>Open the manual-payments queue to review.</p>`
    );
    await sendAdminEmailAlert(adminTitle, adminBody);
  } catch (emailError) {
    logger.error("Failed to send admin receipt-decision email", { emailError });
  }

  // Sockets
  emitToUser(customerUserId, SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: `receipt-${ocrResult.decision}`,
  });
  emitToAll(SOCKET_EVENTS.PAYMENT_REFRESH, {
    userId: customerUserId,
    paymentId: payment._id,
    orderId,
    referenceNumber: payment.referenceNumber,
    status: payment.status,
    source: `receipt-${ocrResult.decision}`,
  });
  emitToAll(SOCKET_EVENTS.ADMIN_REFRESH, {
    source: `receipt-${ocrResult.decision}`,
    paymentId: payment._id,
    orderId,
    userId: customerUserId,
  });

  return res.status(200).json({
    success: true,
    message:
      ocrResult.decision === "ocr_matched"
        ? "Receipt accepted — awaiting bank confirmation"
        : ocrResult.decision === "auto_rejected"
          ? "Receipt could not be matched"
          : "Payment proof submitted for manual review",
    data: {
      ...buildManualPaymentSummary(payment),
      bankDetails: getBankDetails(),
      decision: ocrResult.decision,
      decisionReason: ocrResult.decisionReason,
      extractedReference: ocrResult.extractedReference,
      extractedAmount: ocrResult.extractedAmount,
    },
  });
});

const getMyPaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentIdentifier } = req.params;

  const payment = await findPaymentByIdentifier(paymentIdentifier);

  if (!payment) {
    return next(new AppError("Payment reference not found", 404));
  }

  await authorizePaymentAccess(payment, req);

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
  // Accept either a single status ("proof_submitted"), a comma-separated
  // list ("proof_submitted,pending_bank_confirmation"), or "all" (no filter
  // — admin sees every state including pending_payment / expired). The
  // sidebar badge still counts attention-needed states by passing them
  // explicitly.
  const statusRaw = String(req.query.status || "proof_submitted").trim();
  const guestOnly = String(req.query.guestOnly || "").toLowerCase() === "true";
  const countOnly = String(req.query.countOnly || "").toLowerCase() === "true";
  const paymentTypeRaw = String(req.query.paymentType || "").trim().toLowerCase();
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.max(1, Number.parseInt(req.query.limit || "20", 10) || 20);
  const skip = (page - 1) * limit;

  const filter = {};

  if (statusRaw.toLowerCase() !== "all") {
    const statuses = statusRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (statuses.length === 1) {
      filter.status = statuses[0];
    } else if (statuses.length > 1) {
      filter.status = { $in: statuses };
    }
  }

  if (guestOnly) {
    filter.guestId = { $exists: true, $ne: null };
  }

  // Admin tabs: "manual_bank_transfer" | "card" | omitted = all. Legacy
  // records created before the field existed default to manual_bank_transfer
  // via the schema default, so they show up under "Manual" automatically.
  if (paymentTypeRaw === "manual_bank_transfer") {
    filter.$or = [
      { paymentType: "manual_bank_transfer" },
      { paymentType: { $exists: false } },
    ];
  } else if (paymentTypeRaw === "card") {
    filter.paymentType = "card";
  }

  if (countOnly) {
    const totalCount = await ManualPayment.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Manual payment count fetched successfully",
      data: {
        count: totalCount,
      },
    });
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
    // Stamp audit so we can later distinguish bank-confirmed vs admin-overridden
    // verifications in dashboards / reporting.
    payment.bankVerification = {
      ...(payment.bankVerification?.toObject?.() || payment.bankVerification || {}),
      confirmed: true,
      confirmedAt: payment.verifiedAt,
      source: "manual_admin",
    };

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
        logger.error("Failed to send verification email to customer", { emailError });
      }
    }

    if (customerPhone) {
      try {
        await sendWhatsAppMessage({
          to: customerPhone,
          message: `Saga Elite: your payment for order ${orderId} has been verified successfully. Thank you for your purchase.`,
        });
      } catch (whatsAppError) {
        logger.error("Failed to send payment verification WhatsApp message", {
          error: whatsAppError?.message || String(whatsAppError),
        });
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
      logger.error("Failed to send rejection email to customer", { emailError });
    }
  }

  if (customerPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        message: `Saga Elite: your payment proof for order ${orderId} was rejected. ${payment.rejectionReason} Please submit an updated receipt within 24 hours to avoid cancellation.`,
      });
    } catch (whatsAppError) {
      logger.error("Failed to send payment rejection WhatsApp message", {
        error: whatsAppError?.message || String(whatsAppError),
      });
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

const getMyPendingPayments = catchAsync(async (req, res) => {
  const userId = req.userInfo._id;
  const payments = await ManualPayment.find({
    userId,
    status: { $in: ["pending_payment", "proof_submitted"] },
  })
    .populate("orderId", "totalAmount items status createdAt paymentMethod")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { payments },
  });
});

const requestExtension = catchAsync(async (req, res, next) => {
  const payment = await ManualPayment.findOne({ slug: req.params.slug })
    .populate({
      path: "orderId",
      populate: { path: "user", select: "email" },
    })
    .populate("userId", "email")
    .populate("guestId", "email");
  if (!payment) return next(new AppError('Payment not found', 404));

  await authorizePaymentAccess(payment, req);

  if (payment.extensionGranted) {
    return next(new AppError('Extension already used. Contact support.', 400));
  }
  if (payment.status !== 'pending_payment') {
    return next(new AppError('This payment cannot be extended.', 400));
  }

  payment.expiresAt = new Date(payment.expiresAt.getTime() + 12 * 60 * 60 * 1000);
  payment.extensionGranted = true;
  payment.extensionRequestedAt = new Date();
  
  await payment.save({ validateModifiedOnly: true });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sagaelite.com';
  
  sendEmail({
    email: adminEmail,
    subject: `Payment extension requested for reference: ${payment.referenceNumber}`,
    html: `<p>A customer has requested a 12-hour extension for their manual payment via Bank Transfer.</p>
           <p><strong>Reference:</strong> ${payment.referenceNumber}</p>
           <p><strong>New Expiration:</strong> ${payment.expiresAt.toLocaleString()}</p>`
  }).catch(err => logger.error("Admin extension notify failed", { error: err.message }));

  res.status(200).json({ success: true, newExpiresAt: payment.expiresAt });
});

// Public lookup so a guest (or logged-in user) who lost their payment link
// can recover it with the email + reference number / order ID they used at
// checkout. Returns the slug for redirect; never reveals payment details.
const lookupPayment = catchAsync(async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  const identifier = String(req.body?.identifier || "").trim();

  if (!email) {
    return next(new AppError("Email is required", 400));
  }
  if (!identifier) {
    return next(new AppError("Reference number or order ID is required", 400));
  }

  const orFilters = [
    { referenceNumber: identifier.toUpperCase() },
    { slug: identifier.toLowerCase() },
  ];

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    orFilters.push({ orderId: identifier });
  }

  const candidates = await ManualPayment.find({ $or: orFilters })
    .populate({
      path: "orderId",
      populate: { path: "user", select: "email" },
    })
    .populate("userId", "email")
    .populate("guestId", "email")
    .sort({ createdAt: -1 })
    .limit(5);

  for (const payment of candidates) {
    const expectedEmail = await resolvePaymentEmail(payment);
    if (expectedEmail && expectedEmail === email) {
      return res.status(200).json({
        success: true,
        message: "Payment found",
        data: {
          slug: payment.slug,
          referenceNumber: payment.referenceNumber,
          status: payment.status,
        },
      });
    }
  }

  return next(
    new AppError(
      "We could not find a payment matching that email and reference. Double-check both and try again.",
      404
    )
  );
});

// Resend the payment link by email + WhatsApp. Used when the customer
// chooses to pay later, or has lost their email. Email-gated like the rest
// of the guest endpoints — caller must prove they own the order.
const sendPaymentLink = catchAsync(async (req, res, next) => {
  const slug = String(req.params.slug || "").trim();
  if (!slug) {
    return next(new AppError("Payment slug is required", 400));
  }

  const payment = await ManualPayment.findOne({ slug })
    .populate({
      path: "orderId",
      populate: { path: "user", select: "email" },
    })
    .populate("userId", "email")
    .populate("guestId", "email");

  if (!payment) {
    return next(new AppError("Payment not found", 404));
  }

  await authorizePaymentAccess(payment, req);

  const recipientEmail = await resolvePaymentEmail(payment);
  const order = payment.orderId && typeof payment.orderId === "object"
    ? payment.orderId
    : null;
  const phone = cleanPhoneNumber(order?.contactNumber);
  // Include the order email so guests opening the link skip the email gate.
  const link =
    `${clientShopUrl()}/shopping/manual-payment/${payment.slug}` +
    (recipientEmail ? `?email=${encodeURIComponent(recipientEmail)}` : "");
  const amount = Number(payment.amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let emailSent = false;
  if (recipientEmail) {
    try {
      const html = buildEmailTemplate(
        "Your Saga Elite payment link",
        `<p>Here's the payment link for your order. You can pay any time within 24 hours.</p>
         <p><strong>Reference:</strong> ${payment.referenceNumber}</p>
         <p><strong>Amount:</strong> ${payment.currency || "LKR"} ${amount}</p>
         <p><strong>Bank:</strong> Sampath Bank, Hatton — A/C N.Gayathree — 108052612262</p>
         <p>Use the reference exactly as shown in the transfer remarks.</p>
         <p><a href="${link}">Open my payment page →</a></p>`
      );
      await sendEmail({
        email: recipientEmail,
        subject: `Your Saga Elite payment link (${payment.referenceNumber})`,
        html,
      });
      emailSent = true;
    } catch (err) {
      logger.error("sendPaymentLink: email failed", { error: err?.message });
    }
  }

  let whatsAppSent = false;
  if (phone) {
    try {
      const result = await sendWhatsAppMessage({
        to: phone,
        message:
          `*Saga Elite Payment Link*\n` +
          `Reference: *${payment.referenceNumber}*\n` +
          `Amount: *LKR ${amount}*\n` +
          `Pay here: ${link}`,
      });
      whatsAppSent = !result?.skipped;
    } catch (err) {
      logger.error("sendPaymentLink: whatsapp failed", { error: err?.message });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Payment link sent",
    data: {
      emailSent,
      whatsAppSent,
      maskedEmail: recipientEmail
        ? recipientEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
        : null,
      maskedPhone: phone ? `••• ${phone.slice(-4)}` : null,
    },
  });
});

// Aggregate summary by payment method (Fix #2). Joins ManualPayment to its
// Order to expose Order.paymentMethod (manual_bank_transfer, etc.) and totals.
const getMethodSummary = catchAsync(async (req, res) => {
  const guestOnly = String(req.query.guestOnly || "").toLowerCase() === "true";
  const matchStage = guestOnly ? { guestId: { $exists: true, $ne: null } } : {};

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "orders",
        localField: "orderId",
        foreignField: "_id",
        as: "order",
      },
    },
    { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          // Prefer the ManualPayment.paymentType field when set — it's the
          // source of truth post-card-integration. Fall back to the Order's
          // paymentMethod for legacy records that pre-date the field.
          method: {
            $ifNull: ["$paymentType", { $ifNull: ["$order.paymentMethod", "manual_bank_transfer"] }],
          },
          status: "$status",
        },
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $group: {
        _id: "$_id.method",
        count: { $sum: "$count" },
        totalAmount: { $sum: "$totalAmount" },
        byStatus: {
          $push: {
            status: "$_id.status",
            count: "$count",
            totalAmount: "$totalAmount",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        method: "$_id",
        count: 1,
        totalAmount: 1,
        byStatus: 1,
      },
    },
    { $sort: { count: -1 } },
  ];

  const byMethod = await ManualPayment.aggregate(pipeline);

  const totals = byMethod.reduce(
    (acc, row) => {
      acc.count += row.count || 0;
      acc.totalAmount += row.totalAmount || 0;
      return acc;
    },
    { count: 0, totalAmount: 0 }
  );

  return res.status(200).json({
    success: true,
    data: { byMethod, totals },
  });
});

module.exports = {
  generateReference,
  submitProof,
  submitWithReceipt,
  submitSampleCardPayment,
  getPayHereConfig,
  initiatePayHereCardPayment,
  handlePayHereNotify,
  getMyPaymentStatus,
  getMyPendingPayments,
  getPendingPayments,
  getMethodSummary,
  getPaymentById,
  verifyPayment,
  requestExtension,
  lookupPayment,
  sendPaymentLink,
};
