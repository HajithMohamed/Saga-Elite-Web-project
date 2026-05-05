const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware, requirePermission } = require("../Middlewares/admin-middleware");
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
router.post("/create-drop", authMiddleware, adminMiddleware, requirePermission("drops"), validateDropCreate, createDrop);
router.patch("/update-drop/:slug", authMiddleware, adminMiddleware, requirePermission("drops"), validateDropUpdate, updateDrop);
router.patch("/archive-drop/:slug", authMiddleware, adminMiddleware, requirePermission("drops"), archiveDrop);
router.delete("/delete-drop/:slug", authMiddleware, adminMiddleware, requirePermission("drops"), deleteDrop);

module.exports = router;
