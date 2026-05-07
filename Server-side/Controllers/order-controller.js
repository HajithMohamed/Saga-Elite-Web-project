const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const Gift = require("../Models/Gift");
const Drop = require("../Models/Drop");
const User = require("../Models/User");
const Guest = require("../Models/Guest");
const ManualPayment = require("../Models/ManualPayment");
const Review = require("../Models/Review");
const { computeMembershipTier } = require("../Utils/membership-tier");
const { generateUniqueReference } = require("../Utils/referenceGenerator");
const { isAdminRole } = require("../Utils/admin-roles");
const { createNotification, broadcastNotification } = require("../Utils/notification-service");
const {
  sendWhatsAppMessage,
  parsePhoneList,
  cleanPhoneNumber,
} = require("../Utils/whatsapp-service");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const logger = require("../Utils/logger");

const CASH_ORDER_EXPIRY_MS = 15 * 60 * 1000;

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const ORDER_STATUS_FLOW = {
  pending: ["pending_payment", "confirmed", "cancelled"],
  pending_payment: ["verification_pending", "confirmed", "cancelled"],
  verification_pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refund_requested", "refunded"],
  cancelled: [],
  refund_requested: ["refunded", "delivered"],
  refunded: [],
};

const REFUND_REASONS = new Set([
  "wrong_item",
  "damaged",
  "customer_request",
  "other",
]);

const clientShopUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

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
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 chars
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

const createOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    checkoutMode,
    shippingAddress,
    contactNumber,
    paymentMethod,
    paymentProofUrl,
    notes,
    guestEmail,
  } = req.body;

  logger.debug("Order creation request received", {
    paymentMethod: req.body?.paymentMethod,
    itemCount: Array.isArray(req.body?.items) ? req.body.items.length : 0,
  });

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Order items are required", 400));
  }

  if (!shippingAddress || !shippingAddress.trim()) {
    return next(new AppError("Shipping address is required", 400));
  }

  if (!contactNumber || !contactNumber.trim()) {
    return next(new AppError("Contact number is required", 400));
  }

  if (!paymentMethod || !["payhere", "gpay", "manual", "manual_bank_transfer", "card", "lankapay", "cash"].includes(paymentMethod)) {
    return next(new AppError("Invalid payment method", 400));
  }

  const isLegacyManualPayment = paymentMethod === "manual";
  const isBankTransferPayment = paymentMethod === "manual_bank_transfer";

  if (isLegacyManualPayment && !paymentProofUrl?.trim()) {
    return next(new AppError("Receipt information is required for manual payment", 400));
  }

  // Determine if guest or user
  let user = req.userInfo;
  let guest = null;
  let guestEmailNormalized = null;

  if (!user && guestEmail) {
    guestEmailNormalized = guestEmail.trim().toLowerCase();
    guest = await Guest.findOneAndUpdate(
      { email: guestEmailNormalized },
      { lastUsedAt: new Date() },
      { upsert: true, new: true }
    );
  } else if (!user) {
    return next(new AppError("Authentication required for registered users or guest email for guests", 401));
  }

  const normalizedCheckoutMode = checkoutMode === "buyNow" ? "buyNow" : "cart";

  const session = await mongoose.startSession();

  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        const { productId, variantSku, quantity } = item;

        if (!productId || !variantSku || !quantity || quantity <= 0) {
          throw new AppError("Each order item must include a product, variant, and positive quantity", 400);
        }

        const product = await Product.findById(productId).session(session);

        if (!product || !product.isActive) {
          throw new AppError("Product not found or unavailable", 404);
        }

        const variant = product.variants.find((variant) => variant.sku === variantSku);

        if (!variant) {
          throw new AppError("Selected product variant not found", 404);
        }

        if (variant.stock < quantity) {
          throw new AppError(
            `Not enough stock for ${product.name} (${variant.size} / ${variant.color}).`,
            400,
          );
        }

        if (product.isLimited) {
          const previousQuantityResult = await Order.aggregate([
            {
              $match: user
                ? { user: user._id }
                : { guest: guest._id }
            },
            { $unwind: "$items" },
            { $match: { "items.product": product._id } },
            { $group: { _id: null, totalQuantity: { $sum: "$items.quantity" } } },
          ]).session(session);

          const previouslyOrdered = previousQuantityResult?.[0]?.totalQuantity || 0;

          if (previouslyOrdered + quantity > product.maxPerUser) {
            throw new AppError(
              `Limit exceeded for ${product.name}. You may order up to ${product.maxPerUser} units total.`,
              400,
            );
          }
        }

        const priceBeforeDiscount =
          product.basePrice + (variant.priceAdjustment || 0);
        const unitPrice = Math.round(
          priceBeforeDiscount * (1 - (product.discountPercent || 0) / 100)
        );
        const itemTotal = unitPrice * quantity;

        variant.stock -= quantity;
        product.soldCount += quantity;

        await product.save({ session, validateModifiedOnly: true });

        orderItems.push({
          product: product._id,
          productName: product.name,
          productArtNo: product.artNo,
          productSlug: product.slug,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity,
          unitPrice,
          totalPrice: itemTotal,
        });

        totalAmount += itemTotal;
      }

      const dropId = req.body.dropId || null;
      let selectedGift = null;

      if (dropId) {
        selectedGift = await Gift.findOne({ isActive: true, drop: dropId }).session(session);
      }

      if (!selectedGift) {
        selectedGift = await Gift.findOne({ isActive: true, drop: null }).session(session);
      }

      const orderPayload = {
        user: user ? user._id : undefined,
        guest: guest ? guest._id : undefined,
        guestEmail: guestEmailNormalized,
        items: orderItems,
        totalAmount,
        shippingAddress: shippingAddress.trim(),
        contactNumber: contactNumber.trim(),
        paymentMethod,
        paymentProofUrl: paymentProofUrl ? paymentProofUrl.trim() : undefined,
        referenceNumber: isLegacyManualPayment ? generateReferenceNumber() : undefined,
        notes: notes?.trim(),
        status: isBankTransferPayment
          ? "pending_payment"
          : ["manual", "cash"].includes(paymentMethod)
            ? "verification_pending"
            : "confirmed",
        paymentStatus: isBankTransferPayment || ["manual", "cash"].includes(paymentMethod) ? "pending" : "paid",
        expiresAt: isLegacyManualPayment || paymentMethod === "cash"
          ? new Date(Date.now() + CASH_ORDER_EXPIRY_MS)
          : undefined,
      };

      if (selectedGift) {
        orderPayload.gift = {
          giftId: selectedGift._id,
          revealed: false,
        };
      }

      const [orderDocument] = await Order.create([orderPayload], { session });
      createdOrder = orderDocument;

      if (user && normalizedCheckoutMode === "cart") {
        user.cart = [];
        await user.save({ session, validateModifiedOnly: true });
      }

      if (guest) {
        guest.orderCount += 1;
        await guest.save({ session });
      }
    });
  } finally {
    session.endSession();
  }

  const orderNotification = {
    userId: user ? user._id : null,
    type: "order",
    title: "Order placed successfully",
    message: `Your order ${createdOrder._id} has been placed and is ${createdOrder.status}.`,
    entityRef: createdOrder._id,
    entityType: "Order",
    meta: { orderId: createdOrder._id },
  };

  if (user) {
    await createNotification(orderNotification);
  }

  await broadcastNotification({
    type: "admin",
    title: `New order received: ${createdOrder._id}`,
    message: `Order ${createdOrder._id} was placed by ${user ? user.email : guestEmailNormalized || "a guest"} for ${createdOrder.totalAmount}.`,
    entityRef: createdOrder._id,
    entityType: "Order",
    meta: { orderId: createdOrder._id, customer: user ? user.email : guestEmailNormalized },
    filter: { role: "admin" },
  });

  const orderNotifyPhones = parsePhoneList(
    process.env.WHATSAPP_ORDER_NOTIFY_NUMBERS ||
      process.env.MANUAL_PAYMENT_ADMIN_WHATSAPP_NUMBERS ||
      ""
  );

  if (orderNotifyPhones.length > 0) {
    const customerLabel = user?.email || guestEmailNormalized || "Guest";
    const notifyBody =
      `New order — Saga Elite\n` +
      `Order: ${createdOrder._id}\n` +
      `Total: LKR ${createdOrder.totalAmount}\n` +
      `Contact: ${contactNumber.trim()}\n` +
      `Customer: ${customerLabel}\n` +
      `Payment: ${paymentMethod}`;

    orderNotifyPhones.forEach((to) => {
      sendWhatsAppMessage({ to, message: notifyBody }).catch((err) =>
        logger.error("WhatsApp order notify failed", { error: err.message })
      );
    });
  }

  // If guest or registered, send payment instructions
  if (isBankTransferPayment) {
    const referenceNumber = await generateUniqueReference(createdOrder._id, ManualPayment);
    const manualPayment = await ManualPayment.create({
      referenceNumber,
      orderId: createdOrder._id,
      userId: user ? user._id : undefined,
      guestId: guest ? guest._id : undefined,
      amount: createdOrder.totalAmount,
      currency: "LKR",
    });

    const paymentLink = `${process.env.FRONTEND_URL}/shopping/manual-payment/${manualPayment.slug}`;
    const customerEmail = user?.email || guestEmailNormalized;
    const customerPhone = cleanPhoneNumber(contactNumber);

    if (customerEmail) {
      const emailHtml = buildEmailTemplate(
        "Complete your payment",
        `<p>Thank you for your order! Here are your payment instructions:</p>
         <p><strong>Reference:</strong> ${manualPayment.referenceNumber}</p>
         <p><strong>Amount:</strong> LKR ${createdOrder.totalAmount.toLocaleString()}</p>
         <p><strong>Bank:</strong> Sampath Bank, Hatton Branch</p>
         <p><strong>Account Name:</strong> N.Gayathree</p>
         <p><strong>Account No:</strong> 108052612262</p>
         <p><strong>IMPORTANT:</strong> Write ${manualPayment.referenceNumber} in the transfer remarks or on your ATM deposit slip.</p>
         <p><strong>You have 24 hours.</strong> After that your order expires.</p>
         <p><a href="${paymentLink}">Upload your receipt here →</a></p>`
      );
      sendEmail({
        to: customerEmail,
        subject: `Your Saga Elite reference: ${manualPayment.referenceNumber}`,
        html: emailHtml,
      }).catch((err) => logger.error("Email customer notify failed", { error: err.message }));
    }

    if (customerPhone) {
      sendWhatsAppMessage({
        to: customerPhone,
        message:
          `*Saga Elite Order*\n` +
          `Reference: *${manualPayment.referenceNumber}*\n` +
          `Amount: *LKR ${createdOrder.totalAmount.toLocaleString()}*\n` +
          `Upload your receipt: ${paymentLink}\n` +
          `You have 24 hours to complete payment.`
      }).catch((err) => logger.error("WhatsApp customer notify failed", { error: err.message }));
    }
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    orderId: createdOrder._id,
    data: createdOrder,
  });
});

const getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.userInfo._id })
    .populate({
      path: "items.product",
      select: "name slug primaryImage",
      populate: {
        path: "images",
        options: { sort: { order: 1 } },
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "User orders fetched successfully",
    data: orders,
  });
});

const getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "email role")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: "All orders fetched successfully",
    data: orders,
  });
});

const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "email role profilePicture provider")
    .populate({
      path: "items.product",
      select: "primaryImage name slug",
      populate: {
        path: "images",
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  const orderOwnerId = order.user?._id || order.user;
  const isOwner = String(orderOwnerId) === String(req.userInfo._id);
  const isAdmin = isAdminRole(req.userInfo.role);

  if (!isOwner && !isAdmin) {
    return next(new AppError("You are not authorized to view this order", 403));
  }

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: order,
  });
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, cancellationReason } = req.body;
  const allowedStatuses = ["pending", "pending_payment", "verification_pending", "confirmed", "shipped", "delivered", "cancelled"];

  if (!status || !allowedStatuses.includes(status)) {
    return next(new AppError("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  const currentStatus = order.status;
  const allowedNext = ORDER_STATUS_FLOW[currentStatus] || [];

  if (!allowedNext.includes(status)) {
    return next(
      new AppError(
        `Cannot transition order from "${currentStatus}" to "${status}". ` +
          (allowedNext.length ? `Allowed next statuses: ${allowedNext.join(", ")}.` : "This status is final."),
        400
      )
    );
  }

  if (status === "cancelled") {
    const reason = String(cancellationReason || "").trim();
    if (!reason) {
      return next(new AppError("A cancellation reason is required when cancelling an order.", 400));
    }
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = req.userInfo._id;

    // Restore stock for each order item
    for (const item of order.items) {
      try {
        const product = await Product.findById(item.product);
        if (product) {
          const variant = product.variants.find((v) => v.sku === item.variantSku);
          if (variant) {
            variant.stock += item.quantity;
          }
          product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
          await product.save({ validateModifiedOnly: true });
        }
      } catch (stockErr) {
        logger.error("Failed to restore stock for cancelled order item", {
          orderId: order._id,
          productId: item.product,
          variantSku: item.variantSku,
          error: stockErr.message,
        });
      }
    }
  }

  order.status = status;
  if (status === "confirmed" && ["manual", "manual_bank_transfer", "cash", "receipt"].includes(order.paymentMethod)) {
    order.paymentStatus = "paid";
  }

  await order.save({ validateModifiedOnly: true });

  if (status === "cancelled" && order.user) {
    const populatedOrder = await Order.findById(order._id).populate("user", "email");

    const customer = populatedOrder?.user;
    const reasonHtml = escapeHtml(populatedOrder.cancellationReason || order.cancellationReason || "");
    const reasonPlain =
      populatedOrder.cancellationReason || order.cancellationReason || "";

    await createNotification({
      userId: order.user,
      type: "order",
      title: "Your order has been cancelled",
      message: `Order #${order._id} was cancelled. Reason: ${reasonPlain}`,
      entityRef: order._id,
      entityType: "Order",
      meta: { orderId: order._id, status: "cancelled", cancellationReason: reasonPlain },
    });

    if (customer?.email) {
      sendEmail({
        email: customer.email,
        subject: "Your Saga Elite order has been cancelled",
        html: buildEmailTemplate(
          "Order cancellation notice",
          `<p>Hi,</p>
           <p>Your order <strong>#${order._id}</strong> has been cancelled.</p>
           <p><strong>Reason:</strong> ${reasonHtml}</p>
           <p>If you believe this is an error or need assistance, please contact us at sagaaelite@gmail.com or WhatsApp +94 77 070 4274.</p>`
        ),
      }).catch((err) => logger.error("[cancel] Email failed", { error: err.message }));
    }

    const phone = cleanPhoneNumber(populatedOrder?.contactNumber || order.contactNumber || "");
    if (phone) {
      sendWhatsAppMessage({
        to: phone,
        message: `Your Saga Elite order #${order._id} has been cancelled.\n\nReason: ${reasonPlain}\n\nFor help: sagaaelite@gmail.com`,
      }).catch((err) => logger.error("[cancel] WhatsApp failed", { error: err.message }));
    }

    await broadcastNotification({
      type: "admin",
      title: `Order ${order._id} cancelled`,
      message: `Order ${order._id} was cancelled. Reason: ${reasonPlain}`,
      entityRef: order._id,
      entityType: "Order",
      meta: { orderId: order._id, status: "cancelled" },
      filter: { role: "admin" },
    });
  } else if (status !== "delivered") {
    if (order.user) {
      await createNotification({
        userId: order.user,
        type: "order",
        title: "Order status updated",
        message: `Your order ${order._id} status changed to ${order.status}.`,
        entityRef: order._id,
        entityType: "Order",
        meta: { orderId: order._id, status: order.status },
      });
    }

    await broadcastNotification({
      type: "admin",
      title: `Order ${order._id} status changed`,
      message: `Order ${order._id} is now ${order.status}.`,
      entityRef: order._id,
      entityType: "Order",
      meta: { orderId: order._id, status: order.status },
      filter: { role: "admin" },
    });
  } else if (status === "delivered") {
    order.gift = order.gift || { giftId: null, revealed: false };
    const hasGift = Boolean(order.gift.giftId);
    if (hasGift && !order.gift.revealed) {
      order.gift.revealed = true;
      await order.save({ validateModifiedOnly: true });
    }

    // Update customer membership totals (skip guest orders).
    if (order.user) {
      try {
        const updatedUser = await User.findByIdAndUpdate(
          order.user,
          {
            $inc: {
              totalSpent: order.totalAmount || 0,
              orderCount: 1,
            },
            $set: { lastOrderAt: new Date() },
          },
          { new: true }
        ).select("totalSpent membership");

        if (updatedUser) {
          const nextTier = computeMembershipTier(
            updatedUser.totalSpent,
            updatedUser.membership
          );
          if (nextTier !== updatedUser.membership) {
            await User.updateOne(
              { _id: order.user },
              { $set: { membership: nextTier } }
            );
          }
        }
      } catch (membershipErr) {
        logger.error("Membership recompute failed", {
          orderId: order._id,
          userId: order.user,
          error: membershipErr?.message,
        });
      }
    }

    const deliveredOrder = await Order.findById(order._id)
      .populate("user", "email")
      .populate("gift.giftId");
    const line0 = order.items?.[0];
    const productSlug =
      line0?.productSlug ||
      (line0?.product != null ? String(line0.product) : "") ||
      "";
    const base = clientShopUrl();
    const reviewUrl =
      productSlug.trim() !== ""
        ? `${base}/shopping/product/${encodeURIComponent(productSlug.trim())}#reviews`
        : `${base}/shopping/product-list`;

    const customer = deliveredOrder?.user;
    const productName =
      typeof line0?.productName === "string" ? line0.productName : "your recent purchase";
    const greeting = customer?.email ? customer.email.split("@")[0] : "there";
    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
    const giftDescription = deliveredOrder?.gift?.giftId?.description || "your surprise gift";

    if (customer?._id) {
      await createNotification({
        userId: customer._id,
        type: "reminder",
        title: "How was your order?",
        message: `Your order #${order._id} has been delivered! Share your experience: ${reviewUrl}`,
        entityRef: order._id,
        entityType: "Order",
        meta: { orderId: order._id, reviewUrl, status: "delivered" },
      });

      if (hasGift) {
        await createNotification({
          userId: customer._id,
          type: "order",
          title: "Your surprise gift is revealed",
          message: `Your Saga Elite surprise gift has been revealed! Open your package and discover ${giftDescription}.`,
          entityRef: order._id,
          entityType: "Order",
          meta: {
            orderId: order._id,
            status: "delivered",
            giftId: deliveredOrder?.gift?.giftId?._id || null,
            revealed: true,
          },
        });
      }
    }

    if (customer?.email) {
      sendEmail({
        email: customer.email,
        subject: "How was your Saga Elite order? Leave a review",
        html: buildEmailTemplate(
          "How was your order? Leave a review!",
          `<p>Hi ${greeting},</p>
           <p>Your Saga Elite order #${order._id} has been delivered. We hope you love ${productName}${
             itemCount > 1 ? ` and your other ${itemCount - 1} item(s)` : ""
           }!</p>
           <p>Your feedback helps other customers and helps us improve. It only takes a moment.</p>
           <p style="text-align:center;margin:24px 0;">
             <a href="${reviewUrl}"
               style="background:#D4AF37;color:#000;padding:12px 28px;border-radius:6px;font-weight:bold;text-decoration:none;display:inline-block;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
               Leave a Review
             </a>
           </p>
           <p>Thank you for shopping with Saga Elite.</p>`
        ),
      }).catch((err) => logger.error("[review-notify] Email failed", { error: err.message }));

      if (hasGift) {
        sendEmail({
          email: customer.email,
          subject: "Your Saga Elite surprise gift has been revealed",
          html: buildEmailTemplate(
            "Your surprise gift is revealed",
            `<p>Hi ${greeting},</p>
             <p>Your Saga Elite surprise gift has been revealed! Open your package and discover <strong>${escapeHtml(giftDescription)}</strong>.</p>
             <p>We hope the gift adds something special to your order.</p>
             <p>Thank you for shopping with Saga Elite.</p>`
          ),
        }).catch((err) => logger.error("[gift-notify] Email failed", { error: err.message }));
      }
    }

    const phone = cleanPhoneNumber(deliveredOrder?.contactNumber || order.contactNumber || "");
    if (phone) {
      sendWhatsAppMessage({
        to: phone,
        message:
          `Hi ${greeting}! Your Saga Elite order #${order._id} has been delivered.\n\n` +
          `We'd love to hear what you think. Leave a quick review:\n${reviewUrl}\n\n` +
          `Thank you.`,
      }).catch((err) => logger.error("[review-notify] WhatsApp failed", { error: err.message }));
    }

    await broadcastNotification({
      type: "admin",
      title: `Order ${order._id} status changed`,
      message: `Order ${order._id} is now ${order.status}.`,
      entityRef: order._id,
      entityType: "Order",
      meta: { orderId: order._id, status: order.status },
      filter: { role: "admin" },
    });
  }

  const fresh = await Order.findById(order._id);

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: fresh,
  });
});

