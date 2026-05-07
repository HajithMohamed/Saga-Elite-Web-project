const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin, requireSuperAdmin } = require("../Middlewares/admin-middleware");
const ctrl = require("../Controllers/siteConfigController");

const router = express.Router();

router.get("/about", ctrl.getAboutPageConfig);
router.get("/:key", ctrl.getConfig);
router.put("/:key", authMiddleware, requireSuperAdmin, ctrl.upsertConfig);

module.exports = router;
