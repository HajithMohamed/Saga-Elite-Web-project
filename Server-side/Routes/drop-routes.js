const express = require('express');
const router = express.Router();

const {createDrop} = require("../Controllers/drop-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");

router.post("/create-drop", authMiddleware, adminMiddleware, createDrop);

module.exports = router;