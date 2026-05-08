const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const { validateDropCreate, validateDropUpdate } = require("../Middlewares/request-validation");
const {
  createDrop,
  getAllDrops,
  getSingleDrop,
  updateDrop,
  deleteDrop,
  archiveDrop,
} = require("../Controllers/drop-controller");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");

const router = express.Router();

router.get("/get-all-drops", optionalAuthMiddleware, getAllDrops);
router.get("/get-single-drop/:slug", getSingleDrop);
router.post("/create-drop", authMiddleware, adminMiddleware, requirePermission("drops"), validateDropCreate, adminLogMiddleware, createDrop);
router.patch("/update-drop/:slug", authMiddleware, adminMiddleware, requirePermission("drops"), validateDropUpdate, adminLogMiddleware, updateDrop);
router.patch("/archive-drop/:slug", authMiddleware, adminMiddleware, requirePermission("drops"), adminLogMiddleware, archiveDrop);
router.delete("/delete-drop/:slug", authMiddleware, adminMiddleware, requirePermission("drops"), adminLogMiddleware, deleteDrop);

module.exports = router;
