const mongoose = require("mongoose");
const validator = require("validator");
const AppError = require("../Utils/appError");

const PRODUCT_CATEGORIES = ["Ladies", "Gents", "Unisex"];
const PAYMENT_METHODS = ["payhere", "gpay", "manual", "manual_bank_transfer", "card", "lankapay", "cash"];
const ORDER_STATUSES = ["pending", "pending_payment", "verification_pending", "confirmed", "shipped", "delivered", "cancelled", "refund_requested", "refunded"];
const NOTIFICATION_TYPES = ["drop", "offer", "order", "admin", "reminder", "system"];
const IMAGE_REF_MODELS = ["Product", "Drop", "System", "Review"];
const IMAGE_SYSTEM_TYPES = ["hero", "ad", "logo", "category-logo"];
const CONTACT_STATUSES = ["new", "read", "resolved"];
const ADMIN_PERMISSION_KEYS = ["products", "orders", "users", "notifications", "drops", "verifyPayments", "manageReviews", "viewAnalytics", "sendCampaigns", "manageInventory", "manageAdmins"];
const ADMIN_ROLE_VALUES = ["admin", "sub_admin"];
const SUB_ROLE_VALUES = ["order_manager", "product_manager", "marketing_manager", "support_admin", "inventory_manager"];

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const createValidationMiddleware = (validatorFn) => (req, res, next) => {
  try {
    validatorFn(req);
    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
      req.body = Object.fromEntries(
        Object.entries(req.body).filter(([, value]) => value !== undefined)
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

const fail = (message, statusCode = 400) => {
  throw new AppError(message, statusCode);
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const sanitizeString = (value, field, { required = false, maxLength, minLength } = {}) => {
  if (value === undefined || value === null) {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = value.trim();

  if (required && !normalized) {
    fail(`${field} is required`);
  }

  if (minLength && normalized.length < minLength) {
    fail(`${field} must be at least ${minLength} characters`);
  }

  if (maxLength && normalized.length > maxLength) {
    fail(`${field} must be ${maxLength} characters or fewer`);
  }

  return normalized;
};

const sanitizeOptionalPlainText = (value, field, { maxLength, minLength } = {}) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = value.trim();

  if (minLength && normalized.length < minLength) {
    fail(`${field} must be at least ${minLength} characters`);
  }

  if (maxLength && normalized.length > maxLength) {
    fail(`${field} must be ${maxLength} characters or fewer`);
  }

  return normalized;
};

const sanitizeEmail = (value, field = "email", { required = true } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = validator.normalizeEmail(value.trim(), { gmail_remove_dots: false });
  if (!normalized || !validator.isEmail(normalized)) {
    fail(`Please provide a valid ${field}`);
  }

  return normalized;
};

const sanitizePassword = (value, field = "password", { required = true } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = value.trim();

  if (!passwordPattern.test(normalized)) {
    fail(`${field} must include uppercase, lowercase, number, special character, and be at least 8 characters`);
  }

  return normalized;
};

const sanitizeObjectId = (value, field) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    fail(`Valid ${field} is required`);
  }

  return String(value);
};

const sanitizeNumber = (value, field, { required = false, min, max, integer = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    fail(`${field} must be a valid number`);
  }

  if (integer && !Number.isInteger(normalized)) {
    fail(`${field} must be an integer`);
  }

  if (min !== undefined && normalized < min) {
    fail(`${field} must be at least ${min}`);
  }

  if (max !== undefined && normalized > max) {
    fail(`${field} must be ${max} or less`);
  }

  return normalized;
};

const sanitizeBoolean = (value, field, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  fail(`${field} must be a boolean`);
};

const sanitizeEnum = (value, allowedValues, field, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = value.trim();
  if (!allowedValues.includes(normalized)) {
    fail(`${field} must be one of: ${allowedValues.join(", ")}`);
  }

  return normalized;
};

const sanitizeDate = (value, field, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string" && !(value instanceof Date)) {
    fail(`${field} must be a valid date`);
  }

  const normalized = value instanceof Date ? value.toISOString() : String(value).trim();
  if (!validator.isISO8601(normalized)) {
    fail(`${field} must be a valid ISO date`);
  }

  return new Date(normalized);
};

const sanitizeUrl = (value, field, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = value.trim();
  if (!validator.isURL(normalized, { require_protocol: true })) {
    fail(`${field} must be a valid URL`);
  }

  return normalized;
};

const sanitizePermissions = (permissions, { required = false } = {}) => {
  if (permissions === undefined || permissions === null) {
    if (required) fail("permissions is required");
    return undefined;
  }

  if (typeof permissions !== "object" || Array.isArray(permissions)) {
    fail("permissions must be an object");
  }

  const normalized = {};
  for (const key of Object.keys(permissions)) {
    if (!ADMIN_PERMISSION_KEYS.includes(key)) {
      fail(`Unsupported permission key: ${key}`);
    }
    normalized[key] = sanitizeBoolean(permissions[key], `permissions.${key}`, { required: true });
  }

  return normalized;
};

const sanitizeVariants = (variants, { required = false } = {}) => {
  if (variants === undefined || variants === null) {
    if (required) fail("variants is required");
    return undefined;
  }

  if (!Array.isArray(variants) || variants.length === 0) {
    fail("variants must be a non-empty array");
  }

  return variants.map((variant, index) => {
    if (!variant || typeof variant !== "object") {
      fail(`variants[${index}] must be an object`);
    }

    return {
      sku: sanitizeString(variant.sku, `variants[${index}].sku`, { required: true, maxLength: 50 }),
      size: sanitizeString(variant.size, `variants[${index}].size`, { required: true, maxLength: 20 }),
      color: sanitizeString(variant.color, `variants[${index}].color`, { required: true, maxLength: 30 }),
      stock: sanitizeNumber(variant.stock, `variants[${index}].stock`, { required: true, min: 0, integer: true }),
      priceAdjustment: sanitizeNumber(variant.priceAdjustment ?? 0, `variants[${index}].priceAdjustment`, { min: 0 }),
    };
  });
};

const sanitizeImageOrders = (imageOrders) => {
  if (!Array.isArray(imageOrders) || imageOrders.length === 0) {
    fail("imageOrders must be a non-empty array");
  }

  return imageOrders.map((entry, index) => ({
    imageId: sanitizeObjectId(entry.imageId, `imageOrders[${index}].imageId`),
    order: sanitizeNumber(entry.order, `imageOrders[${index}].order`, { required: true, integer: true, min: 0 }),
  }));
};

const sanitizeReviewImages = (images) => {
  if (images === undefined) return undefined;

  if (!Array.isArray(images)) {
    fail("images must be an array");
  }

  if (images.length > 3) {
    fail("You can upload up to 3 images");
  }

  return images.map((image, index) => sanitizeUrl(image, `images[${index}]`, { required: true }));
};

const sanitizeOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    fail("items must be a non-empty array");
  }

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      fail(`items[${index}] must be an object`);
    }

    return {
      productId: sanitizeObjectId(item.productId, `items[${index}].productId`),
      variantSku: sanitizeString(item.variantSku, `items[${index}].variantSku`, { required: true, maxLength: 50 }),
      size: sanitizeOptionalPlainText(item.size, `items[${index}].size`, { maxLength: 20 }),
      color: sanitizeOptionalPlainText(item.color, `items[${index}].color`, { maxLength: 30 }),
      quantity: sanitizeNumber(item.quantity, `items[${index}].quantity`, { required: true, min: 1, integer: true }),
    };
  });
};

