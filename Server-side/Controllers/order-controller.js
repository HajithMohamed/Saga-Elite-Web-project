const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const User = require("../Models/User");

const createOrder = catchAsync(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    contactNumber,
    paymentMethod,
    receiptInfo,
    notes,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Order items are required", 400));
  }

  if (!shippingAddress || !shippingAddress.trim()) {
    return next(new AppError("Shipping address is required", 400));
  }

  if (!contactNumber || !contactNumber.trim()) {
    return next(new AppError("Contact number is required", 400));
  }

if (!paymentMethod || !["payhere", "gpay", "manual", "card", "lankapay", "cash"].includes(paymentMethod)) {
    return next(new AppError("Invalid payment method", 400));
  }

  if (paymentMethod === "receipt" && !receiptInfo?.trim()) {
    return next(new AppError("Receipt information is required for WhatsApp payment", 400));
  }

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
            { $match: { user: req.userInfo._id } },
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

        const unitPrice = product.basePrice + (variant.priceAdjustment || 0);
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

      const orderPayload = {
        user: req.userInfo._id,
        items: orderItems,
        totalAmount,
        shippingAddress: shippingAddress.trim(),
        contactNumber: contactNumber.trim(),
        paymentMethod,
        receiptInfo: paymentMethod === "receipt" ? receiptInfo.trim() : undefined,
        notes: notes?.trim(),
        status: paymentMethod === "receipt" ? "pending" : "confirmed",
        paymentStatus: paymentMethod === "receipt" ? "pending" : "paid",
      };

      const [orderDocument] = await Order.create([orderPayload], { session });
      createdOrder = orderDocument;

      const user = await User.findById(req.userInfo._id).session(session);
      if (user) {
        user.cart = [];
        await user.save({ session, validateModifiedOnly: true });
      }
    });
  } finally {
    session.endSession();
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: createdOrder,
  });
});

const getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.userInfo._id })
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
    .populate("user", "email role")
    .lean();

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (!order.user._id.equals(req.userInfo._id) && req.userInfo.role !== "admin") {
    return next(new AppError("You are not authorized to view this order", 403));
  }

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: order,
  });
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  if (!status || !allowedStatuses.includes(status)) {
    return next(new AppError("Invalid order status", 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.status = status;
  if (status === "confirmed" && order.paymentMethod === "receipt") {
    order.paymentStatus = "paid";
  }

  await order.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: order,
  });
});

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
