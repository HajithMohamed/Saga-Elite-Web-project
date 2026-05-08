const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Coupon = require("../Models/Coupon");
const Product = require("../Models/Product");
const filterObj = require("../Utils/filter-object");

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
];

const UPDATE_FIELDS = CREATE_FIELDS.filter((f) => f !== "code"); // code is immutable post-create

/*
|--------------------------------------------------------------------------
| Internal: validate a coupon against an order subtotal + line items.
| Returns { coupon, discount } when valid, or throws AppError.
|--------------------------------------------------------------------------
*/
const evaluateCoupon = async ({ code, subtotal, productIds = [] }) => {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: upper });
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
  if (discount > subtotal) discount = subtotal;

  return { coupon, discount };
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
const listAdminCoupons = catchAsync(async (_req, res) => {
  const coupons = await Coupon.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "email")
    .populate("applicableProducts", "name slug")
    .lean();

  res.status(200).json({
    success: true,
    data: { coupons, count: coupons.length },
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

module.exports = {
  validateCoupon,
  listAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  evaluateCoupon, // exported for the order controller hook
};