const validateObjectIdParam = (paramName, label = paramName) =>
  createValidationMiddleware((req) => {
    req.params[paramName] = sanitizeObjectId(req.params[paramName], label);
  });

const validateAuthRegister = createValidationMiddleware((req) => {
  const email = sanitizeEmail(req.body.email);
  const password = sanitizePassword(req.body.password);
  const confirmPassword = sanitizePassword(req.body.confirmPassword, "confirmPassword");
  const phoneNumber = sanitizeString(req.body.phoneNumber, "phoneNumber", { maxLength: 20 });
  const username = sanitizeOptionalPlainText(req.body.username, "username", { maxLength: 120 });

  req.body = { email, password, confirmPassword, phoneNumber: phoneNumber || undefined, username };
});

const validateAuthLogin = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    password: sanitizeString(req.body.password, "password", { required: true, minLength: 8, maxLength: 128 }),
  };
});

const validateOtpVerify = createValidationMiddleware((req) => {
  req.body = {
    otp: sanitizeString(req.body.otp, "otp", { required: true, minLength: 4, maxLength: 10 }),
    userId: sanitizeObjectId(req.body.userId, "userId"),
  };
});

const validateEmailOnly = createValidationMiddleware((req) => {
  req.body = { email: sanitizeEmail(req.body.email) };
});

const validateChangePassword = createValidationMiddleware((req) => {
  req.body = {
    oldPassword: sanitizeOptionalPlainText(req.body.oldPassword, "oldPassword", { minLength: 8, maxLength: 128 }),
    newPassword: sanitizePassword(req.body.newPassword, "newPassword"),
    passwordConfirm: sanitizePassword(req.body.passwordConfirm, "passwordConfirm"),
  };
});

const validateVerifyResetOtp = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    otp: sanitizeString(req.body.otp, "otp", { required: true, minLength: 4, maxLength: 10 }),
  };
});

const validateResetPassword = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    otp: sanitizeString(req.body.otp, "otp", { required: true, minLength: 4, maxLength: 10 }),
    newPassword: sanitizePassword(req.body.newPassword, "newPassword"),
    confirmPassword: sanitizePassword(req.body.confirmPassword, "confirmPassword"),
  };
});

const validateGoogleAuth = createValidationMiddleware((req) => {
  req.body = {
    accessToken: sanitizeString(req.body.accessToken, "accessToken", { required: true, minLength: 10, maxLength: 4096 }),
  };
});

const validateFacebookAuth = createValidationMiddleware((req) => {
  req.body = {
    accessToken: sanitizeString(req.body.accessToken, "accessToken", { required: true, minLength: 10, maxLength: 4096 }),
  };
});

const validateContactSubmission = createValidationMiddleware((req) => {
  req.body = {
    name: sanitizeString(req.body.name, "name", { required: true, minLength: 2, maxLength: 120 }),
    email: sanitizeEmail(req.body.email),
    subject: sanitizeString(req.body.subject, "subject", { required: true, minLength: 3, maxLength: 150 }),
    message: sanitizeOptionalPlainText(req.body.message, "message", { required: true, minLength: 10, maxLength: 500 }),
  };
});

const validateContactUpdate = createValidationMiddleware((req) => {
  req.body = {
    status: sanitizeEnum(req.body.status, CONTACT_STATUSES, "status", { required: false }),
    respondedAt: req.body.respondedAt ? sanitizeDate(req.body.respondedAt, "respondedAt") : undefined,
  };
});

const validateDropCreate = createValidationMiddleware((req) => {
  const releaseDate = sanitizeDate(req.body.releaseDate, "releaseDate", { required: true });
  const endDate = req.body.endDate ? sanitizeDate(req.body.endDate, "endDate") : undefined;

  if (endDate && endDate <= releaseDate) {
    fail("endDate must be after releaseDate");
  }

  req.body = {
    name: sanitizeString(req.body.name, "name", { required: true, minLength: 3, maxLength: 200 }),
    description: sanitizeOptionalPlainText(req.body.description, "description", { maxLength: 2000 }),
    releaseDate,
    endDate,
    isPublished: req.body.isPublished !== undefined
      ? sanitizeBoolean(req.body.isPublished, "isPublished")
      : undefined,
    isArchived: req.body.isArchived !== undefined
      ? sanitizeBoolean(req.body.isArchived, "isArchived")
      : undefined,
  };
});

