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
const USER_TAG_VALUES = ["vip", "high_spender", "drop_collector", "frequent_buyer", "refund_risk", "early_supporter"];
const USER_MEMBERSHIP_VALUES = ["standard", "elite", "rare", "legend", "vip"];
const REVIEW_CATEGORIES = ["uncategorized", "fit", "quality", "delivery", "style", "value"];
const OFFER_TYPES = ["clearance", "tier-discount", "aging_stock", "new_product", "seasonal", "flash", "percentage_discount", "fixed_amount", "category_discount", "product_discount", "buy_x_get_y", "cart_value", "seasonal_campaign"];
const COUPON_ISSUED_FOR_VALUES = ["review_reward", "vip", "vip_tier", "campaign", "manual", "referral", "birthday", "first_order", "cart_recovery", "drop_launch", "welcome", "loyalty", "flash_sale"];

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

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

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const sanitizeString = (
  value,
  field,
  { required = false, maxLength, minLength } = {}
) => {
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

const sanitizeOptionalPlainText = (
  value,
  field,
  { maxLength, minLength } = {}
) => {
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

const sanitizeEmail = (
  value,
  field = "email",
  { required = true } = {}
) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = validator.normalizeEmail(value.trim(), {
    gmail_remove_dots: false,
  });

  if (!normalized || !validator.isEmail(normalized)) {
    fail(`Please provide a valid ${field}`);
  }

  return normalized;
};

const sanitizePassword = (
  value,
  field = "password",
  { required = true } = {}
) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string") {
    fail(`${field} must be a string`);
  }

  const normalized = value.trim();

  if (!passwordPattern.test(normalized)) {
    fail(
      `${field} must include uppercase, lowercase, number, special character, and be at least 8 characters`
    );
  }

  return normalized;
};

const sanitizeObjectId = (value, field) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    fail(`Valid ${field} is required`);
  }

  return String(value);
};

const sanitizeNumber = (
  value,
  field,
  { required = false, min, max, integer = false } = {}
) => {
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

const sanitizeBoolean = (
  value,
  field,
  { required = false } = {}
) => {
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

const sanitizeEnum = (
  value,
  allowedValues,
  field,
  { required = false } = {}
) => {
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

const sanitizeDate = (
  value,
  field,
  { required = false } = {}
) => {
  if (value === undefined || value === null || value === "") {
    if (required) fail(`${field} is required`);
    return undefined;
  }

  if (typeof value !== "string" && !(value instanceof Date)) {
    fail(`${field} must be a valid date`);
  }

  const normalized =
    value instanceof Date ? value.toISOString() : String(value).trim();

  if (!validator.isISO8601(normalized)) {
    fail(`${field} must be a valid ISO date`);
  }

  return new Date(normalized);
};

const sanitizeUrl = (
  value,
  field,
  { required = false } = {}
) => {
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

const sanitizePermissions = (
  permissions,
  { required = false } = {}
) => {
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

    normalized[key] = sanitizeBoolean(
      permissions[key],
      `permissions.${key}`,
      { required: true }
    );
  }

  return normalized;
};

const validateObjectIdParam = (
  paramName,
  label = paramName
) =>
  createValidationMiddleware((req) => {
    req.params[paramName] = sanitizeObjectId(
      req.params[paramName],
      label
    );
  });

/* =========================================================
   AUTH VALIDATORS
========================================================= */

const validateAuthRegister = createValidationMiddleware((req) => {
  const email = sanitizeEmail(req.body.email);

  const password = sanitizePassword(req.body.password);

  // confirmPassword only needs basic validation here.
  // equality check should happen in controller/model.
  const confirmPassword = sanitizeString(
    req.body.confirmPassword,
    "confirmPassword",
    {
      required: true,
      minLength: 8,
      maxLength: 128,
    }
  );

  // optional phone
  const phoneNumber = sanitizeOptionalPlainText(
    req.body.phoneNumber,
    "phoneNumber",
    {
      maxLength: 20,
    }
  );

  const username = sanitizeOptionalPlainText(
    req.body.username,
    "username",
    {
      maxLength: 120,
    }
  );

  req.body = {
    email,
    password,
    confirmPassword,
    phoneNumber: phoneNumber || undefined,
    username,
  };
});

const validateAuthLogin = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    password: sanitizeString(
      req.body.password,
      "password",
      {
        required: true,
        minLength: 8,
        maxLength: 128,
      }
    ),
  };
});

const validateOtpVerify = createValidationMiddleware((req) => {
  req.body = {
    otp: sanitizeString(req.body.otp, "otp", {
      required: true,
      minLength: 4,
      maxLength: 10,
    }),
    userId: sanitizeObjectId(req.body.userId, "userId"),
  };
});

const validateEmailOnly = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
  };
});

const validateSocialAuth = createValidationMiddleware((req) => {
  req.body = {
    accessToken: sanitizeString(req.body.accessToken, "accessToken", {
      required: true,
      maxLength: 4096,
    }),
  };
});

const validateGoogleAuth = validateSocialAuth;
const validateFacebookAuth = validateSocialAuth;

const validateVerifyResetOtp = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    otp: sanitizeString(req.body.otp, "otp", {
      required: true,
      minLength: 4,
      maxLength: 10,
    }),
  };
});

const validateResetPassword = createValidationMiddleware((req) => {
  req.body = {
    email: sanitizeEmail(req.body.email),
    otp: sanitizeString(req.body.otp, "otp", {
      required: true,
      minLength: 4,
      maxLength: 10,
    }),
    newPassword: sanitizePassword(
      req.body.newPassword,
      "newPassword"
    ),
    confirmPassword: sanitizePassword(
      req.body.confirmPassword,
      "confirmPassword"
    ),
  };
});

const validateChangePassword = createValidationMiddleware((req) => {
  req.body = {
    oldPassword: sanitizeOptionalPlainText(
      req.body.oldPassword,
      "oldPassword",
      {
        minLength: 8,
        maxLength: 128,
      }
    ),
    newPassword: sanitizePassword(
      req.body.newPassword,
      "newPassword"
    ),
    passwordConfirm: sanitizePassword(
      req.body.passwordConfirm,
      "passwordConfirm"
    ),
  };
});

const validateProductCreate = createValidationMiddleware((req) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    fail("Request body must be an object");
  }
});

const validateProductUpdate = createValidationMiddleware((req) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    fail("Request body must be an object");
  }
});

const validateBulkProductAction = createValidationMiddleware((req) => {
  if (!Array.isArray(req.body.ids) || req.body.ids.length === 0) {
    fail("ids must be a non-empty array");
  }

  const ids = req.body.ids.map((id, index) =>
    sanitizeObjectId(id, `ids[${index}]`)
  );

  const action = sanitizeEnum(
    req.body.action,
    ["activate", "deactivate", "delete"],
    "action",
    { required: true }
  );

  req.body = {
    ids,
    action,
  };
});

