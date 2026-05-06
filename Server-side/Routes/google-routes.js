const express = require("express");
const { googleAuth } = require("../Controllers/google-auth-controller");
const { validateGoogleAuth } = require("../Middlewares/request-validation");

const router = express.Router();

router.post("/auth", validateGoogleAuth, googleAuth);

module.exports = router;
