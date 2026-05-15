const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Coupon = require("../Models/Coupon");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const User = require("../Models/User");
const UserCoupon = require("../Models/UserCoupon");
const filterObj = require("../Utils/filter-object");
const { ensureWelcomeReward, SOURCE_LABELS } = require("../Utils/reward-service");

const CREATE_FIELDS = [
  "code",
  "description",
  "discountType",
  "discountValue",
  "minOrderValue",
  "maxUses",
  "applicableProducts",
  "applicableCategories",
  "startsAt",
  "endsAt",
  "isActive",
  "issuedFor",
  "perUserLimit",
  "maxDiscountAmount",
  "firstOrderOnly",
  "stackable",
  "autoApply",
  "isPersonalized",
  "eligibleMemberships",
];

const UPDATE_FIELDS = CREATE_FIELDS.filter((f) => f !== "code"); // code is immutable post-create

/*
|--------------------------------------------------------------------------
| Internal: validate a coupon against an order subtotal + line items.
| Returns { coupon, discount } when valid, or throws AppError.
|--------------------------------------------------------------------------
*/
const evaluateCoupon = async ({
  code,
  subtotal,
  productIds = [],
  userId = null,
  user = null,
  session = null,
} = {}) => {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  const couponQuery = Coupon.findOne({ code: upper });
  if (session) couponQuery.session(session);
  const coupon = await couponQuery;
  if (!coupon) {
    throw new AppError(`Coupon "${upper}" not found`, 404);
  }

  if (!coupon.isActive) {
    throw new AppError("Coupon is not active", 400);
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    throw new AppError("Coupon is not yet valid", 400);
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) {
    throw new AppError("Coupon has expired", 400);
  }

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    throw new AppError(
      `Minimum order value of LKR ${coupon.minOrderValue} required`,
      400
    );
  }

  const resolvedUserId = userId || user?._id || user?.id || null;
  let ownerRecord = null;

  if (resolvedUserId) {
    const ownerQuery = UserCoupon.findOne({
      user: resolvedUserId,
      coupon: coupon._id,
    });
    if (session) ownerQuery.session(session);
    ownerRecord = await ownerQuery;
  }

  if (coupon.isPersonalized && !ownerRecord) {
    throw new AppError("This reward is reserved for another account", 403);
  }

  if (ownerRecord?.redeemed) {
    throw new AppError("This reward has already been redeemed", 400);
  }

  if (
    ownerRecord?.expiresAt &&
    new Date(ownerRecord.expiresAt).getTime() < Date.now()
  ) {
    throw new AppError("This reward has expired", 400);
  }

  if (coupon.firstOrderOnly) {
    if (!resolvedUserId) {
      throw new AppError("Please sign in to use this first-order reward", 401);
    }
    const orderCount = await Order.countDocuments({
      user: resolvedUserId,
      status: { $nin: ["cancelled", "refunded"] },
    });
    if (orderCount > 0) {
      throw new AppError("This coupon is only valid on your first order", 400);
    }
  }

  if (Array.isArray(coupon.eligibleMemberships) && coupon.eligibleMemberships.length > 0) {
    let member = user;
    if (!member && resolvedUserId) {
      const userQuery = User.findById(resolvedUserId).select("membership");
      if (session) userQuery.session(session);
      member = await userQuery;
    }
    if (!member || !coupon.eligibleMemberships.includes(member.membership)) {
      throw new AppError("This coupon is reserved for a different membership tier", 403);
    }
  }

  if (coupon.perUserLimit != null) {
    if (!resolvedUserId) {
      throw new AppError("Please sign in to use this limited reward", 401);
    }
    const usedByUser = await Order.countDocuments({
      user: resolvedUserId,
      couponCode: coupon.code,
      status: { $nin: ["cancelled", "refunded"] },
    });
    if (usedByUser >= coupon.perUserLimit) {
      throw new AppError("You have already used this coupon", 400);
    }
  }

  // Product / category restrictions: if either list is non-empty, at least
  // one cart product must satisfy.
  const hasProductRestriction =
    Array.isArray(coupon.applicableProducts) &&
    coupon.applicableProducts.length > 0;
  const hasCategoryRestriction =
    Array.isArray(coupon.applicableCategories) &&
    coupon.applicableCategories.length > 0;

  if (hasProductRestriction || hasCategoryRestriction) {
    const idStrings = (productIds || []).map((p) => String(p));
    if (hasProductRestriction) {
      const allowedIds = coupon.applicableProducts.map((id) => String(id));
      const matches = idStrings.some((id) => allowedIds.includes(id));
      if (!matches && !hasCategoryRestriction) {
        throw new AppError("Coupon not applicable to selected products", 400);
      }
      if (matches) {
        // good
      } else if (hasCategoryRestriction) {
        // fall through to category check
      }
    }
    if (hasCategoryRestriction) {
      const products = await Product.find({
        _id: { $in: idStrings },
      })
        .select("category")
        .lean();
      const categories = products.map((p) => p.category);
      const matches = categories.some((c) =>
        coupon.applicableCategories.includes(c)
      );
      const productMatched =
        hasProductRestriction &&
        idStrings.some((id) =>
          coupon.applicableProducts.map(String).includes(id)
        );
      if (!matches && !productMatched) {
        throw new AppError(
          "Coupon not applicable to selected categories",
          400
        );
      }
    }
  }

  // Compute discount value (cap to subtotal so we never go negative)
  let discount = 0;
  if (coupon.discountType === "percent") {
    discount = Math.round(subtotal * (coupon.discountValue / 100));
  } else {
    discount = Math.round(coupon.discountValue);
  }
  if (coupon.maxDiscountAmount != null && discount > coupon.maxDiscountAmount) {
    discount = Math.round(coupon.maxDiscountAmount);
  }
  if (discount > subtotal) discount = subtotal;

  return { coupon, discount, userCoupon: ownerRecord };
};

