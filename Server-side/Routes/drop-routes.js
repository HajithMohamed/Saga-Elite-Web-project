const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin: adminMiddleware } = require("../Middlewares/admin-middleware");
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
router.post("/create-drop", authMiddleware, adminMiddleware, validateDropCreate, createDrop);
router.patch("/update-drop/:slug", authMiddleware, adminMiddleware, validateDropUpdate, updateDrop);
router.patch("/archive-drop/:slug", authMiddleware, adminMiddleware, archiveDrop);
router.delete("/delete-drop/:slug", authMiddleware, adminMiddleware, deleteDrop);

module.exports = router;
