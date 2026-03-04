import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "@/hooks/use-toast";
import CommonForm from "@/components/common-components/CommonForm";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { setPasswordFormControls } from "@/config";
import { resetPasswordAction } from "@/store/auth-slice";

const SetNewPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { email, otp } = location.state || {};

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // validate form data whenever it changes
  useEffect(() => {
    const newErrors = {};
    const pwd = formData.newPassword;

    // complexity: min 8, uppercase, lowercase, number, symbol — matches server Mongoose validator
    if (pwd) {
      if (
        pwd.length < 8 ||
        !/[A-Z]/.test(pwd) ||
        !/[a-z]/.test(pwd) ||
        !/\d/.test(pwd) ||
        !/[@$!%*?&]/.test(pwd)
      ) {
        newErrors.newPassword =
          "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&).";
      }
    }

    if (
      formData.confirmPassword &&
      pwd &&
      pwd !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
  }, [formData]);

  if (!email || !otp) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-[#D4AF37]">Invalid Session</h2>
        <p className="text-gray-400 mb-6">Please start the forgot password process again.</p>
        <Link to="/auth/forgot-password">
          <button className="bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 px-6 rounded shadow">
            Go Back
          </button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // abort if any validation errors detected
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please resolve the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(resetPasswordAction({
        email,
        otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })).unwrap();

      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please login.",
        variant: "success",
      });
      
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error || "Something went wrong while resetting your password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans";
  const labelClasses = "text-white";
  const buttonClasses = "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow w-full";

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-2 text-[#D4AF37]">Set New Password</h1>
        <p className="text-gray-400">
          Create a strong password for <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      <CommonForm
        formControls={setPasswordFormControls}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        buttonText="Update Password"
        isLoading={isLoading}
        inputClass={inputClasses}
        labelClass={labelClasses}
        buttonClass={buttonClasses}
      />

      {/* password strength meter */}
      <PasswordStrengthMeter password={formData.newPassword} />

      <div className="mt-6 text-center text-white text-sm">
        <Link to="/auth/login" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
          Cancel and return to Login
        </Link>
      </div>
    </div>
  );
};

export default SetNewPassword;
