const AdminLog = require("../Models/AdminLog");
const logger = require("../Utils/logger");
const { isAdminRole } = require("../Utils/admin-roles");

/**
 * Route-path → log category mapping.
 * Falls back to "system" if no match is found.
 */
const CATEGORY_MAP = [
  [/\/product/i, "product"],
  [/\/order/i, "order"],
  [/\/payment/i, "payment"],
  [/\/manual-payment/i, "payment"],
  [/\/user/i, "user"],
  [/\/drop/i, "drop"],
  [/\/notification/i, "notification"],
  [/\/review/i, "review"],
  [/\/admin/i, "admin"],
  [/\/auth/i, "auth"],
];

const resolveCategory = (url) => {
  for (const [pattern, category] of CATEGORY_MAP) {
    if (pattern.test(url)) return category;
  }
  return "system";
};

/**
 * Middleware that auto-logs successful mutating requests (POST, PUT, PATCH, DELETE)
 * made by admins or super_admins. Must be registered AFTER authMiddleware and adminMiddleware.
 */
const adminLogMiddleware = (req, res, next) => {
  // Only track mutating operations
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Hook into the finish event so we only log successful actions.
  // The handler must never throw — an unhandled rejection here kills the server.
  res.on("finish", () => {
    void (async () => {
      try {
        if (res.statusCode < 200 || res.statusCode >= 300) return;

        const adminId = req.userInfo?._id;
        if (!adminId || !isAdminRole(req.userInfo?.role)) return;

        let action = `Performed ${req.method} on ${req.baseUrl}${req.path}`;

        const body = req.body && typeof req.body === "object" ? req.body : null;
        let resourceId = req.params?.id || body?._id || body?.id || null;

        if (req.adminAction) {
          action = req.adminAction;
        }

        if (req.adminResourceId) {
          resourceId = req.adminResourceId;
        }

        const category = req.adminCategory || resolveCategory(req.originalUrl);

        await AdminLog.create({
          adminId,
          action,
          category,
          details: req.adminDetails || null,
          ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
          resourceId: resourceId != null ? String(resourceId) : undefined,
          method: req.method,
          route: req.originalUrl,
        });
      } catch (error) {
        logger.error("Failed to write to AdminLog", { error: error?.message || error });
      }
    })();
  });

  next();
};

module.exports = adminLogMiddleware;
