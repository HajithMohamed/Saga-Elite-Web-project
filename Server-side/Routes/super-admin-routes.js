const express = require("express");
const superAdminController = require("../Controllers/super-admin-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireSuperAdmin, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const paginatedResult = require("../Middlewares/pagination-middleware");
const Product = require("../Models/Product");
const {
  validateObjectIdParam,
  validateSuperAdminCreate,
  validateSuperAdminPermissions,
  validateSuperAdminActivation,
} = require("../Middlewares/request-validation");

const router = express.Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);
router.use(adminLogMiddleware);

router.route("/admins")
  .post(validateSuperAdminCreate, superAdminController.createAdmin)
  .get(superAdminController.listAdmins);

router.patch("/admins/:id/permissions", validateObjectIdParam("id", "admin id"), validateSuperAdminPermissions, superAdminController.updateAdminPermissions);
router.patch("/admins/:id/deactivate", validateObjectIdParam("id", "admin id"), validateSuperAdminActivation, superAdminController.toggleAdminActiveStatus);

router.get("/logs", superAdminController.getActivityLogs);
router.get("/stats", superAdminController.getSystemStats);
router.get("/products", requirePermission("products"), paginatedResult(Product), require("../Controllers/product-controller").getAllProducts);
router.get("/orders", requirePermission("orders"), require("../Controllers/order-controller").getAllOrders);
router.get("/users", requirePermission("users"), require("../Controllers/user-controller").getAllUsers);
router.get("/notifications", requirePermission("notifications"), require("../Controllers/notification-controller").getAllNotifications);
router.get("/drops", requirePermission("drops"), require("../Controllers/drop-controller").getAllDrops);

module.exports = router;
