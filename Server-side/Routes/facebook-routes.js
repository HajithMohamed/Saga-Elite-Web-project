const express = require("express");
const { facebookAuth } = require("../Controllers/facebook-auth-controller");
const { validateFacebookAuth } = require("../Middlewares/request-validation");

const router = express.Router();

// Three aliases so the client can call sign-in / sign-up / auth depending
// on context. The controller handles both new and existing users
// transparently — no flow difference between the three endpoints.
router.post("/sign-in", validateFacebookAuth, facebookAuth);
router.post("/sign-up", validateFacebookAuth, facebookAuth);
router.post("/auth", validateFacebookAuth, facebookAuth);

module.exports = router;