const validateImageUploadRequest = createValidationMiddleware((req) => {
  const validated = {
    refModel: sanitizeString(req.body.refModel, "refModel", {
      required: true,
      maxLength: 32,
    }),
  };

  if (req.body.refId !== undefined && req.body.refId !== null && req.body.refId !== "") {
    validated.refId = sanitizeObjectId(req.body.refId, "refId");
  }

  if (req.body.type !== undefined && req.body.type !== null && req.body.type !== "") {
    validated.type = sanitizeString(req.body.type, "type", {
      maxLength: 64,
    });
  }

  if (req.body.label !== undefined && req.body.label !== null && req.body.label !== "") {
    validated.label = sanitizeString(req.body.label, "label", {
      maxLength: 120,
    });
  }

  if (req.body.colorTag !== undefined && req.body.colorTag !== null && req.body.colorTag !== "") {
    validated.colorTag = sanitizeString(req.body.colorTag, "colorTag", {
      maxLength: 64,
    });
  }

  req.body = validated;
});

const validateImageReorder = createValidationMiddleware((req) => {
  if (!Array.isArray(req.body.imageOrders) || req.body.imageOrders.length === 0) {
    fail("imageOrders array is required (e.g. [{ imageId, order }])");
  }

  req.body = {
    imageOrders: req.body.imageOrders.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        fail(`imageOrders[${index}] must be an object`);
      }

      return {
        imageId: sanitizeObjectId(entry.imageId, `imageOrders[${index}].imageId`),
        order: sanitizeNumber(entry.order, `imageOrders[${index}].order`, {
          required: true,
          integer: true,
        }),
      };
    }),
  };
});

const validateDeleteAllImages = createValidationMiddleware((req) => {
  const refModel = sanitizeString(req.body.refModel, "refModel", {
    required: true,
    maxLength: 32,
  });

  const normalizedRefModel =
    refModel.charAt(0).toUpperCase() + refModel.slice(1).toLowerCase();

  if (!["Product", "Drop", "System"].includes(normalizedRefModel)) {
    fail("Invalid refModel");
  }

  const validated = { refModel: normalizedRefModel };

  if (normalizedRefModel === "System") {
    validated.type = sanitizeString(req.body.type, "type", {
      required: true,
      maxLength: 64,
    });
  } else {
    validated.refId = sanitizeObjectId(req.body.refId, "refId");
  }

  req.body = validated;
});

const validateDropCreate = createValidationMiddleware((req) => {
  const name = sanitizeString(req.body.name, "name", {
    required: true,
    maxLength: 200,
  });

  const releaseDate = sanitizeDate(req.body.releaseDate, "releaseDate", {
    required: true,
  });

  const endDate = sanitizeDate(req.body.endDate, "endDate");

  if (endDate && endDate <= releaseDate) {
    fail("endDate must be after releaseDate");
  }

  req.body = {
    name,
    description: sanitizeOptionalPlainText(req.body.description, "description", {
      maxLength: 2000,
    }),
    headline: sanitizeOptionalPlainText(req.body.headline, "headline", {
      maxLength: 140,
    }),
    manifesto: sanitizeOptionalPlainText(req.body.manifesto, "manifesto", {
      maxLength: 4000,
    }),
    cinematicMode: sanitizeBoolean(req.body.cinematicMode, "cinematicMode"),
    vipEarlyAccessHours: sanitizeNumber(
      req.body.vipEarlyAccessHours,
      "vipEarlyAccessHours",
      {
        min: 0,
        max: 168,
        integer: true,
      }
    ),
    releaseDate,
    endDate,
    isPublished: sanitizeBoolean(req.body.isPublished, "isPublished"),
    isArchived: sanitizeBoolean(req.body.isArchived, "isArchived"),
  };
});

const validateDropUpdate = createValidationMiddleware((req) => {
  const dropData = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    dropData.name = sanitizeString(req.body.name, "name", {
      maxLength: 200,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
    dropData.description = sanitizeOptionalPlainText(req.body.description, "description", {
      maxLength: 2000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "headline")) {
    dropData.headline = sanitizeOptionalPlainText(req.body.headline, "headline", {
      maxLength: 140,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "manifesto")) {
    dropData.manifesto = sanitizeOptionalPlainText(req.body.manifesto, "manifesto", {
      maxLength: 4000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "cinematicMode")) {
    dropData.cinematicMode = sanitizeBoolean(req.body.cinematicMode, "cinematicMode");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "vipEarlyAccessHours")) {
    dropData.vipEarlyAccessHours = sanitizeNumber(
      req.body.vipEarlyAccessHours,
      "vipEarlyAccessHours",
      {
        min: 0,
        max: 168,
        integer: true,
      }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "releaseDate")) {
    dropData.releaseDate = sanitizeDate(req.body.releaseDate, "releaseDate");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "endDate")) {
    dropData.endDate = sanitizeDate(req.body.endDate, "endDate");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isPublished")) {
    dropData.isPublished = sanitizeBoolean(req.body.isPublished, "isPublished");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isArchived")) {
    dropData.isArchived = sanitizeBoolean(req.body.isArchived, "isArchived");
  }

  if (dropData.releaseDate && dropData.endDate && dropData.endDate <= dropData.releaseDate) {
    fail("endDate must be after releaseDate");
  }

  req.body = dropData;
});

const validateOrderCreate = createValidationMiddleware((req) => {
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
    fail("items must be a non-empty array");
  }

  const items = req.body.items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      fail(`items[${index}] must be an object`);
    }

    return {
      productId: sanitizeObjectId(item.productId, `items[${index}].productId`),
      variantSku: sanitizeString(item.variantSku, `items[${index}].variantSku`, {
        required: true,
        maxLength: 100,
      }),
      quantity: sanitizeNumber(item.quantity, `items[${index}].quantity`, {
        required: true,
        min: 1,
        integer: true,
      }),
    };
  });

  const structuredAddress =
    req.body.structuredAddress &&
    typeof req.body.structuredAddress === "object" &&
    !Array.isArray(req.body.structuredAddress)
      ? {
          label: sanitizeOptionalPlainText(
            req.body.structuredAddress.label,
            "structuredAddress.label",
            { maxLength: 120 }
          ),
          street: sanitizeOptionalPlainText(
            req.body.structuredAddress.street,
            "structuredAddress.street",
            { maxLength: 200 }
          ),
          city: sanitizeOptionalPlainText(
            req.body.structuredAddress.city,
            "structuredAddress.city",
            { maxLength: 120 }
          ),
          postalCode: sanitizeOptionalPlainText(
            req.body.structuredAddress.postalCode,
            "structuredAddress.postalCode",
            { maxLength: 32 }
          ),
          country: sanitizeOptionalPlainText(
            req.body.structuredAddress.country,
            "structuredAddress.country",
            { maxLength: 120 }
          ),
        }
      : undefined;

  req.body = {
    items,
    shippingAddress: sanitizeString(req.body.shippingAddress, "shippingAddress", {
      required: true,
      maxLength: 1000,
    }),
    contactNumber: sanitizeString(req.body.contactNumber, "contactNumber", {
      required: true,
      maxLength: 40,
    }),
    paymentMethod: sanitizeEnum(
      req.body.paymentMethod,
      PAYMENT_METHODS,
      "paymentMethod",
      { required: true }
    ),
    paymentProofUrl: sanitizeUrl(req.body.paymentProofUrl, "paymentProofUrl", {
      required: false,
    }),
    notes: sanitizeOptionalPlainText(req.body.notes, "notes", {
      maxLength: 2000,
    }),
    couponCode: sanitizeOptionalPlainText(req.body.couponCode, "couponCode", {
      maxLength: 64,
    }),
    structuredAddress,
    checkoutMode: sanitizeEnum(
      req.body.checkoutMode,
      ["cart", "buyNow"],
      "checkoutMode",
      { required: false }
    ),
    guestEmail: sanitizeEmail(req.body.guestEmail, "guestEmail", {
      required: false,
    }),
    dropId:
      req.body.dropId !== undefined && req.body.dropId !== null && req.body.dropId !== ""
        ? sanitizeObjectId(req.body.dropId, "dropId")
        : undefined,
  };
});

