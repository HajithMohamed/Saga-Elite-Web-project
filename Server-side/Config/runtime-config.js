const AppError = require("../Utils/appError");

const requireProductionConfig = (condition, message) => {
  if (process.env.NODE_ENV === "production" && !condition) {
    throw new AppError(message, 500);
  }
};

const validateRuntimeConfig = () => {
  const jwtSecret = String(process.env.JWT_SECRET || "");

  if (!jwtSecret) {
    throw new AppError("JWT_SECRET is required in environment variables", 500);
  }

  if (jwtSecret.length < 32) {
    throw new AppError("JWT_SECRET must be at least 32 characters long", 500);
  }

  requireProductionConfig(
    process.env.FRONTEND_URL || process.env.FRONTEND_URLS || process.env.CLIENT_URL,
    "Production CORS requires FRONTEND_URL, FRONTEND_URLS, or CLIENT_URL to be configured"
  );
};

module.exports = {
  validateRuntimeConfig,
};