const validateDropUpdate = createValidationMiddleware((req) => {
  const body = {};

  if (req.body.name !== undefined) body.name = sanitizeString(req.body.name, "name", { required: true, minLength: 3, maxLength: 200 });
  if (req.body.description !== undefined) body.description = sanitizeOptionalPlainText(req.body.description, "description", { maxLength: 2000 });
  if (req.body.releaseDate !== undefined) body.releaseDate = sanitizeDate(req.body.releaseDate, "releaseDate", { required: true });
  if (req.body.endDate !== undefined) {
    body.endDate =
      req.body.endDate === null || req.body.endDate === ""
        ? null
        : sanitizeDate(req.body.endDate, "endDate");
  }
  if (req.body.isPublished !== undefined) body.isPublished = sanitizeBoolean(req.body.isPublished, "isPublished");
  if (req.body.isArchived !== undefined) body.isArchived = sanitizeBoolean(req.body.isArchived, "isArchived");

  if (!Object.keys(body).length) {
    fail("At least one field is required to update");
  }

  if (body.releaseDate && body.endDate && body.endDate <= body.releaseDate) {
    fail("endDate must be after releaseDate");
  }

  req.body = body;
});

const validateProductCreate = createValidationMiddleware((req) => {
  const tags = Array.isArray(req.body.tags)
    ? req.body.tags.map((tag, index) => sanitizeString(tag, `tags[${index}]`, { required: true, maxLength: 40 }))
    : [];
  const relatedProductIds = Array.isArray(req.body.relatedProductIds)
    ? req.body.relatedProductIds.map((id, index) => sanitizeObjectId(id, `relatedProductIds[${index}]`))
    : [];

  req.body = {
    name: sanitizeString(req.body.name, "name", { required: true, minLength: 3, maxLength: 200 }),
    artNo: sanitizeString(req.body.artNo, "artNo", { required: true, minLength: 2, maxLength: 50 }),
    description: sanitizeOptionalPlainText(req.body.description, "description", { maxLength: 2000 }),
    brand: sanitizeString(req.body.brand, "brand", { required: true, minLength: 2, maxLength: 100 }),
    category: sanitizeEnum(req.body.category, PRODUCT_CATEGORIES, "category", { required: true }),
    drop: req.body.drop ? sanitizeObjectId(req.body.drop, "drop") : null,
    basePrice: sanitizeNumber(req.body.basePrice, "basePrice", { required: true, min: 0 }),
    originalPrice: sanitizeNumber(req.body.originalPrice ?? req.body.basePrice, "originalPrice", { min: 0 }),
    salePrice: sanitizeNumber(req.body.salePrice ?? req.body.basePrice, "salePrice", { min: 0 }),
    discountPercent: sanitizeNumber(req.body.discountPercent ?? 0, "discountPercent", { min: 0, max: 100 }),
    costPrice: sanitizeNumber(req.body.costPrice, "costPrice", { min: 0 }),
    categoryPath: sanitizeOptionalPlainText(req.body.categoryPath, "categoryPath", { maxLength: 180 }),
    tags,
    relatedProductIds,
    trendScore: sanitizeNumber(req.body.trendScore ?? 0, "trendScore", { min: 0 }),
    isDeal: sanitizeBoolean(req.body.isDeal ?? false, "isDeal"),
    dealEndsAt: req.body.dealEndsAt ? sanitizeDate(req.body.dealEndsAt, "dealEndsAt") : undefined,
    isFeatured: sanitizeBoolean(req.body.isFeatured ?? false, "isFeatured"),
    isActive: sanitizeBoolean(req.body.isActive ?? true, "isActive"),
    isLimited: sanitizeBoolean(req.body.isLimited ?? false, "isLimited"),
    maxPerUser: sanitizeNumber(req.body.maxPerUser, "maxPerUser", { min: 1, integer: true }),
    lowStockThreshold:
      req.body.lowStockThreshold === undefined ||
      req.body.lowStockThreshold === null ||
      req.body.lowStockThreshold === ""
        ? undefined
        : sanitizeNumber(req.body.lowStockThreshold, "lowStockThreshold", { min: 0, integer: true }),
    variants: sanitizeVariants(req.body.variants, { required: true }),
  };
});

const validateProductUpdate = createValidationMiddleware((req) => {
  const body = {};

  if (req.body.name !== undefined) body.name = sanitizeString(req.body.name, "name", { required: true, minLength: 3, maxLength: 200 });
  if (req.body.description !== undefined) body.description = sanitizeOptionalPlainText(req.body.description, "description", { maxLength: 2000 });
  if (req.body.brand !== undefined) body.brand = sanitizeString(req.body.brand, "brand", { required: true, minLength: 2, maxLength: 100 });
  if (req.body.category !== undefined) body.category = sanitizeEnum(req.body.category, PRODUCT_CATEGORIES, "category", { required: true });
  if (req.body.drop !== undefined) body.drop = req.body.drop ? sanitizeObjectId(req.body.drop, "drop") : null;
  if (req.body.basePrice !== undefined) body.basePrice = sanitizeNumber(req.body.basePrice, "basePrice", { min: 0 });
  if (req.body.originalPrice !== undefined) body.originalPrice = sanitizeNumber(req.body.originalPrice, "originalPrice", { min: 0 });
  if (req.body.salePrice !== undefined) body.salePrice = sanitizeNumber(req.body.salePrice, "salePrice", { min: 0 });
  if (req.body.discountPercent !== undefined) body.discountPercent = sanitizeNumber(req.body.discountPercent, "discountPercent", { min: 0, max: 100 });
  if (req.body.costPrice !== undefined) body.costPrice = sanitizeNumber(req.body.costPrice, "costPrice", { min: 0 });
  if (req.body.categoryPath !== undefined) body.categoryPath = sanitizeOptionalPlainText(req.body.categoryPath, "categoryPath", { maxLength: 180 });
  if (req.body.tags !== undefined) {
    if (!Array.isArray(req.body.tags)) fail("tags must be an array");
    body.tags = req.body.tags.map((tag, index) => sanitizeString(tag, `tags[${index}]`, { required: true, maxLength: 40 }));
  }
  if (req.body.relatedProductIds !== undefined) {
    if (!Array.isArray(req.body.relatedProductIds)) fail("relatedProductIds must be an array");
    body.relatedProductIds = req.body.relatedProductIds.map((id, index) => sanitizeObjectId(id, `relatedProductIds[${index}]`));
  }
  if (req.body.trendScore !== undefined) body.trendScore = sanitizeNumber(req.body.trendScore, "trendScore", { min: 0 });
  if (req.body.isDeal !== undefined) body.isDeal = sanitizeBoolean(req.body.isDeal, "isDeal");
  if (req.body.dealEndsAt !== undefined) body.dealEndsAt = sanitizeDate(req.body.dealEndsAt, "dealEndsAt");
  if (req.body.isFeatured !== undefined) body.isFeatured = sanitizeBoolean(req.body.isFeatured, "isFeatured");
  if (req.body.isActive !== undefined) body.isActive = sanitizeBoolean(req.body.isActive, "isActive");
  if (req.body.maxPerUser !== undefined) body.maxPerUser = sanitizeNumber(req.body.maxPerUser, "maxPerUser", { min: 1, integer: true });
  if (req.body.isLimited !== undefined) body.isLimited = sanitizeBoolean(req.body.isLimited, "isLimited");
  if (req.body.lowStockThreshold !== undefined) {
    body.lowStockThreshold =
      req.body.lowStockThreshold === null || req.body.lowStockThreshold === ""
        ? null
        : sanitizeNumber(req.body.lowStockThreshold, "lowStockThreshold", { min: 0, integer: true });
  }
  if (req.body.variants !== undefined) body.variants = sanitizeVariants(req.body.variants, { required: true });

  if (!Object.keys(body).length) {
    fail("At least one field is required to update");
  }

  req.body = body;
});

