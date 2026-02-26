const express = require("express")
const {googleAuth} = require("../Controllers/google-auth-controller")

const router = express.Router()

router.post("google-sign-up",googleAuth);

module.exports = router