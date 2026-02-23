const express = require("express");
const {registerUser,login,otpVerify,logout,resendOTP,forgotPassword,resendResetPasswordOtp,resetPassword,changePassword} = require("../Controllers/auth-controller");

const authMiddleware = require("../Middlewares/auth-middleware")

const router = express.Router();

router.post("/register",registerUser);
router.post('/login', login);
router.post('/logout', authMiddleware,logout);
router.post('/otp-verify', otpVerify);
router.post('/resend-otp', resendOTP);
router.post('/change-password', authMiddleware,changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-reset-otp', resendResetPasswordOtp);



module.exports = router