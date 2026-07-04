const express = require("express");
const {
  registerUser,
  login,
  otpVerify,
  logout,
  resendOTP,
  forgotPassword,
  resendResetPasswordOtp,
  verifyResetOtp,
  resetPassword,
  changePassword,
  checkAuth,
  checkGuest,
  registerGuest,
  verifyTwoFactor,
  resendTwoFactorOtp,
} = require("../Controllers/auth-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");
const { loginLimiter } = require("../Middlewares/rateLimitinMiddleware");
const {
  validateAuthRegister,
  validateAuthLogin,
  validateOtpVerify,
  validateEmailOnly,
  validateChangePassword,
  validateVerifyResetOtp,
  validateResetPassword,
} = require("../Middlewares/request-validation");

const router = express.Router();

router.get("/check-auth", optionalAuthMiddleware, checkAuth);
router.post("/register", validateAuthRegister, registerUser);
router.post("/login", loginLimiter, validateAuthLogin, login);
router.post("/logout", authMiddleware, logout);
router.post("/otp-verify", validateOtpVerify, otpVerify);
router.post("/resend-otp", validateEmailOnly, resendOTP);
router.post("/change-password", authMiddleware, validateChangePassword, changePassword);
router.post("/forgot-password", validateEmailOnly, forgotPassword);
router.post("/verify-reset-otp", validateVerifyResetOtp, verifyResetOtp);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/resend-reset-otp", validateEmailOnly, resendResetPasswordOtp);
router.post("/check-guest", validateEmailOnly, checkGuest);
router.post("/register-guest", validateEmailOnly, registerGuest);
router.post("/verify-2fa", verifyTwoFactor);
router.post("/resend-2fa", resendTwoFactorOtp);

module.exports = router;