/*
|--------------------------------------------------------------------------
| Public — validate (preview) a coupon for the checkout UI
|--------------------------------------------------------------------------
*/
const validateCoupon = catchAsync(async (req, res, next) => {
  const { code, subtotal, productIds } = req.body;
  if (!code) return next(new AppError("Coupon code is required", 400));
  if (typeof subtotal !== "number" || subtotal < 0) {
    return next(new AppError("Valid subtotal required", 400));
  }

  try {
    const result = await evaluateCoupon({
      code,
      subtotal,
      productIds: productIds || [],
      userId: req.userInfo?._id || req.userInfo?.id || null,
      user: req.userInfo || null,
    });
    if (!result) return next(new AppError("Coupon code is required", 400));

    res.status(200).json({
      success: true,
      data: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        discount: result.discount,
        finalTotal: subtotal - result.discount,
        isPersonalized: Boolean(result.coupon.isPersonalized),
        source: result.userCoupon?.source || result.coupon.issuedFor,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/*
|--------------------------------------------------------------------------
| Admin — list / create / update / delete
|--------------------------------------------------------------------------
*/
const serializeCouponStatus = (coupon) => {
  const now = Date.now();
  const startsAt = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null;
  const endsAt = coupon.endsAt ? new Date(coupon.endsAt).getTime() : null;
  const maxUses = coupon.maxUses;
  const usedCount = coupon.usedCount || 0;
  const isExhausted = maxUses != null && usedCount >= maxUses;
  const isLive =
    Boolean(coupon.isActive) &&
    !isExhausted &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt >= now);

  return {
    ...coupon,
    isExhausted,
    isLive,
  };
};

const listAdminCoupons = catchAsync(async (_req, res) => {
  const coupons = await Coupon.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "email")
    .populate("applicableProducts", "name slug")
    .lean();

  res.status(200).json({
    success: true,
    data: { coupons: coupons.map(serializeCouponStatus), count: coupons.length },
  });
});

const createCoupon = catchAsync(async (req, res, next) => {
  const data = filterObj(req.body, ...CREATE_FIELDS);

  const existing = await Coupon.findOne({ code: data.code });
  if (existing) {
    return next(new AppError(`Coupon code ${data.code} already exists`, 409));
  }

  data.createdBy = req.userInfo?._id || req.userInfo?.id || null;

  const coupon = await Coupon.create(data);
  res.status(201).json({
    success: true,
    message: "Coupon created",
    data: { coupon },
  });
});

const updateCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid coupon id", 400));
  }
  const update = filterObj(req.body, ...UPDATE_FIELDS);
  const coupon = await Coupon.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return next(new AppError("Coupon not found", 404));
  res.status(200).json({
    success: true,
    message: "Coupon updated",
    data: { coupon },
  });
});

const deleteCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid coupon id", 400));
  }
  const coupon = await Coupon.findById(id);
  if (!coupon) return next(new AppError("Coupon not found", 404));
  if (coupon.usedCount > 0) {
    return next(
      new AppError(
        "Coupon has been used. Deactivate it instead of deleting.",
        409
      )
    );
  }
  await coupon.deleteOne();
  res.status(200).json({
    success: true,
    message: "Coupon deleted",
    data: { id },
  });
});

const serializeUserCoupon = (record) => {
  const coupon = record.coupon || {};
  const expiresAt = record.expiresAt || coupon.endsAt || null;
  const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const status = record.redeemed ? "redeemed" : expired ? "expired" : "available";

  return {
    id: record._id,
    code: record.code || coupon.code,
    source: record.source,
    sourceLabel: SOURCE_LABELS[record.source] || "Member reward",
    status,
    assignedAt: record.assignedAt,
    expiresAt,
    redeemedAt: record.redeemedAt,
    metadata: record.metadata || {},
    coupon: coupon?._id
      ? {
          id: coupon._id,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue || 0,
          maxDiscountAmount: coupon.maxDiscountAmount,
          firstOrderOnly: Boolean(coupon.firstOrderOnly),
          eligibleMemberships: coupon.eligibleMemberships || [],
        }
      : null,
  };
};

const listMyRewards = catchAsync(async (req, res) => {
  await ensureWelcomeReward(req.userInfo);

  const rewards = await UserCoupon.find({ user: req.userInfo._id })
    .sort({ redeemed: 1, expiresAt: 1, assignedAt: -1 })
    .populate("coupon")
    .lean({ virtuals: true });

  const serialized = rewards.map(serializeUserCoupon);
  res.status(200).json({
    success: true,
    data: {
      rewards: serialized,
      availableCount: serialized.filter((reward) => reward.status === "available").length,
    },
  });
});

module.exports = {
  validateCoupon,
  listAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listMyRewards,
  evaluateCoupon, // exported for the order controller hook
};