const COUPON_DISCOUNT_TYPES = ["percent", "fixed"];
const COUPON_ISSUED_FOR = [
  "manual",
  "campaign",
  "vip",
  "review_reward",
  "referral",
  "birthday",
];

const sanitizeCouponPayload = (body, { isUpdate = false } = {}) => {
  const out = {};

  if (!isUpdate) {
    const code = sanitizeString(body.code, "code", {
      required: true,
      minLength: 3,
      maxLength: 40,
    });
    out.code = code.toUpperCase();
  }

  if (body.description !== undefined) {
    out.description = sanitizeOptionalPlainText(body.description, "description", {
      maxLength: 200,
    });
  }

  const discountType = sanitizeEnum(
    body.discountType,
    COUPON_DISCOUNT_TYPES,
    "discountType",
    { required: !isUpdate }
  );
  if (discountType !== undefined) out.discountType = discountType;

  if (body.discountValue !== undefined || !isUpdate) {
    const value = sanitizeNumber(body.discountValue, "discountValue", {
      required: !isUpdate,
      min: 0,
    });
    if (value !== undefined) {
      const effectiveType = discountType || body.discountType;
      if (effectiveType === "percent" && value > 100) {
        fail("Percent discount cannot exceed 100");
      }
      out.discountValue = value;
    }
  }

  if (body.minOrderValue !== undefined) {
    out.minOrderValue = sanitizeNumber(body.minOrderValue, "minOrderValue", {
      min: 0,
    });
  }

  if (body.maxUses !== undefined && body.maxUses !== null && body.maxUses !== "") {
    out.maxUses = sanitizeNumber(body.maxUses, "maxUses", {
      min: 0,
      integer: true,
    });
  } else if (body.maxUses === null || body.maxUses === "") {
    out.maxUses = null;
  }

  if (body.startsAt !== undefined && body.startsAt !== null && body.startsAt !== "") {
    out.startsAt = sanitizeDate(body.startsAt, "startsAt");
  } else if (body.startsAt === null || body.startsAt === "") {
    out.startsAt = null;
  }

  if (body.endsAt !== undefined && body.endsAt !== null && body.endsAt !== "") {
    out.endsAt = sanitizeDate(body.endsAt, "endsAt");
  } else if (body.endsAt === null || body.endsAt === "") {
    out.endsAt = null;
  }

  if (out.startsAt && out.endsAt && out.endsAt <= out.startsAt) {
    fail("endsAt must be after startsAt");
  }

  if (body.applicableProducts !== undefined) {
    if (!Array.isArray(body.applicableProducts)) {
      fail("applicableProducts must be an array");
    }
    out.applicableProducts = body.applicableProducts.map((id, index) =>
      sanitizeObjectId(id, `applicableProducts[${index}]`)
    );
  }

  if (body.applicableCategories !== undefined) {
    if (!Array.isArray(body.applicableCategories)) {
      fail("applicableCategories must be an array");
    }
    out.applicableCategories = body.applicableCategories.map((cat, index) =>
      sanitizeEnum(cat, PRODUCT_CATEGORIES, `applicableCategories[${index}]`, {
        required: true,
      })
    );
  }

  if (body.isActive !== undefined) {
    out.isActive = sanitizeBoolean(body.isActive, "isActive");
  }

  if (body.issuedFor !== undefined) {
    out.issuedFor = sanitizeEnum(body.issuedFor, COUPON_ISSUED_FOR, "issuedFor");
  }

  return out;
};

const validateCouponCreate = createValidationMiddleware((req) => {
  req.body = sanitizeCouponPayload(req.body, { isUpdate: false });
});

const validateCouponUpdate = createValidationMiddleware((req) => {
  const body = sanitizeCouponPayload(req.body, { isUpdate: true });
  if (!Object.keys(body).length) {
    fail("At least one field is required to update");
  }
  req.body = body;
});

const SRI_LANKAN_PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
];