/*
|--------------------------------------------------------------------------
| Refund Order (admin — gated by verifyPayments permission)
|--------------------------------------------------------------------------
*/
const refundOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { amount, reason, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid order id", 400));
  }

  const order = await Order.findById(id).populate("user", "email userName");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (!["delivered", "refund_requested"].includes(order.status)) {
    return next(
      new AppError(
        `Refunds are only available for delivered orders. Current status: ${order.status}`,
        409
      )
    );
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return next(new AppError("Refund amount must be a positive number", 400));
  }
  if (numericAmount > order.totalAmount) {
    return next(
      new AppError(
        `Refund amount (${numericAmount}) cannot exceed order total (${order.totalAmount})`,
        400
      )
    );
  }

  const normalizedReason = String(reason || "").toLowerCase().trim();
  if (!REFUND_REASONS.has(normalizedReason)) {
    return next(
      new AppError(
        `Refund reason must be one of: ${[...REFUND_REASONS].join(", ")}`,
        400
      )
    );
  }

  order.status = "refunded";
  order.refundAmount = numericAmount;
  order.refundReason = normalizedReason;
  order.refundNote = typeof note === "string" ? note.trim().slice(0, 1000) : "";
  order.refundedAt = new Date();
  order.refundedBy = req.userInfo?._id || req.userInfo?.id || null;

  await order.save({ validateModifiedOnly: true });

  // Customer email
  const customerEmail = order.user?.email || order.guestEmail;
  if (customerEmail) {
    sendEmail({
      to: customerEmail,
      subject: `Refund issued for your Saga Elite order ${order.referenceNumber || order._id}`,
      html: buildEmailTemplate(
        "Your refund is on its way",
        `<p>We have processed a refund of <strong>LKR ${numericAmount.toLocaleString("en-LK")}</strong> for your order <strong>${escapeHtml(order.referenceNumber || String(order._id))}</strong>.</p>
         <p><strong>Reason:</strong> ${escapeHtml(normalizedReason.replace(/_/g, " "))}</p>
         ${order.refundNote ? `<p><strong>Note:</strong> ${escapeHtml(order.refundNote)}</p>` : ""}
         <p>Refunds typically reflect on your original payment method within 5–10 business days. If you have any questions, reply to this email or message us on WhatsApp.</p>`
      ),
    }).catch((err) =>
      logger.error("Refund email notify failed", {
        orderId: order._id,
        error: err?.message,
      })
    );
  }

  // Socket emit
  const io = req.app.get("io");
  if (io) {
    io.emit("order:refresh", {
      orderId: order._id,
      status: order.status,
      refundAmount: numericAmount,
    });
  }

  res.status(200).json({
    success: true,
    message: "Order refunded successfully",
    data: await Order.findById(order._id),
  });
});

