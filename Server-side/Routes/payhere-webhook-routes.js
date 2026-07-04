const express = require("express");
const { handlePayHereNotify } = require("../Controllers/manualPaymentController");

const router = express.Router();

// PayHere posts the notify callback as application/x-www-form-urlencoded. The
// app's global body parser is express.json only, so parse urlencoded locally
// here. This endpoint is server-to-server (no auth, no CSRF) and is secured by
// the md5sig signature check inside the controller.
router.post(
  "/",
  express.urlencoded({ extended: false, limit: "10kb" }),
  handlePayHereNotify
);

module.exports = router;
