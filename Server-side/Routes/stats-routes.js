const express = require("express");
const { getPublicStats } = require("../Controllers/stats-controller");

const router = express.Router();

// Public, read-only store statistics for the homepage.
router.get("/public", getPublicStats);

module.exports = router;