const sanitizeBannerPayload = (body, { isUpdate = false } = {}) => {
  const out = {};

  if (body.title !== undefined || !isUpdate) {
    out.title = sanitizeString(body.title, "title", {
      required: !isUpdate,
      minLength: 2,
      maxLength: 200,
    });
  }
  if (body.imageUrl !== undefined || !isUpdate) {
    out.imageUrl = sanitizeUrl(body.imageUrl, "imageUrl", { required: !isUpdate });
  }
  if (body.headline !== undefined) {
    out.headline = sanitizeOptionalPlainText(body.headline, "headline", {
      maxLength: 200,
    });
  }
  if (body.ctaText !== undefined) {
    out.ctaText = sanitizeOptionalPlainText(body.ctaText, "ctaText", { maxLength: 60 });
  }
  if (body.redirectUrl !== undefined || !isUpdate) {
    out.redirectUrl = sanitizeUrl(body.redirectUrl, "redirectUrl", {
      required: !isUpdate,
    });
  }
  if (body.activeFrom !== undefined && body.activeFrom !== null && body.activeFrom !== "") {
    out.activeFrom = sanitizeDate(body.activeFrom, "activeFrom");
  }
  if (body.activeTo !== undefined && body.activeTo !== null && body.activeTo !== "") {
    out.activeTo = sanitizeDate(body.activeTo, "activeTo");
  } else if (body.activeTo === null || body.activeTo === "") {
    out.activeTo = null;
  }
  if (out.activeFrom && out.activeTo && out.activeTo <= out.activeFrom) {
    fail("activeTo must be after activeFrom");
  }
  if (body.displayOrder !== undefined) {
    out.displayOrder = sanitizeNumber(body.displayOrder, "displayOrder", {
      integer: true,
      min: 0,
    });
  }
  if (body.isActive !== undefined) {
    out.isActive = sanitizeBoolean(body.isActive, "isActive");
  }

  return out;
};

const validateBannerCreate = createValidationMiddleware((req) => {
  req.body = sanitizeBannerPayload(req.body, { isUpdate: false });
});

const validateBannerUpdate = createValidationMiddleware((req) => {
  const body = sanitizeBannerPayload(req.body, { isUpdate: true });
  if (!Object.keys(body).length) {
    fail("At least one field is required to update");
  }
  req.body = body;
});

const OFFER_TYPES = [
  "clearance",
  "tier-discount",
  "mystery-box",
  "aging_stock",
  "new_product",
  "seasonal",
  "flash",
];

const sanitizeOfferPayload = (body, { isUpdate = false } = {}) => {
  const out = {};

  if (body.name !== undefined || !isUpdate) {
    out.name = sanitizeString(body.name, "name", {
      required: !isUpdate,
      minLength: 2,
      maxLength: 200,
    });
  }
  if (body.badgeText !== undefined) {
    out.badgeText = sanitizeOptionalPlainText(body.badgeText, "badgeText", { maxLength: 60 });
  }
  if (body.description !== undefined) {
    out.description = sanitizeOptionalPlainText(body.description, "description", {
      maxLength: 2000,
    });
  }
  const type = sanitizeEnum(body.type, OFFER_TYPES, "type", { required: !isUpdate });
  if (type !== undefined) out.type = type;

  if (body.discountPercent !== undefined) {
    out.discountPercent = sanitizeNumber(body.discountPercent, "discountPercent", {
      min: 0,
      max: 100,
    });
  }

  if (body.products !== undefined) {
    if (!Array.isArray(body.products)) fail("products must be an array");
    out.products = body.products.map((id, index) =>
      sanitizeObjectId(id, `products[${index}]`)
    );
  }

  if (body.applicableCategories !== undefined) {
    if (!Array.isArray(body.applicableCategories)) {
      fail("applicableCategories must be an array");
    }
    out.applicableCategories = body.applicableCategories.map((cat, index) =>
      sanitizeEnum(cat, PRODUCT_CATEGORIES, `applicableCategories[${index}]`, {
        required: true,
      })
    );
  }

  if (body.startsAt !== undefined && body.startsAt !== null && body.startsAt !== "") {
    out.startsAt = sanitizeDate(body.startsAt, "startsAt");
  } else if (body.startsAt === null || body.startsAt === "") {
    out.startsAt = null;
  }
  if (body.endsAt !== undefined && body.endsAt !== null && body.endsAt !== "") {
    out.endsAt = sanitizeDate(body.endsAt, "endsAt");
  } else if (body.endsAt === null || body.endsAt === "") {
    out.endsAt = null;
  }
  if (out.startsAt && out.endsAt && out.endsAt <= out.startsAt) {
    fail("endsAt must be after startsAt");
  }

  if (body.showOnHomepage !== undefined) {
    out.showOnHomepage = sanitizeBoolean(body.showOnHomepage, "showOnHomepage");
  }
  if (body.displayOrder !== undefined) {
    out.displayOrder = sanitizeNumber(body.displayOrder, "displayOrder", {
      integer: true,
      min: 0,
    });
  }
  if (body.isActive !== undefined) {
    out.isActive = sanitizeBoolean(body.isActive, "isActive");
  }
  if (body.estimatedMarginAfterDiscount !== undefined) {
    out.estimatedMarginAfterDiscount = sanitizeNumber(
      body.estimatedMarginAfterDiscount,
      "estimatedMarginAfterDiscount"
    );
  }

  return out;
};

const validateOfferCreate = createValidationMiddleware((req) => {
  req.body = sanitizeOfferPayload(req.body, { isUpdate: false });
});

const validateOfferUpdate = createValidationMiddleware((req) => {
  const body = sanitizeOfferPayload(req.body, { isUpdate: true });
  if (!Object.keys(body).length) {
    fail("At least one field is required to update");
  }
  req.body = body;
});

const sanitizeShippingZonePayload = (body, { isUpdate = false } = {}) => {
  const out = {};

  if (body.name !== undefined || !isUpdate) {
    out.name = sanitizeString(body.name, "name", {
      required: !isUpdate,
      minLength: 2,
      maxLength: 120,
    });
  }
  if (body.provinces !== undefined) {
    if (!Array.isArray(body.provinces)) fail("provinces must be an array");
    out.provinces = body.provinces.map((p, index) =>
      sanitizeEnum(p, SRI_LANKAN_PROVINCES, `provinces[${index}]`, { required: true })
    );
  }
  if (body.deliveryFee !== undefined || !isUpdate) {
    out.deliveryFee = sanitizeNumber(body.deliveryFee, "deliveryFee", {
      required: !isUpdate,
      min: 0,
    });
  }
  if (body.estimatedDays !== undefined) {
    out.estimatedDays = sanitizeOptionalPlainText(body.estimatedDays, "estimatedDays", {
      maxLength: 80,
    });
  }
  if (body.freeAbove !== undefined) {
    out.freeAbove = sanitizeNumber(body.freeAbove, "freeAbove", { min: 0 });
  }
  if (body.displayOrder !== undefined) {
    out.displayOrder = sanitizeNumber(body.displayOrder, "displayOrder", {
      integer: true,
      min: 0,
    });
  }
  if (body.isActive !== undefined) {
    out.isActive = sanitizeBoolean(body.isActive, "isActive");
  }

  return out;
};