const validateOrderStatusUpdate = createValidationMiddleware((req) => {
  const status = sanitizeEnum(req.body.status, ORDER_STATUSES, "status", {
    required: true,
  });

  const validated = { status };

  if (status === "cancelled") {
    validated.cancellationReason = sanitizeString(
      req.body.cancellationReason,
      "cancellationReason",
      {
        required: true,
        maxLength: 500,
      }
    );
  }

  req.body = validated;
});

const validateBulkOrderStatus = createValidationMiddleware((req) => {
  if (!Array.isArray(req.body.ids) || req.body.ids.length === 0) {
    fail("ids must be a non-empty array");
  }

  const ids = req.body.ids.map((id, index) =>
    sanitizeObjectId(id, `ids[${index}]`)
  );

  const status = sanitizeEnum(req.body.status, ORDER_STATUSES, "status", {
    required: true,
  });

  const validated = { ids, status };

  if (status === "cancelled") {
    validated.cancellationReason = sanitizeString(
      req.body.cancellationReason,
      "cancellationReason",
      {
        required: true,
        maxLength: 500,
      }
    );
  }

  req.body = validated;
});

const validateAdminUserStatus = createValidationMiddleware((req) => {
  const validated = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    validated.isActive = sanitizeBoolean(req.body.isActive, "isActive");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "membership")) {
    validated.membership = sanitizeEnum(
      req.body.membership,
      USER_MEMBERSHIP_VALUES,
      "membership",
      { required: false }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "tags")) {
    if (!Array.isArray(req.body.tags)) {
      fail("tags must be an array");
    }

    validated.tags = [...new Set(
      req.body.tags
        .map((tag) => String(tag).trim())
        .filter((tag) => USER_TAG_VALUES.includes(tag))
    )];
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "addAdminNote")) {
    validated.addAdminNote = sanitizeOptionalPlainText(
      req.body.addAdminNote,
      "addAdminNote",
      { maxLength: 2000 }
    );
  }

  if (
    typeof validated.isActive === "undefined" &&
    typeof validated.membership === "undefined" &&
    typeof validated.tags === "undefined" &&
    typeof validated.addAdminNote === "undefined"
  ) {
    fail("isActive, membership, tags, or addAdminNote must be provided");
  }

  req.body = validated;
});

const validateCartAdd = createValidationMiddleware((req) => {
  const validated = {
    productId: sanitizeObjectId(req.body.productId, "productId"),
  };

  if (
    Object.prototype.hasOwnProperty.call(req.body, "variantId") &&
    req.body.variantId !== undefined &&
    req.body.variantId !== null &&
    req.body.variantId !== ""
  ) {
    validated.variantId = sanitizeObjectId(req.body.variantId, "variantId");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "quantity")) {
    validated.quantity = sanitizeNumber(req.body.quantity, "quantity", {
      min: 1,
      integer: true,
    });
  }

  req.body = validated;
});

const validateCartUpdate = createValidationMiddleware((req) => {
  const validated = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "quantity")) {
    validated.quantity = sanitizeNumber(req.body.quantity, "quantity", {
      min: 0,
      integer: true,
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(req.body, "variantId") &&
    req.body.variantId !== undefined &&
    req.body.variantId !== null &&
    req.body.variantId !== ""
  ) {
    validated.variantId = sanitizeObjectId(req.body.variantId, "variantId");
  }

  req.body = validated;
});

const validateWishlistAdd = createValidationMiddleware((req) => {
  req.body = {
    productId: sanitizeObjectId(req.body.productId, "productId"),
  };
});

const validateBulkUserTag = createValidationMiddleware((req) => {
  if (!Array.isArray(req.body.ids) || req.body.ids.length === 0) {
    fail("ids must be a non-empty array");
  }

  const ids = req.body.ids.map((id, index) =>
    sanitizeObjectId(id, `ids[${index}]`)
  );

  const tag = sanitizeEnum(req.body.tag, USER_TAG_VALUES, "tag", {
    required: true,
  });

  const mode = sanitizeEnum(req.body.mode, ["add", "remove"], "mode", {
    required: true,
  });

  req.body = {
    ids,
    tag,
    mode,
  };
});

const validateBannerCreate = createValidationMiddleware((req) => {
  req.body = {
    title: sanitizeString(req.body.title, "title", {
      required: true,
      maxLength: 200,
    }),
    imageUrl: sanitizeString(req.body.imageUrl, "imageUrl", {
      required: true,
      maxLength: 2048,
    }),
    headline: sanitizeOptionalPlainText(req.body.headline, "headline", {
      maxLength: 300,
    }),
    ctaText: sanitizeOptionalPlainText(req.body.ctaText, "ctaText", {
      maxLength: 100,
    }),
    redirectUrl: sanitizeString(req.body.redirectUrl, "redirectUrl", {
      required: true,
      maxLength: 2048,
    }),
    activeFrom: sanitizeDate(req.body.activeFrom, "activeFrom"),
    activeTo: sanitizeDate(req.body.activeTo, "activeTo"),
    displayOrder: sanitizeNumber(req.body.displayOrder, "displayOrder", {
      min: 0,
      integer: true,
    }),
    isActive: sanitizeBoolean(req.body.isActive, "isActive"),
  };
});

const validateBannerUpdate = createValidationMiddleware((req) => {
  const bannerData = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
    bannerData.title = sanitizeString(req.body.title, "title", {
      maxLength: 200,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "imageUrl")) {
    bannerData.imageUrl = sanitizeString(req.body.imageUrl, "imageUrl", {
      maxLength: 2048,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "headline")) {
    bannerData.headline = sanitizeOptionalPlainText(req.body.headline, "headline", {
      maxLength: 300,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "ctaText")) {
    bannerData.ctaText = sanitizeOptionalPlainText(req.body.ctaText, "ctaText", {
      maxLength: 100,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "redirectUrl")) {
    bannerData.redirectUrl = sanitizeString(req.body.redirectUrl, "redirectUrl", {
      maxLength: 2048,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "activeFrom")) {
    bannerData.activeFrom = sanitizeDate(req.body.activeFrom, "activeFrom");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "activeTo")) {
    bannerData.activeTo = sanitizeDate(req.body.activeTo, "activeTo");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "displayOrder")) {
    bannerData.displayOrder = sanitizeNumber(req.body.displayOrder, "displayOrder", {
      min: 0,
      integer: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    bannerData.isActive = sanitizeBoolean(req.body.isActive, "isActive");
  }

  req.body = bannerData;
});

const validateManualPaymentReference = createValidationMiddleware((req) => {
  const validated = {
    orderId: sanitizeObjectId(req.body.orderId, "orderId"),
  };

  if (req.body.amount !== undefined && req.body.amount !== null && req.body.amount !== "") {
    validated.amount = sanitizeNumber(req.body.amount, "amount", {
      min: 0,
    });
  }

  req.body = validated;
});

const validateManualPaymentProof = createValidationMiddleware((req) => {
  req.body = {
    referenceNumber: sanitizeString(req.body.referenceNumber, "referenceNumber", {
      required: true,
      maxLength: 100,
    }),
    proofUrl: sanitizeUrl(req.body.proofUrl, "proofUrl", {
      required: true,
    }),
  };
});

const validateManualPaymentDecision = createValidationMiddleware((req) => {
  const action = sanitizeEnum(req.body.action, ["approve", "reject"], "action", {
    required: true,
  });

  const validated = { action };

  if (Object.prototype.hasOwnProperty.call(req.body, "rejectionReason")) {
    validated.rejectionReason = sanitizeOptionalPlainText(
      req.body.rejectionReason,
      "rejectionReason",
      { maxLength: 1000 }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "adminNotes")) {
    validated.adminNotes = sanitizeOptionalPlainText(
      req.body.adminNotes,
      "adminNotes",
      { maxLength: 2000 }
    );
  }

  req.body = validated;
});

const validateSampleCardPayment = createValidationMiddleware((req) => {
  const normalizedCardNumber = sanitizeString(req.body.cardNumber, "cardNumber", {
    required: true,
    maxLength: 32,
  }).replace(/\s+/g, "");

  if (!/^\d{13,19}$/.test(normalizedCardNumber)) {
    fail("cardNumber must be 13 to 19 digits");
  }

  const expiryMonth = sanitizeString(req.body.expiryMonth, "expiryMonth", {
    required: true,
    maxLength: 4,
  });

  if (!/^(0?[1-9]|1[0-2])$/.test(expiryMonth)) {
    fail("expiryMonth must be between 1 and 12");
  }

  const expiryYear = sanitizeString(req.body.expiryYear, "expiryYear", {
    required: true,
    maxLength: 4,
  });

  if (!/^\d{2,4}$/.test(expiryYear)) {
    fail("expiryYear must be a valid year");
  }

  req.body = {
    orderId: sanitizeObjectId(req.body.orderId, "orderId"),
    cardholderName: sanitizeString(req.body.cardholderName, "cardholderName", {
      required: true,
      maxLength: 100,
    }),
    cardNumber: normalizedCardNumber,
    expiryMonth,
    expiryYear,
    email: sanitizeEmail(req.body.email, "email", { required: false }),
  };
});

const validateNotificationMessage = createValidationMiddleware((req) => {
  req.body = {
    title: sanitizeString(req.body.title, "title", {
      required: true,
      maxLength: 250,
    }),
    message: sanitizeString(req.body.message, "message", {
      required: true,
      maxLength: 1000,
    }),
  };
});

const validateNotificationUpdate = createValidationMiddleware((req) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
    updates.title = sanitizeString(req.body.title, "title", {
      maxLength: 250,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "message")) {
    updates.message = sanitizeString(req.body.message, "message", {
      maxLength: 1000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isRead")) {
    updates.isRead = sanitizeBoolean(req.body.isRead, "isRead");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "type")) {
    updates.type = sanitizeEnum(
      req.body.type,
      NOTIFICATION_TYPES,
      "type",
      { required: false }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "entityType")) {
    updates.entityType = sanitizeOptionalPlainText(req.body.entityType, "entityType", {
      maxLength: 50,
    });
  }

  if (Object.keys(updates).length === 0) {
    fail("At least one field is required to update");
  }

  req.body = updates;
});

const validateContactSubmission = createValidationMiddleware((req) => {
  req.body = {
    name: sanitizeString(req.body.name, "name", {
      required: true,
      maxLength: 120,
    }),
    email: sanitizeEmail(req.body.email, "email", {
      required: true,
    }),
    subject: sanitizeString(req.body.subject, "subject", {
      required: true,
      maxLength: 200,
    }),
    message: sanitizeString(req.body.message, "message", {
      required: true,
      maxLength: 500,
    }),
  };
});

const validateContactUpdate = createValidationMiddleware((req) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
    updates.status = sanitizeEnum(
      req.body.status,
      CONTACT_STATUSES,
      "status",
      { required: false }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "respondedAt")) {
    updates.respondedAt = sanitizeDate(req.body.respondedAt, "respondedAt");
  }

  if (Object.keys(updates).length === 0) {
    fail("No updates provided.");
  }

  req.body = updates;
});

const validateReviewCreate = createValidationMiddleware((req) => {
  const validated = {
    productId: sanitizeObjectId(req.body.productId, "productId"),
    orderId: sanitizeObjectId(req.body.orderId, "orderId"),
    rating: sanitizeNumber(req.body.rating, "rating", {
      required: true,
      min: 1,
      max: 5,
      integer: true,
    }),
    title: sanitizeString(req.body.title, "title", {
      required: true,
      minLength: 3,
      maxLength: 200,
    }),
    content: sanitizeString(req.body.content, "content", {
      required: true,
      minLength: 10,
      maxLength: 5000,
    }),
  };

  if (req.body.images !== undefined) {
    if (!Array.isArray(req.body.images)) {
      fail("images must be an array");
    }

    if (req.body.images.length > 3) {
      fail("You can upload up to 3 images");
    }

    validated.images = req.body.images;
  }

  req.body = validated;
});

const validateReviewUpdate = createValidationMiddleware((req) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "rating")) {
    updates.rating = sanitizeNumber(req.body.rating, "rating", {
      min: 1,
      max: 5,
      integer: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
    updates.title = sanitizeString(req.body.title, "title", {
      minLength: 3,
      maxLength: 200,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "content")) {
    updates.content = sanitizeString(req.body.content, "content", {
      minLength: 10,
      maxLength: 5000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "images")) {
    if (!Array.isArray(req.body.images)) {
      fail("images must be an array");
    }

    if (req.body.images.length > 3) {
      fail("You can upload up to 3 images");
    }

    updates.images = req.body.images;
  }

  if (Object.keys(updates).length === 0) {
    fail("At least one field is required to update");
  }

  req.body = updates;
});

const validateReviewFlag = createValidationMiddleware((req) => {
  const validated = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "reason")) {
    validated.reason = sanitizeOptionalPlainText(req.body.reason, "reason", {
      maxLength: 500,
    });
  }

  req.body = validated;
});

const validateReviewCategorize = createValidationMiddleware((req) => {
  req.body = {
    category: sanitizeEnum(req.body.category, REVIEW_CATEGORIES, "category", {
      required: true,
    }),
  };
});

const validateBulkReviewAction = createValidationMiddleware((req) => {
  if (!Array.isArray(req.body.ids) || req.body.ids.length === 0) {
    fail("ids must be a non-empty array");
  }

  const ids = req.body.ids.map((id, index) =>
    sanitizeObjectId(id, `ids[${index}]`)
  );

  const action = sanitizeEnum(
    req.body.action,
    ["feature", "unfeature", "category"],
    "action",
    { required: true }
  );

  const validated = { ids, action };

  if (action === "category") {
    validated.category = sanitizeEnum(
      req.body.category,
      REVIEW_CATEGORIES,
      "category",
      { required: true }
    );
  }

  req.body = validated;
});

const validateSuperAdminCreate = createValidationMiddleware((req) => {
  const validated = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
    validated.email = sanitizeEmail(req.body.email, "email", { required: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "password")) {
    validated.password = sanitizePassword(req.body.password, "password", {
      required: false,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    validated.name = sanitizeOptionalPlainText(req.body.name, "name", {
      maxLength: 120,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "role")) {
    validated.role = sanitizeEnum(req.body.role, ["admin", "sub_admin"], "role", {
      required: false,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "subRole")) {
    validated.subRole = sanitizeEnum(
      req.body.subRole,
      ["order_manager", "product_manager", "marketing_manager", "support_admin", "inventory_manager"],
      "subRole",
      { required: false }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "permissions")) {
    validated.permissions = sanitizePermissions(req.body.permissions, {
      required: false,
    });
  }

  req.body = validated;
});

const validateSuperAdminPermissions = createValidationMiddleware((req) => {
  req.body = {
    permissions: sanitizePermissions(req.body.permissions, {
      required: true,
    }),
  };
});

const validateSuperAdminActivation = createValidationMiddleware((req) => {
  req.body = {
    isActive: sanitizeBoolean(req.body.isActive, "isActive", {
      required: true,
    }),
  };
});

const validateNewsletterSubscribe = createValidationMiddleware((req) => {
  const validated = {
    email: sanitizeEmail(req.body.email, "email", { required: true }),
  };

  if (Object.prototype.hasOwnProperty.call(req.body, "source")) {
    validated.source = sanitizeOptionalPlainText(req.body.source, "source", {
      maxLength: 120,
    });
  }

  req.body = validated;
});

const validateOfferCreate = createValidationMiddleware((req) => {
  const type = sanitizeEnum(req.body.type, OFFER_TYPES, "type", {
    required: true,
  });

  const validated = {
    name: sanitizeString(req.body.name, "name", {
      required: true,
      maxLength: 200,
    }),
    badgeText: sanitizeOptionalPlainText(req.body.badgeText, "badgeText", {
      maxLength: 60,
    }),
    description: sanitizeOptionalPlainText(req.body.description, "description", {
      maxLength: 5000,
    }),
    type,
    startsAt: sanitizeDate(req.body.startsAt, "startsAt"),
    endsAt: sanitizeDate(req.body.endsAt, "endsAt"),
    showOnHomepage: sanitizeBoolean(req.body.showOnHomepage, "showOnHomepage"),
    displayOrder: sanitizeNumber(req.body.displayOrder, "displayOrder", {
      min: 0,
      integer: true,
    }),
    isActive: sanitizeBoolean(req.body.isActive, "isActive"),
    estimatedMarginAfterDiscount: sanitizeNumber(
      req.body.estimatedMarginAfterDiscount,
      "estimatedMarginAfterDiscount",
      {}
    ),
  };

  if (Object.prototype.hasOwnProperty.call(req.body, "discountPercent")) {
    validated.discountPercent = sanitizeNumber(
      req.body.discountPercent,
      "discountPercent",
      { min: 0, max: 100 }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "discountAmount")) {
    validated.discountAmount = sanitizeNumber(
      req.body.discountAmount,
      "discountAmount",
      { min: 0 }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "minCartValue")) {
    validated.minCartValue = sanitizeNumber(
      req.body.minCartValue,
      "minCartValue",
      { min: 0 }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "triggerProduct")) {
    validated.triggerProduct = sanitizeObjectId(req.body.triggerProduct, "triggerProduct");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "rewardProduct")) {
    validated.rewardProduct = sanitizeObjectId(req.body.rewardProduct, "rewardProduct");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "rewardQuantity")) {
    validated.rewardQuantity = sanitizeNumber(
      req.body.rewardQuantity,
      "rewardQuantity",
      { min: 1, integer: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "triggerQuantity")) {
    validated.triggerQuantity = sanitizeNumber(
      req.body.triggerQuantity,
      "triggerQuantity",
      { min: 1, integer: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "products")) {
    if (!Array.isArray(req.body.products)) {
      fail("products must be an array");
    }

    validated.products = req.body.products.map((productId, index) =>
      sanitizeObjectId(productId, `products[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "applicableCategories")) {
    if (!Array.isArray(req.body.applicableCategories)) {
      fail("applicableCategories must be an array");
    }

    validated.applicableCategories = req.body.applicableCategories
      .map((category) => sanitizeOptionalPlainText(category, "applicableCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedProducts")) {
    if (!Array.isArray(req.body.excludedProducts)) {
      fail("excludedProducts must be an array");
    }

    validated.excludedProducts = req.body.excludedProducts.map((productId, index) =>
      sanitizeObjectId(productId, `excludedProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedCategories")) {
    if (!Array.isArray(req.body.excludedCategories)) {
      fail("excludedCategories must be an array");
    }

    validated.excludedCategories = req.body.excludedCategories
      .map((category) => sanitizeOptionalPlainText(category, "excludedCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxApplicationsPerUser")) {
    validated.maxApplicationsPerUser = sanitizeNumber(
      req.body.maxApplicationsPerUser,
      "maxApplicationsPerUser",
      { min: 1, integer: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxApplicationsTotal")) {
    validated.maxApplicationsTotal = sanitizeNumber(
      req.body.maxApplicationsTotal,
      "maxApplicationsTotal",
      { min: 1, integer: true }
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "bannerImage")) {
    validated.bannerImage = sanitizeOptionalPlainText(req.body.bannerImage, "bannerImage", { maxLength: 2000 });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "themeColor")) {
    validated.themeColor = sanitizeOptionalPlainText(req.body.themeColor, "themeColor", { maxLength: 20 });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "campaignLandingPage")) {
    validated.campaignLandingPage = sanitizeOptionalPlainText(req.body.campaignLandingPage, "campaignLandingPage", { maxLength: 200 });
  }

  if (validated.startsAt && validated.endsAt && validated.endsAt < validated.startsAt) {
    fail("endsAt must be after startsAt");
  }

  req.body = validated;
});

const validateOfferUpdate = createValidationMiddleware((req) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    updates.name = sanitizeString(req.body.name, "name", {
      maxLength: 200,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "badgeText")) {
    updates.badgeText = sanitizeOptionalPlainText(req.body.badgeText, "badgeText", {
      maxLength: 60,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
    updates.description = sanitizeOptionalPlainText(req.body.description, "description", {
      maxLength: 5000,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "type")) {
    updates.type = sanitizeEnum(req.body.type, OFFER_TYPES, "type", {
      required: false,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "discountPercent")) {
    updates.discountPercent = sanitizeNumber(req.body.discountPercent, "discountPercent", {
      min: 0,
      max: 100,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "products")) {
    if (!Array.isArray(req.body.products)) {
      fail("products must be an array");
    }

    updates.products = req.body.products.map((productId, index) =>
      sanitizeObjectId(productId, `products[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "applicableCategories")) {
    if (!Array.isArray(req.body.applicableCategories)) {
      fail("applicableCategories must be an array");
    }

    updates.applicableCategories = req.body.applicableCategories
      .map((category) => sanitizeOptionalPlainText(category, "applicableCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "startsAt")) {
    updates.startsAt = sanitizeDate(req.body.startsAt, "startsAt");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "endsAt")) {
    updates.endsAt = sanitizeDate(req.body.endsAt, "endsAt");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "showOnHomepage")) {
    updates.showOnHomepage = sanitizeBoolean(req.body.showOnHomepage, "showOnHomepage");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "displayOrder")) {
    updates.displayOrder = sanitizeNumber(req.body.displayOrder, "displayOrder", {
      min: 0,
      integer: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    updates.isActive = sanitizeBoolean(req.body.isActive, "isActive");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "estimatedMarginAfterDiscount")) {
    updates.estimatedMarginAfterDiscount = sanitizeNumber(
      req.body.estimatedMarginAfterDiscount,
      "estimatedMarginAfterDiscount",
      {}
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "discountAmount")) {
    updates.discountAmount = sanitizeNumber(req.body.discountAmount, "discountAmount", { min: 0 });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "minCartValue")) {
    updates.minCartValue = sanitizeNumber(req.body.minCartValue, "minCartValue", { min: 0 });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "triggerProduct")) {
    updates.triggerProduct = sanitizeObjectId(req.body.triggerProduct, "triggerProduct");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "rewardProduct")) {
    updates.rewardProduct = sanitizeObjectId(req.body.rewardProduct, "rewardProduct");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "rewardQuantity")) {
    updates.rewardQuantity = sanitizeNumber(req.body.rewardQuantity, "rewardQuantity", { min: 1, integer: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "triggerQuantity")) {
    updates.triggerQuantity = sanitizeNumber(req.body.triggerQuantity, "triggerQuantity", { min: 1, integer: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedProducts")) {
    if (!Array.isArray(req.body.excludedProducts)) {
      fail("excludedProducts must be an array");
    }
    updates.excludedProducts = req.body.excludedProducts.map((productId, index) =>
      sanitizeObjectId(productId, `excludedProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedCategories")) {
    if (!Array.isArray(req.body.excludedCategories)) {
      fail("excludedCategories must be an array");
    }
    updates.excludedCategories = req.body.excludedCategories
      .map((category) => sanitizeOptionalPlainText(category, "excludedCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxApplicationsPerUser")) {
    updates.maxApplicationsPerUser = sanitizeNumber(req.body.maxApplicationsPerUser, "maxApplicationsPerUser", { min: 1, integer: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxApplicationsTotal")) {
    updates.maxApplicationsTotal = sanitizeNumber(req.body.maxApplicationsTotal, "maxApplicationsTotal", { min: 1, integer: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "bannerImage")) {
    updates.bannerImage = sanitizeOptionalPlainText(req.body.bannerImage, "bannerImage", { maxLength: 2000 });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "themeColor")) {
    updates.themeColor = sanitizeOptionalPlainText(req.body.themeColor, "themeColor", { maxLength: 20 });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "campaignLandingPage")) {
    updates.campaignLandingPage = sanitizeOptionalPlainText(req.body.campaignLandingPage, "campaignLandingPage", { maxLength: 200 });
  }

  if (updates.startsAt && updates.endsAt && updates.endsAt < updates.startsAt) {
    fail("endsAt must be after startsAt");
  }

  if (Object.keys(updates).length === 0) {
    fail("At least one field is required to update");
  }

  req.body = updates;
});

const validateCouponCreate = createValidationMiddleware((req) => {
  const discountType = sanitizeEnum(req.body.discountType, ["percent", "fixed"], "discountType", {
    required: true,
  });

  const validated = {
    code: sanitizeString(req.body.code, "code", {
      required: true,
      minLength: 3,
      maxLength: 40,
    }).toUpperCase(),
    description: sanitizeOptionalPlainText(req.body.description, "description", {
      maxLength: 200,
    }),
    discountType,
    discountValue: sanitizeNumber(req.body.discountValue, "discountValue", {
      required: true,
      min: 0,
    }),
    minOrderValue: sanitizeNumber(req.body.minOrderValue, "minOrderValue", {
      min: 0,
    }),
    maxUses: sanitizeNumber(req.body.maxUses, "maxUses", {
      min: 0,
    }),
    perUserLimit: sanitizeNumber(req.body.perUserLimit, "perUserLimit", {
      min: 1,
    }),
    maxDiscountAmount: sanitizeNumber(req.body.maxDiscountAmount, "maxDiscountAmount", {
      min: 0,
    }),
    firstOrderOnly: sanitizeBoolean(req.body.firstOrderOnly, "firstOrderOnly"),
    stackable: sanitizeBoolean(req.body.stackable, "stackable"),
    autoApply: sanitizeBoolean(req.body.autoApply, "autoApply"),
    isPersonalized: sanitizeBoolean(req.body.isPersonalized, "isPersonalized"),
    startsAt: sanitizeDate(req.body.startsAt, "startsAt"),
    endsAt: sanitizeDate(req.body.endsAt, "endsAt"),
    isActive: sanitizeBoolean(req.body.isActive, "isActive"),
    issuedFor: sanitizeEnum(req.body.issuedFor, COUPON_ISSUED_FOR_VALUES, "issuedFor", {
      required: false,
    }),
  };

  if (discountType === "percent" && validated.discountValue > 100) {
    fail("discountValue must be 100 or less for percent coupons");
  }

  if (req.body.applicableProducts !== undefined) {
    if (!Array.isArray(req.body.applicableProducts)) {
      fail("applicableProducts must be an array");
    }

    validated.applicableProducts = req.body.applicableProducts.map((productId, index) =>
      sanitizeObjectId(productId, `applicableProducts[${index}]`)
    );
  }

  if (req.body.applicableCategories !== undefined) {
    if (!Array.isArray(req.body.applicableCategories)) {
      fail("applicableCategories must be an array");
    }

    validated.applicableCategories = req.body.applicableCategories
      .map((category) => sanitizeOptionalPlainText(category, "applicableCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (req.body.eligibleMemberships !== undefined) {
    if (!Array.isArray(req.body.eligibleMemberships)) {
      fail("eligibleMemberships must be an array");
    }

    validated.eligibleMemberships = req.body.eligibleMemberships
      .map((membership) => sanitizeEnum(membership, USER_MEMBERSHIP_VALUES, "eligibleMemberships[]", { required: true }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxDailyUses")) {
    validated.maxDailyUses = sanitizeNumber(req.body.maxDailyUses, "maxDailyUses", { min: 1, integer: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "userGroups")) {
    if (!Array.isArray(req.body.userGroups)) {
      fail("userGroups must be an array");
    }
    validated.userGroups = req.body.userGroups
      .map((g) => sanitizeOptionalPlainText(g, "userGroups[]", { maxLength: 60 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "requiredProducts")) {
    if (!Array.isArray(req.body.requiredProducts)) {
      fail("requiredProducts must be an array");
    }
    validated.requiredProducts = req.body.requiredProducts.map((productId, index) =>
      sanitizeObjectId(productId, `requiredProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "requiredCategories")) {
    if (!Array.isArray(req.body.requiredCategories)) {
      fail("requiredCategories must be an array");
    }
    validated.requiredCategories = req.body.requiredCategories
      .map((category) => sanitizeOptionalPlainText(category, "requiredCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedProducts")) {
    if (!Array.isArray(req.body.excludedProducts)) {
      fail("excludedProducts must be an array");
    }
    validated.excludedProducts = req.body.excludedProducts.map((productId, index) =>
      sanitizeObjectId(productId, `excludedProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedCategories")) {
    if (!Array.isArray(req.body.excludedCategories)) {
      fail("excludedCategories must be an array");
    }
    validated.excludedCategories = req.body.excludedCategories
      .map((category) => sanitizeOptionalPlainText(category, "excludedCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "stackablePriority")) {
    validated.stackablePriority = sanitizeNumber(req.body.stackablePriority, "stackablePriority", { min: 0, integer: true });
  }

  if (validated.startsAt && validated.endsAt && validated.endsAt < validated.startsAt) {
    fail("endsAt must be after startsAt");
  }

  req.body = validated;
});

const validateCouponUpdate = createValidationMiddleware((req) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
    updates.description = sanitizeOptionalPlainText(req.body.description, "description", {
      maxLength: 200,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "discountType")) {
    updates.discountType = sanitizeEnum(req.body.discountType, ["percent", "fixed"], "discountType", {
      required: false,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "discountValue")) {
    updates.discountValue = sanitizeNumber(req.body.discountValue, "discountValue", {
      min: 0,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "minOrderValue")) {
    updates.minOrderValue = sanitizeNumber(req.body.minOrderValue, "minOrderValue", {
      min: 0,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxUses")) {
    updates.maxUses = sanitizeNumber(req.body.maxUses, "maxUses", {
      min: 0,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "perUserLimit")) {
    updates.perUserLimit = sanitizeNumber(req.body.perUserLimit, "perUserLimit", {
      min: 1,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxDiscountAmount")) {
    updates.maxDiscountAmount = sanitizeNumber(req.body.maxDiscountAmount, "maxDiscountAmount", {
      min: 0,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "firstOrderOnly")) {
    updates.firstOrderOnly = sanitizeBoolean(req.body.firstOrderOnly, "firstOrderOnly");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "stackable")) {
    updates.stackable = sanitizeBoolean(req.body.stackable, "stackable");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "autoApply")) {
    updates.autoApply = sanitizeBoolean(req.body.autoApply, "autoApply");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isPersonalized")) {
    updates.isPersonalized = sanitizeBoolean(req.body.isPersonalized, "isPersonalized");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "startsAt")) {
    updates.startsAt = sanitizeDate(req.body.startsAt, "startsAt");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "endsAt")) {
    updates.endsAt = sanitizeDate(req.body.endsAt, "endsAt");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    updates.isActive = sanitizeBoolean(req.body.isActive, "isActive");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "issuedFor")) {
    updates.issuedFor = sanitizeEnum(req.body.issuedFor, COUPON_ISSUED_FOR_VALUES, "issuedFor", {
      required: false,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "applicableProducts")) {
    if (!Array.isArray(req.body.applicableProducts)) {
      fail("applicableProducts must be an array");
    }

    updates.applicableProducts = req.body.applicableProducts.map((productId, index) =>
      sanitizeObjectId(productId, `applicableProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "applicableCategories")) {
    if (!Array.isArray(req.body.applicableCategories)) {
      fail("applicableCategories must be an array");
    }

    updates.applicableCategories = req.body.applicableCategories
      .map((category) => sanitizeOptionalPlainText(category, "applicableCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "eligibleMemberships")) {
    if (!Array.isArray(req.body.eligibleMemberships)) {
      fail("eligibleMemberships must be an array");
    }

    updates.eligibleMemberships = req.body.eligibleMemberships
      .map((membership) => sanitizeEnum(membership, USER_MEMBERSHIP_VALUES, "eligibleMemberships[]", { required: true }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "maxDailyUses")) {
    updates.maxDailyUses = sanitizeNumber(req.body.maxDailyUses, "maxDailyUses", { min: 1, integer: true });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "userGroups")) {
    if (!Array.isArray(req.body.userGroups)) {
      fail("userGroups must be an array");
    }
    updates.userGroups = req.body.userGroups
      .map((g) => sanitizeOptionalPlainText(g, "userGroups[]", { maxLength: 60 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "requiredProducts")) {
    if (!Array.isArray(req.body.requiredProducts)) {
      fail("requiredProducts must be an array");
    }
    updates.requiredProducts = req.body.requiredProducts.map((productId, index) =>
      sanitizeObjectId(productId, `requiredProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "requiredCategories")) {
    if (!Array.isArray(req.body.requiredCategories)) {
      fail("requiredCategories must be an array");
    }
    updates.requiredCategories = req.body.requiredCategories
      .map((category) => sanitizeOptionalPlainText(category, "requiredCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedProducts")) {
    if (!Array.isArray(req.body.excludedProducts)) {
      fail("excludedProducts must be an array");
    }
    updates.excludedProducts = req.body.excludedProducts.map((productId, index) =>
      sanitizeObjectId(productId, `excludedProducts[${index}]`)
    );
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "excludedCategories")) {
    if (!Array.isArray(req.body.excludedCategories)) {
      fail("excludedCategories must be an array");
    }
    updates.excludedCategories = req.body.excludedCategories
      .map((category) => sanitizeOptionalPlainText(category, "excludedCategories[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "stackablePriority")) {
    updates.stackablePriority = sanitizeNumber(req.body.stackablePriority, "stackablePriority", { min: 0, integer: true });
  }

  if (updates.discountType === "percent" && Object.prototype.hasOwnProperty.call(updates, "discountValue") && updates.discountValue > 100) {
    fail("discountValue must be 100 or less for percent coupons");
  }

  if (updates.startsAt && updates.endsAt && updates.endsAt < updates.startsAt) {
    fail("endsAt must be after startsAt");
  }

  if (Object.keys(updates).length === 0) {
    fail("At least one field is required to update");
  }

  req.body = updates;
});

const validateShippingZoneCreate = createValidationMiddleware((req) => {
  const validated = {
    name: sanitizeString(req.body.name, "name", {
      required: true,
      maxLength: 120,
    }),
    deliveryFee: sanitizeNumber(req.body.deliveryFee, "deliveryFee", {
      required: true,
      min: 0,
    }),
    estimatedDays: sanitizeOptionalPlainText(req.body.estimatedDays, "estimatedDays", {
      maxLength: 80,
    }),
    freeAbove: sanitizeNumber(req.body.freeAbove, "freeAbove", {
      min: 0,
    }),
    displayOrder: sanitizeNumber(req.body.displayOrder, "displayOrder", {
      min: 0,
      integer: true,
    }),
    isActive: sanitizeBoolean(req.body.isActive, "isActive"),
  };

  if (req.body.provinces !== undefined) {
    if (!Array.isArray(req.body.provinces)) {
      fail("provinces must be an array");
    }

    validated.provinces = req.body.provinces
      .map((province) => sanitizeOptionalPlainText(province, "provinces[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  req.body = validated;
});

const validateShippingZoneUpdate = createValidationMiddleware((req) => {
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    updates.name = sanitizeString(req.body.name, "name", {
      maxLength: 120,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "deliveryFee")) {
    updates.deliveryFee = sanitizeNumber(req.body.deliveryFee, "deliveryFee", {
      min: 0,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "estimatedDays")) {
    updates.estimatedDays = sanitizeOptionalPlainText(req.body.estimatedDays, "estimatedDays", {
      maxLength: 80,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "freeAbove")) {
    updates.freeAbove = sanitizeNumber(req.body.freeAbove, "freeAbove", {
      min: 0,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "displayOrder")) {
    updates.displayOrder = sanitizeNumber(req.body.displayOrder, "displayOrder", {
      min: 0,
      integer: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    updates.isActive = sanitizeBoolean(req.body.isActive, "isActive");
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "provinces")) {
    if (!Array.isArray(req.body.provinces)) {
      fail("provinces must be an array");
    }

    updates.provinces = req.body.provinces
      .map((province) => sanitizeOptionalPlainText(province, "provinces[]", { maxLength: 120 }))
      .filter(Boolean);
  }

  if (Object.keys(updates).length === 0) {
    fail("At least one field is required to update");
  }

  req.body = updates;
});

module.exports = {
  validateObjectIdParam,
  validateAuthRegister,
  validateAuthLogin,
  validateOtpVerify,
  validateEmailOnly,
  validateGoogleAuth,
  validateFacebookAuth,
  validateVerifyResetOtp,
  validateResetPassword,
  validateChangePassword,
  validateProductCreate,
  validateProductUpdate,
  validateBulkProductAction,
  validateImageUploadRequest,
  validateImageReorder,
  validateDeleteAllImages,
  validateDropCreate,
  validateDropUpdate,
  validateOrderCreate,
  validateOrderStatusUpdate,
  validateBulkOrderStatus,
  validateBannerCreate,
  validateBannerUpdate,
  validateManualPaymentReference,
  validateManualPaymentProof,
  validateManualPaymentDecision,
  validateSampleCardPayment,
  validateAdminUserStatus,
  validateCartAdd,
  validateCartUpdate,
  validateWishlistAdd,
  validateBulkUserTag,
  validateNotificationMessage,
  validateNotificationUpdate,
  validateContactSubmission,
  validateContactUpdate,
  validateReviewCreate,
  validateReviewUpdate,
  validateReviewFlag,
  validateReviewCategorize,
  validateBulkReviewAction,
  validateSuperAdminCreate,
  validateSuperAdminPermissions,
  validateSuperAdminActivation,
  validateNewsletterSubscribe,
  validateOfferCreate,
  validateOfferUpdate,
  validateCouponCreate,
  validateCouponUpdate,
  validateShippingZoneCreate,
  validateShippingZoneUpdate,
};
