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

  // Hook into the finish event so we only log successful actions
  res.on("finish", async () => {
    // Only log if request was successful (2XX)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (req.userInfo && isAdminRole(req.userInfo.role)) {
        
        let action = `Performed ${req.method} on ${req.baseUrl}${req.path}`;
        
        // Attempt to extract typical resource IDs (e.g., /api/products/12345)
        let resourceId = req.params.id || req.body?._id || req.body?.id || null;

        // Custom action descriptions can be injected via req.adminAction earlier in the pipeline if needed
        if (req.adminAction) {
          action = req.adminAction;
        }
        
        if (req.adminResourceId) {
          resourceId = req.adminResourceId;
        }

        // Resolve category from the route path
        const category = req.adminCategory || resolveCategory(req.originalUrl);

        try {
          await AdminLog.create({
            adminId: req.userInfo._id,
            action,
            category,
            details: req.adminDetails || null,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
            resourceId: resourceId?.toString(),
            method: req.method,
            route: req.originalUrl,
          });
        } catch (error) {
          logger.error("Failed to write to AdminLog", { error });
        }
      }
    }
  });

  next();
};

module.exports = adminLogMiddleware;
