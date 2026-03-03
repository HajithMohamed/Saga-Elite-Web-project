import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "@/hooks/use-toast";
import CommonForm from "@/components/common-components/CommonForm";
import { verifyOtpFormControls } from "@/config";
import { verifyResetOtpAction, resendResetPasswordOtpAction } from "@/store/auth-slice";

const VerifyResetOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const email = location.state?.email;

  const [formData, setFormData] = useState({
    otp: "",
  });
  const [errors, setErrors] = useState({ otp: "" });
  const [isLoading, setIsLoading] = useState(false);

  if (!email) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#D4AF37]">Invalid Session</h2>
        <p className="text-gray-400 mb-6">Please start the forgot password process again.</p>
        <Link to="/auth/forgot-password" title="Go to Forgot Password">
          <button className="bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 px-6 rounded shadow">
            Go Back
          </button>
        </Link>
      </div>
    );
  }

  React.useEffect(() => {
    if (formData.otp && formData.otp.length < 4) {
      setErrors(prev => ({ ...prev, otp: "Please enter 4-digit code." }));
    } else {
      setErrors(prev => ({ ...prev, otp: "" }));
    }
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // check for validation errors first
    if (errors.otp) {
      toast({
        title: "Validation Error",
        description: errors.otp,
        variant: "destructive",
      });
      return;
    }
    if (!formData.otp || formData.otp.length < 4) {
      toast({
        title: "Incomplete Code",
        description: "Please enter the 4-digit code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(verifyResetOtpAction({ email, otp: formData.otp })).unwrap();
      toast({
        title: "OTP Verified",
        description: "You can now set your new password.",
        variant: "success",
      });
      navigate("/auth/set-new-password", { state: { email, otp: formData.otp } });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error || "Invalid or expired OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await dispatch(resendResetPasswordOtpAction({ email })).unwrap();
      toast({
        title: "OTP Resent",
        description: "A new reset code has been sent to your email.",
      });
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: error || "Failed to resend OTP",
        variant: "destructive",
      });
    }
  };

  const inputClasses = "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans text-center text-2xl tracking-widest";
  const labelClasses = "text-white";
  const buttonClasses = "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow w-full";

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-2 text-[#D4AF37]">Verify Reset Code</h1>
        <p className="text-gray-400">
          Enter the code sent to <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      <CommonForm
        formControls={verifyOtpFormControls}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        buttonText="Verify Code"
        isLoading={isLoading}
        inputClass={inputClasses}
        labelClass={labelClasses}
        buttonClass={buttonClasses}
        formErrors={errors}
      />

      <div className="mt-6 text-center text-white text-sm">
        <p className="text-gray-400">
          Didn't receive the code?{" "}
          <button
            onClick={handleResend}
            className="text-[#D4AF37] hover:underline font-medium"
          >
            Resend
          </button>
        </p>
        <div className="mt-4">
          <Link to="/auth/login" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetOtp;
