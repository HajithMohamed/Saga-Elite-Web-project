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

module.exports = {
  validateObjectIdParam,
  validateAuthRegister,
  validateAuthLogin,
  validateOtpVerify,
  validateEmailOnly,
  validateChangePassword,
};