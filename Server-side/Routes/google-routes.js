const express = require("express");
const { googleAuth } = require("../Controllers/google-auth-controller");
const { validateGoogleAuth } = require("../Middlewares/request-validation");

const router = express.Router();

// Backwards-compatible endpoints: the client expects `/google/sign-in` and
// `/google/sign-up`. The controller handles both sign-in and sign-up flows
// transparently, so expose aliases here.
router.post("/sign-in", validateGoogleAuth, googleAuth);
router.post("/sign-up", validateGoogleAuth, googleAuth);
router.post("/auth", validateGoogleAuth, googleAuth);

module.exports = router;
