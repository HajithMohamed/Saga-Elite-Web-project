const express = require("express");
const { googleSignIn, googleSignUp } = require("../Controllers/google-auth-controller");

const router = express.Router();

router.post("/sign-in", googleSignIn);
router.post("/sign-up", googleSignUp);

module.exports = router;
