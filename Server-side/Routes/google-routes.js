const express = require("express");
const { googleAuth } = require("../Controllers/google-auth-controller");

const router = express.Router();

// unified sign-in & sign-up — server decides based on whether the email already exists
router.post("/google-auth", googleAuth);

module.exports = router;