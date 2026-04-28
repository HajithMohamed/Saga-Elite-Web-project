const express = require("express");
const superAdminController = require("../Controllers/super-admin-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireSuperAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");

const router = express.Router();

/**
 * All routes here are protected by the Super Admin check.
 * This router level enforces authentication AND super admin role,
 * then pushes successful mutate-requests to the adminLogMiddleware.
 */
router.use(authMiddleware);
router.use(requireSuperAdmin);
router.use(adminLogMiddleware);

// --- Super Admin Actions ---

// Manage admin accounts
router.route("/admins")
  .post(superAdminController.createAdmin)
  .get(superAdminController.listAdmins);

// Update admin permissions
router.patch("/admins/:id/permissions", superAdminController.updateAdminPermissions);

// Deactivate/activate an existing admin
router.patch("/admins/:id/deactivate", superAdminController.toggleAdminActiveStatus);

// View all combined activity logs across the platform
router.get("/logs", superAdminController.getActivityLogs);

// Get system stats
router.get("/stats", superAdminController.getSystemStats);

// Routes that regular admins can access based on permissions
router.get("/products", requirePermission("products"), require("../Controllers/product-controller").getAllProducts);
router.get("/orders", requirePermission("orders"), require("../Controllers/order-controller").getAllOrders);
router.get("/users", requirePermission("users"), require("../Controllers/user-controller").getAllUsers);
router.get("/notifications", requirePermission("notifications"), require("../Controllers/notification-controller").getAllNotifications);
router.get("/drops", requirePermission("drops"), require("../Controllers/drop-controller").getAllDrops);

module.exports = router;
