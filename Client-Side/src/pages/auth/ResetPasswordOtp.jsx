import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import CommonForm from "@/components/common-components/CommonForm";
import { resetPasswordOtpFormControls } from "@/config";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordAction, resendResetPasswordOtpAction } from "@/store/auth-slice";

const ResetPasswordOtp = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    otp: "",
    email: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Get email from location state (passed from forgot password)
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  // run validations anytime form data changes
  useEffect(() => {
    const newErrors = {};
    const { otp, newPassword, confirmPassword } = formData;

    if (otp && otp.length < 4) {
      newErrors.otp = "Please enter all 4 digits of your OTP.";
    }

    // password complexity rules match SetNewPassword
    if (newPassword) {
      if (
        newPassword.length < 8 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
      ) {
        newErrors.newPassword =
          "Password must be at least 8 characters and include uppercase, lowercase, and a symbol.";
      }
    }

    if (confirmPassword && newPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // abort if any dynamic validation errors exist
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please resolve the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.otp || formData.otp.length < 4) {
      toast({
        title: "Incomplete Code",
        description: "Please enter all 4 digits of your OTP.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.newPassword) {
      toast({
        title: "Invalid Password",
        description: "Please provide a new password.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.confirmPassword) {
      toast({
        title: "Confirm Password",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    dispatch(resetPasswordAction({
      email: formData.email,
      otp: formData.otp,
      newPassword: formData.newPassword
    })).then((result) => {
      if (result.payload?.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. Please login with your new password.",
          variant: "success",
        });
        setTimeout(() => {
          navigate("/auth/login");
        }, 2000);
      } else {
        const error = result.payload || "Failed to reset password";
        toast({
          title: "Reset Failed",
          description: error,
          variant: "destructive",
        });
      }
    });
  };

  const handleResendOtp = () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please provide your email address.",
        variant: "destructive",
      });
      return;
    }

    dispatch(resendResetPasswordOtpAction({ email: formData.email })).then((result) => {
      if (result.payload?.success) {
        toast({
          title: "OTP Resent",
          description: "A new reset code has been sent to your email.",
          variant: "success",
        });
      } else {
        const error = result.payload || "Failed to resend OTP";
        toast({
          title: "Resend Failed",
          description: error,
          variant: "destructive",
        });
      }
    });
  };

  // shared classes for inputs/buttons to mimic SetNewPassword styling
  const inputClasses = "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans";
  const labelClasses = "text-white";
  const buttonClasses = "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow w-full";

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#0a0a0a] rounded-lg shadow-2xl border border-[#1a1a1a] p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter the code from your email and your new password.</p>
        </div>

        <CommonForm
          formControls={resetPasswordOtpFormControls}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          buttonText={isLoading ? "Resetting…" : "Reset Password"}
          buttonDisabled={isLoading}
          inputClass={inputClasses}
          labelClass={labelClasses}
          buttonClass={buttonClasses}
          formErrors={errors}
        />

        <div className="mt-6 text-center">
          <button
            onClick={handleResendOtp}
            disabled={isLoading}
            className="text-[#D4AF37] hover:text-[#b8941f] text-sm underline disabled:opacity-50"
          >
            Didn't receive the code? Resend
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/auth/login"
            className="text-gray-400 hover:text-[#D4AF37] text-sm"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordOtp;