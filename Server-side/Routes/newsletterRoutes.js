const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin } = require("../Middlewares/admin-middleware");
const ctrl = require("../Controllers/newsletterController");

const router = express.Router();

router.post("/subscribe", ctrl.subscribe);
router.get("/admin/subscribers", authMiddleware, requireAdmin, ctrl.getSubscribers);

module.exports = router;
