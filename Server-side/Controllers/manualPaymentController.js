const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Order = require("../Models/Order");
const ManualPayment = require("../Models/ManualPayment");
const User = require("../Models/User");
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

const ACTIVE_STATUSES = ["pending_payment", "proof_submitted"];

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
  slug: payment.slug,
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
      logger.error("Failed to send proof submission email to customer", { emailError });
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
    logger.error("Failed to dispatch admin WhatsApp proof alert", { whatsAppError });
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

  const referenceInput = String(req.body.referenceNumber || "").trim().toUpperCase();
  if (!referenceInput) {
    return next(new AppError("Reference number is required", 400));
  }

  const payment = await ManualPayment.findOne({ referenceNumber: referenceInput })
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

  // WhatsApp customer when their slip OCR-matched — sets expectation that
  // bank confirmation is the next step (no premature "verified" message).
  if (ocrResult.decision === "ocr_matched" && customerPhone) {
    try {
      await sendWhatsAppMessage({
        to: customerPhone,
        message: `Saga Elite: receipt received for order ${orderId} (${payment.referenceNumber}). Awaiting bank confirmation — usually within minutes.`,
      });
    } catch (whatsAppError) {
      logger.error("Failed to send ocr_matched WhatsApp message", { whatsAppError });
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

  const identifier = String(paymentIdentifier || "").trim();
  const payment = await ManualPayment.findOne({
    $or: [{ slug: identifier }, { referenceNumber: identifier }],
  })
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
  // Accept either a single status ("proof_submitted") or a comma-separated
  // list ("proof_submitted,pending_bank_confirmation") so the sidebar badge
  // can count any "needs admin attention" bucket in one call.
  const statusRaw = String(req.query.status || "proof_submitted").trim();
  const countOnly = String(req.query.countOnly || "").toLowerCase() === "true";
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.max(1, Number.parseInt(req.query.limit || "20", 10) || 20);
  const skip = (page - 1) * limit;

  const statuses = statusRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const filter = {};
  if (statuses.length === 1) {
    filter.status = statuses[0];
  } else if (statuses.length > 1) {
    filter.status = { $in: statuses };
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
        logger.error("Failed to send payment verification WhatsApp message", { whatsAppError });
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
      logger.error("Failed to send payment rejection WhatsApp message", { whatsAppError });
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
  if (!req.userInfo) {
    return next(new AppError('Please sign in to request an extension.', 401));
  }

  const payment = await ManualPayment.findOne({ slug: req.params.slug });
  if (!payment) return next(new AppError('Payment not found', 404));

  if (String(payment.userId || '') !== String(req.userInfo._id)) {
    return next(new AppError('You are not authorized to extend this payment.', 403));
  }

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

module.exports = {
  generateReference,
  submitProof,
  submitWithReceipt,
  getMyPaymentStatus,
  getMyPendingPayments,
  getPendingPayments,
  getPaymentById,
  verifyPayment,
  requestExtension,
};
