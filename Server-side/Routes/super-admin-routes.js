const express = require("express");
const superAdminController = require("../Controllers/super-admin-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireSuperAdmin } = require("../Middlewares/admin-middleware");
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

// Deactivate/activate an existing admin
router.patch("/admins/:id/deactivate", superAdminController.toggleAdminActiveStatus);

// View all combined activity logs across the platform
router.get("/logs", superAdminController.getActivityLogs);

module.exports = router;
