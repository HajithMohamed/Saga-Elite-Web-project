const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requireSuperAdmin } = require("../Middlewares/admin-middleware");
const adminLogMiddleware = require("../Middlewares/admin-log-middleware");
const ctrl = require("../Controllers/siteConfigController");

const router = express.Router();

router.get("/about", ctrl.getAboutPageConfig);
router.get("/:key", ctrl.getConfig);
router.put("/:key", authMiddleware, requireSuperAdmin, adminLogMiddleware, ctrl.upsertConfig);

module.exports = router;
