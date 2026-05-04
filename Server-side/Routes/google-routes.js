const express = require("express");
const { googleSignIn, googleSignUp } = require("../Controllers/google-auth-controller");
const { validateGoogleAuth } = require("../Middlewares/request-validation");

const router = express.Router();

router.post("/sign-in", validateGoogleAuth, googleSignIn);
router.post("/sign-up", validateGoogleAuth, googleSignUp);

module.exports = router;