const validateShippingZoneCreate = createValidationMiddleware((req) => {
  req.body = sanitizeShippingZonePayload(req.body, { isUpdate: false });
});

const validateShippingZoneUpdate = createValidationMiddleware((req) => {
  const body = sanitizeShippingZonePayload(req.body, { isUpdate: true });
  if (!Object.keys(body).length) {
    fail("At least one field is required to update");
  }
  req.body = body;
});

const validateNewsletterSubscribe = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    source: sanitizeOptionalPlainText(req.body.source, "source", { maxLength: 120 }),
  };
});

const sanitizeStructuredAddress = (input) => {
  if (!input || typeof input !== "object") return undefined;
  const street = sanitizeOptionalPlainText(input.street, "structuredAddress.street", { maxLength: 500 });
  const city = sanitizeOptionalPlainText(input.city, "structuredAddress.city", { maxLength: 200 });
  const postalCode = sanitizeOptionalPlainText(input.postalCode, "structuredAddress.postalCode", { maxLength: 50 });
  if (!street || !city || !postalCode) return undefined;
  return {
    label: sanitizeOptionalPlainText(input.label, "structuredAddress.label", { maxLength: 100 }) || undefined,
    street,
    city,
    postalCode,
    country: sanitizeOptionalPlainText(input.country, "structuredAddress.country", { maxLength: 100 }) || "Sri Lanka",
  };
};

const validateOrderCreate = createValidationMiddleware((req) => {
  req.body = {
    items: sanitizeOrderItems(req.body.items),
    checkoutMode: req.body.checkoutMode === "buyNow" ? "buyNow" : "cart",
    shippingAddress: sanitizeOptionalPlainText(req.body.shippingAddress, "shippingAddress", { required: true, minLength: 8, maxLength: 1000 }),
    structuredAddress: sanitizeStructuredAddress(req.body.structuredAddress),
    contactNumber: sanitizeOptionalPlainText(req.body.contactNumber, "contactNumber", { required: true, minLength: 7, maxLength: 50 }),
    paymentMethod: sanitizeEnum(req.body.paymentMethod, PAYMENT_METHODS, "paymentMethod", { required: true }),
    paymentProofUrl: sanitizeUrl(req.body.paymentProofUrl, "paymentProofUrl", { required: false }),
    notes: sanitizeOptionalPlainText(req.body.notes, "notes", { maxLength: 1000 }),
    guestEmail: sanitizeEmail(req.body.guestEmail, "guestEmail", { required: false }),
  };
});

const validateOrderStatusUpdate = createValidationMiddleware((req) => {
  const status = sanitizeEnum(req.body.status, ORDER_STATUSES, "status", { required: true });
  const cancellationReason = sanitizeOptionalPlainText(req.body.cancellationReason, "cancellationReason", {
    maxLength: 500,
  });
  req.body = {
    status,
    cancellationReason,
  };
});

const validateManualPaymentReference = createValidationMiddleware((req) => {
  req.body = {
    orderId: sanitizeObjectId(req.body.orderId, "orderId"),
    amount: req.body.amount === undefined ? undefined : sanitizeNumber(req.body.amount, "amount", { min: 0 }),
  };
});

const validateManualPaymentProof = createValidationMiddleware((req) => {
  req.body = {
    referenceNumber: sanitizeString(req.body.referenceNumber, "referenceNumber", { required: true, minLength: 4, maxLength: 100 }),
    proofUrl: sanitizeUrl(req.body.proofUrl, "proofUrl", { required: true }),
    email: req.body.email ? sanitizeEmail(req.body.email, "email", { required: false }) : undefined,
  };
});

const validateManualPaymentDecision = createValidationMiddleware((req) => {
  req.body = {
    action: sanitizeEnum(req.body.action, ["approve", "reject"], "action", { required: true }),
    rejectionReason: sanitizeOptionalPlainText(req.body.rejectionReason, "rejectionReason", { maxLength: 1000 }),
    adminNotes: sanitizeOptionalPlainText(req.body.adminNotes, "adminNotes", { maxLength: 2000 }),
  };
});

// Luhn / mod-10 checksum — same algorithm every card network uses for the PAN.
const passesLuhn = (digits) => {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum > 0 && sum % 10 === 0;
};

const validateSampleCardPayment = createValidationMiddleware((req) => {
  const rawCard = String(req.body.cardNumber || "").replace(/\D/g, "");
  if (rawCard.length < 13 || rawCard.length > 19 || !passesLuhn(rawCard)) {
    fail("Please enter a valid card number");
  }

  const cvv = String(req.body.cvv || "");
  if (!/^\d{3,4}$/.test(cvv)) fail("CVV must be 3 or 4 digits");

  const expMonth = sanitizeNumber(req.body.expiryMonth, "expiryMonth", { required: true, min: 1, max: 12, integer: true });
  const expYear = sanitizeNumber(req.body.expiryYear, "expiryYear", { required: true, min: 2024, max: 2099, integer: true });
  const now = new Date();
  const expiryEnd = new Date(expYear, expMonth, 0, 23, 59, 59);
  if (expiryEnd < now) fail("Card has expired");

  req.body = {
    orderId: sanitizeObjectId(req.body.orderId, "orderId"),
    cardholderName: sanitizeString(req.body.cardholderName, "cardholderName", { required: true, minLength: 2, maxLength: 100 }),
    cardNumber: rawCard,
    expiryMonth: expMonth,
    expiryYear: expYear,
    cvv,
    email: req.body.email ? sanitizeEmail(req.body.email, "email", { required: false }) : undefined,
  };
});