const getDashboardStats = catchAsync(async (req, res, next) => {
  const now = new Date();
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const revenueMatch = { status: { $ne: "cancelled" } };

  const [
    revenueSummary,
    totalOrders,
    activeOrders,
    totalProducts,
    totalCustomers,
    totalDrops,
    liveDrops,
    archivedDrops,
    lowStockProducts,
    statusBreakdownRaw,
    paymentMethodBreakdown,
    soldUnitsSummary,
    bestSellingProductDoc,
    mostWishedProductDoc,
    topProductsDocs,
    inventoryAlertsDocs,
    recentOrdersDocs,
    topDrops,
    salesTrendRaw,
    nextScheduledDropDoc,
    pendingReviewsCount,
    pendingPaymentsCount,
    agingProductsRaw,
  ] = await Promise.all([
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
            },
          },
          nonCancelledOrders: { $sum: 1 },
        },
      },
    ]),
    Order.countDocuments(),
    Order.countDocuments({
      status: { $in: ["pending", "pending_payment", "verification_pending", "confirmed", "shipped"] },
    }),
    Product.countDocuments(),
    User.countDocuments({ role: "user" }),
    Drop.countDocuments(),
    Drop.countDocuments({ isPublished: true, isArchived: false }),
    Drop.countDocuments({ isArchived: true }),
    Product.countDocuments({ isActive: true, totalStock: { $lte: 5 } }),
    Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0],
            },
          },
        },
      },
      { $sort: { count: -1, revenue: -1 } },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalSoldUnits: { $sum: "$soldCount" },
          totalWishlistAdds: { $sum: "$wishCount" },
          stockOnHand: { $sum: "$totalStock" },
        },
      },
    ]),
    Product.findOne({ soldCount: { $gt: 0 } })
      .sort({ soldCount: -1, wishCount: -1, createdAt: 1 })
      .select("name slug artNo soldCount wishCount totalStock discountPercent basePrice drop")
      .populate("drop", "name slug releaseDate isPublished isArchived")
      .lean(),
    Product.findOne({ wishCount: { $gt: 0 } })
      .sort({ wishCount: -1, soldCount: -1, createdAt: 1 })
      .select("name slug artNo soldCount wishCount totalStock discountPercent basePrice drop")
      .populate("drop", "name slug releaseDate isPublished isArchived")
      .lean(),
    Product.find({ soldCount: { $gt: 0 } })
      .sort({ soldCount: -1, wishCount: -1, totalStock: 1 })
      .limit(5)
      .select("name slug artNo soldCount wishCount totalStock discountPercent basePrice drop")
      .populate("drop", "name slug releaseDate isPublished isArchived")
      .lean(),
    Product.find({ isActive: true, totalStock: { $lte: 5 } })
      .sort({ totalStock: 1, soldCount: -1, wishCount: -1 })
      .limit(6)
      .select("name slug artNo totalStock soldCount wishCount drop")
      .populate("drop", "name slug")
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("_id totalAmount status paymentMethod paymentStatus createdAt items user")
      .populate("user", "email")
      .lean(),
    Product.aggregate([
      {
        $group: {
          _id: "$drop",
          productCount: { $sum: 1 },
          soldUnits: { $sum: "$soldCount" },
          totalWishlistAdds: { $sum: "$wishCount" },
          stockOnHand: { $sum: "$totalStock" },
        },
      },
      { $sort: { soldUnits: -1, totalWishlistAdds: -1, productCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "drops",
          localField: "_id",
          foreignField: "_id",
          as: "drop",
        },
      },
      {
        $unwind: {
          path: "$drop",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          dropId: "$_id",
          name: { $ifNull: ["$drop.name", "Independent Release"] },
          slug: "$drop.slug",
          releaseDate: "$drop.releaseDate",
          isPublished: "$drop.isPublished",
          isArchived: "$drop.isArchived",
          productCount: 1,
          soldUnits: 1,
          totalWishlistAdds: 1,
          stockOnHand: 1,
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Drop.findOne({
      releaseDate: { $gt: now },
      isArchived: false,
    })
      .sort({ releaseDate: 1 })
      .select("name slug releaseDate isPublished isArchived")
      .lean(),
    Review.countDocuments({ status: "pending" }),
    ManualPayment.countDocuments({ status: "proof_submitted" }),
    Product.find({
      isActive: true,
      $or: [
        { lastSoldAt: { $lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        { lastSoldAt: null, createdAt: { $lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      ],
    })
      .select("totalStock variants")
      .lean(),
  ]);

  const agingProductsCount = (agingProductsRaw || []).filter((p) => {
    if (typeof p.totalStock === "number" && p.totalStock > 0) return true;
    if (!Array.isArray(p.variants)) return false;
    return p.variants.some((v) => (v?.stock || 0) > 0);
  }).length;

  const revenueStats = revenueSummary[0] || {
    totalRevenue: 0,
    completedRevenue: 0,
    nonCancelledOrders: 0,
  };
  const soldUnitsStats = soldUnitsSummary[0] || {
    totalSoldUnits: 0,
    totalWishlistAdds: 0,
    stockOnHand: 0,
  };

  const statusBreakdown = DASHBOARD_ORDER_STATUSES.reduce((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});

  statusBreakdownRaw.forEach((entry) => {
    if (entry?._id) {
      statusBreakdown[entry._id] = entry.count;
    }
  });

  let nextScheduledDrop = null;

  if (nextScheduledDropDoc) {
    const nextDropProductCount = await Product.countDocuments({
      drop: nextScheduledDropDoc._id,
      isActive: true,
    });

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilRelease = Math.max(
      0,
      Math.ceil((new Date(nextScheduledDropDoc.releaseDate).getTime() - now.getTime()) / msPerDay),
    );

    nextScheduledDrop = {
      ...nextScheduledDropDoc,
      productCount: nextDropProductCount,
      daysUntilRelease,
    };
  }

  const recentOrders = recentOrdersDocs.map((order) => ({
    _id: order._id,
    customerEmail: order.user?.email || "Unknown customer",
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
    createdAt: order.createdAt,
  }));

  const topProducts = topProductsDocs.map((product) => ({
    ...product,
    dropName: product.drop?.name || "Independent Release",
    dropSlug: product.drop?.slug || null,
  }));

  const inventoryAlerts = inventoryAlertsDocs.map((product) => ({
    ...product,
    dropName: product.drop?.name || "Independent Release",
    dropSlug: product.drop?.slug || null,
  }));

  const paymentMix = paymentMethodBreakdown.map((entry) => ({
    method: entry._id,
    count: entry.count,
    revenue: entry.revenue,
  }));

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalRevenue: revenueStats.totalRevenue,
        completedRevenue: revenueStats.completedRevenue,
        totalOrders,
        activeOrders,
        totalProducts,
        totalCustomers,
        totalDrops,
        liveDrops,
        archivedDrops,
        lowStockProducts,
        pendingVerification: (statusBreakdown.pending_payment || 0) + (statusBreakdown.verification_pending || 0),
        deliveredOrders: statusBreakdown.delivered || 0,
        totalSoldUnits: soldUnitsStats.totalSoldUnits,
        totalWishlistAdds: soldUnitsStats.totalWishlistAdds,
        stockOnHand: soldUnitsStats.stockOnHand,
        averageOrderValue: revenueStats.nonCancelledOrders
          ? revenueStats.totalRevenue / revenueStats.nonCancelledOrders
          : 0,
        pendingReviews: pendingReviewsCount || 0,
        pendingPayments: pendingPaymentsCount || 0,
        agingProductsCount,
      },
      highlights: {
        bestSellingProduct: bestSellingProductDoc,
        mostWishedProduct: mostWishedProductDoc,
        topDrop: topDrops[0] || null,
        nextScheduledDrop,
      },
      orderStatusBreakdown: statusBreakdown,
      paymentMethodBreakdown: paymentMix,
      salesTrend: buildSalesTrend(salesTrendRaw),
      topProducts,
      topDrops,
      inventoryAlerts,
      recentOrders,
    },
  });
});

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  refundOrder,
  getDashboardStats,
};