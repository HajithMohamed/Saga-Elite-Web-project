const express = require("express");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireSuperAdmin } = require("../Middlewares/admin-middleware");
const { exportCustomersCsv } = require("../Controllers/user-controller");

const router = express.Router();

router.get("/users/export", authMiddleware, requireSuperAdmin, exportCustomersCsv);

module.exports = router;