const validateReviewCreate = createValidationMiddleware((req) => {
  req.body = {
    productId: sanitizeObjectId(req.body.productId, "productId"),
    orderId: sanitizeObjectId(req.body.orderId, "orderId"),
    rating: sanitizeNumber(req.body.rating, "rating", { required: true, min: 1, max: 5 }),
    title: sanitizeString(req.body.title, "title", { required: true, minLength: 3, maxLength: 100 }),
    content: sanitizeOptionalPlainText(req.body.content, "content", { required: true, minLength: 10, maxLength: 500 }),
    images: sanitizeReviewImages(req.body.images) || [],
  };
});

const validateReviewUpdate = createValidationMiddleware((req) => {
  const body = {};
  if (req.body.rating !== undefined) body.rating = sanitizeNumber(req.body.rating, "rating", { min: 1, max: 5 });
  if (req.body.title !== undefined) body.title = sanitizeString(req.body.title, "title", { required: true, minLength: 3, maxLength: 100 });
  if (req.body.content !== undefined) body.content = sanitizeOptionalPlainText(req.body.content, "content", { required: true, minLength: 10, maxLength: 500 });
  if (req.body.images !== undefined) body.images = sanitizeReviewImages(req.body.images) || [];
  if (!Object.keys(body).length) fail("At least one review field is required");
  req.body = body;
});

const validateReviewFlag = createValidationMiddleware((req) => {
  req.body = {
    reason: sanitizeOptionalPlainText(req.body.reason, "reason", { maxLength: 250 }) || "Inappropriate content",
  };
});

const REVIEW_CATEGORIES = [
  "uncategorized",
  "fit",
  "quality",
  "delivery",
  "style",
  "value",
];

const validateReviewCategorize = createValidationMiddleware((req) => {
  req.body = {
    category: sanitizeEnum(req.body.category, REVIEW_CATEGORIES, "category", { required: true }),
  };
});

const validateImageUploadRequest = createValidationMiddleware((req) => {
  const rawRefModel = sanitizeString(req.body.refModel, "refModel", { required: true, maxLength: 20 });
  const refModel = rawRefModel.charAt(0).toUpperCase() + rawRefModel.slice(1).toLowerCase();
  if (!IMAGE_REF_MODELS.includes(refModel)) {
    fail(`refModel must be one of: ${IMAGE_REF_MODELS.join(", ")}`);
  }

  const body = {
    refModel,
    refId: refModel === "System" ? undefined : sanitizeObjectId(req.body.refId, "refId"),
    type: refModel === "System"
      ? sanitizeEnum(req.body.type, IMAGE_SYSTEM_TYPES, "type", { required: true })
      : sanitizeOptionalPlainText(req.body.type, "type", { maxLength: 50 }),
    label: sanitizeOptionalPlainText(req.body.label, "label", { maxLength: 100 }),
  };

  req.body = body;
});

const validateImageReorder = createValidationMiddleware((req) => {
  req.body = {
    imageOrders: sanitizeImageOrders(req.body.imageOrders),
  };
});

const validateDeleteAllImages = createValidationMiddleware((req) => {
  const rawRefModel = sanitizeString(req.body.refModel, "refModel", { required: true, maxLength: 20 });
  const refModel = rawRefModel.charAt(0).toUpperCase() + rawRefModel.slice(1).toLowerCase();
  if (!["Product", "Drop", "System"].includes(refModel)) {
    fail("refModel must be Product, Drop, or System");
  }

  req.body = {
    refModel,
    refId: refModel === "System" ? undefined : sanitizeObjectId(req.body.refId, "refId"),
    type: refModel === "System"
      ? sanitizeEnum(req.body.type, IMAGE_SYSTEM_TYPES, "type", { required: true })
      : undefined,
  };
});

const validateNotificationMessage = createValidationMiddleware((req) => {
  req.body = {
    title: sanitizeString(req.body.title, "title", { required: true, minLength: 3, maxLength: 250 }),
    message: sanitizeOptionalPlainText(req.body.message, "message", { required: true, minLength: 3, maxLength: 1000 }),
  };
});

const validateNotificationUpdate = createValidationMiddleware((req) => {
  const body = {};
  if (req.body.title !== undefined) body.title = sanitizeString(req.body.title, "title", { required: true, minLength: 3, maxLength: 250 });
  if (req.body.message !== undefined) body.message = sanitizeOptionalPlainText(req.body.message, "message", { required: true, minLength: 3, maxLength: 1000 });
  if (req.body.isRead !== undefined) body.isRead = sanitizeBoolean(req.body.isRead, "isRead");
  if (req.body.type !== undefined) body.type = sanitizeEnum(req.body.type, NOTIFICATION_TYPES, "type", { required: true });
  if (req.body.entityType !== undefined) body.entityType = sanitizeString(req.body.entityType, "entityType", { required: true, maxLength: 50 });
  if (!Object.keys(body).length) fail("At least one notification field is required");
  req.body = body;
});

const MEMBERSHIP_TIERS = ["standard", "elite", "rare", "legend", "vip"];

const validateAdminUserStatus = createValidationMiddleware((req) => {
  const hasIsActive = typeof req.body.isActive !== "undefined";
  const hasMembership = typeof req.body.membership !== "undefined";

  if (!hasIsActive && !hasMembership) {
    fail("isActive or membership must be provided");
  }

  req.body = {
    isActive: hasIsActive
      ? sanitizeBoolean(req.body.isActive, "isActive", { required: true })
      : undefined,
    membership: hasMembership
      ? sanitizeEnum(req.body.membership, MEMBERSHIP_TIERS, "membership", {
          required: true,
        })
      : undefined,
  };
});

const validateCartAdd = createValidationMiddleware((req) => {
  req.body = {
    productId: sanitizeObjectId(req.body.productId, "productId"),
    variantId: req.body.variantId ? sanitizeObjectId(req.body.variantId, "variantId") : undefined,
    quantity: sanitizeNumber(req.body.quantity ?? 1, "quantity", { min: 1, integer: true }),
  };
});

const validateCartUpdate = createValidationMiddleware((req) => {
  if (req.body.quantity === undefined && req.body.variantId === undefined) {
    fail("Quantity or variantId must be provided");
  }

  req.body = {
    quantity: req.body.quantity === undefined ? undefined : sanitizeNumber(req.body.quantity, "quantity", { integer: true }),
    variantId: req.body.variantId ? sanitizeObjectId(req.body.variantId, "variantId") : undefined,
  };
});

const validateWishlistAdd = createValidationMiddleware((req) => {
  req.body = {
    productId: sanitizeObjectId(req.body.productId, "productId"),
  };
});

const validateSuperAdminCreate = createValidationMiddleware((req) => {
  const role = sanitizeEnum(req.body.role || "admin", ADMIN_ROLE_VALUES, "role");
  req.body = {
    name: sanitizeString(req.body.name, "name", { required: false, minLength: 2, maxLength: 120 }),
    email: sanitizeEmail(req.body.email),
    password: sanitizePassword(req.body.password, "password", { required: false }),
    role,
    subRole: role === "sub_admin"
      ? sanitizeEnum(req.body.subRole, SUB_ROLE_VALUES, "subRole", { required: true })
      : undefined,
    permissions: sanitizePermissions(req.body.permissions),
  };
});

const validateSuperAdminPermissions = createValidationMiddleware((req) => {
  req.body = {
    permissions: sanitizePermissions(req.body.permissions, { required: true }),
  };
});

const validateSuperAdminActivation = createValidationMiddleware((req) => {
  req.body = {
    isActive: sanitizeBoolean(req.body.isActive, "isActive", { required: true }),
  };
});

// ── Bulk operation validators ────────────────────────────────────────
// Shared shape: every bulk endpoint takes `ids: ObjectId[]` plus action-specific fields.

const sanitizeBulkIds = (ids, { max = 200 } = {}) => {
  if (!Array.isArray(ids)) fail("ids must be an array");
  if (ids.length === 0) fail("ids must contain at least one entry");
  if (ids.length > max) fail(`ids cannot contain more than ${max} entries`);
  // De-duplicate so the same row isn't double-processed if the client double-clicks.
  const seen = new Set();
  const cleaned = [];
  ids.forEach((id, index) => {
    const normalized = sanitizeObjectId(id, `ids[${index}]`);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      cleaned.push(normalized);
    }
  });
  return cleaned;
};

const BULK_PRODUCT_ACTIONS = ["activate", "deactivate", "delete"];
const BULK_ORDER_STATUSES = ["confirmed", "shipped", "delivered", "cancelled"];
const BULK_REVIEW_ACTIONS = ["feature", "unfeature", "category"];
const BULK_USER_TAG_MODES = ["add", "remove"];
const BULK_USER_TAG_VALUES = [
  "vip",
  "high_spender",
  "drop_collector",
  "frequent_buyer",
  "refund_risk",
  "early_supporter",
];

const validateBulkProductAction = createValidationMiddleware((req) => {
  req.body = {
    ids: sanitizeBulkIds(req.body.ids),
    action: sanitizeEnum(req.body.action, BULK_PRODUCT_ACTIONS, "action", { required: true }),
  };
});

const validateBulkOrderStatus = createValidationMiddleware((req) => {
  const status = sanitizeEnum(req.body.status, BULK_ORDER_STATUSES, "status", { required: true });
  req.body = {
    ids: sanitizeBulkIds(req.body.ids),
    status,
    cancellationReason:
      status === "cancelled"
        ? sanitizeOptionalPlainText(req.body.cancellationReason, "cancellationReason", { maxLength: 500 })
        : undefined,
  };
});

const validateBulkReviewAction = createValidationMiddleware((req) => {
  const action = sanitizeEnum(req.body.action, BULK_REVIEW_ACTIONS, "action", { required: true });
  const body = {
    ids: sanitizeBulkIds(req.body.ids),
    action,
  };
  if (action === "category") {
    body.category = sanitizeEnum(req.body.category, REVIEW_CATEGORIES, "category", { required: true });
  }
  req.body = body;
});

const validateBulkUserTag = createValidationMiddleware((req) => {
  req.body = {
    ids: sanitizeBulkIds(req.body.ids),
    tag: sanitizeEnum(req.body.tag, BULK_USER_TAG_VALUES, "tag", { required: true }),
    mode: sanitizeEnum(req.body.mode || "add", BULK_USER_TAG_MODES, "mode", { required: true }),
  };
});

module.exports = {
  validateObjectIdParam,
  validateAuthRegister,
  validateAuthLogin,
  validateOtpVerify,
  validateEmailOnly,
  validateChangePassword,
  validateVerifyResetOtp,
  validateResetPassword,
  validateGoogleAuth,
  validateFacebookAuth,
  validateContactSubmission,
  validateContactUpdate,
  validateDropCreate,
  validateDropUpdate,
  validateProductCreate,
  validateProductUpdate,
  validateCouponCreate,
  validateCouponUpdate,
  validateBannerCreate,
  validateBannerUpdate,
  validateOfferCreate,
  validateOfferUpdate,
  validateShippingZoneCreate,
  validateShippingZoneUpdate,
  validateNewsletterSubscribe,
  validateOrderCreate,
  validateOrderStatusUpdate,
  validateManualPaymentReference,
  validateManualPaymentProof,
  validateManualPaymentDecision,
  validateSampleCardPayment,
  validateReviewCreate,
  validateReviewUpdate,
  validateReviewFlag,
  validateReviewCategorize,
  validateImageUploadRequest,
  validateImageReorder,
  validateDeleteAllImages,
  validateNotificationMessage,
  validateNotificationUpdate,
  validateAdminUserStatus,
  validateCartAdd,
  validateCartUpdate,
  validateWishlistAdd,
  validateSuperAdminCreate,
  validateSuperAdminPermissions,
  validateSuperAdminActivation,
  validateBulkProductAction,
  validateBulkOrderStatus,
  validateBulkReviewAction,
  validateBulkUserTag,
  BULK_USER_TAG_VALUES,
};
