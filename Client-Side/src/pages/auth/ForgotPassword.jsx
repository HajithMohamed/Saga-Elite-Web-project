import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import CommonForm from "@/components/common-components/CommonForm";
import { forgotPasswordControls } from "@/config";
import { forgotPasswordAction } from "@/store/auth-slice";
import { useDispatch } from "react-redux";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // simple email validation
  useEffect(() => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Invalid form",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await dispatch(forgotPasswordAction(formData)).unwrap();
      toast({
        title: "Reset email sent",
        description: response.message || "Check your email for the reset code.",
        variant: "success",
      });
      navigate("/auth/reset-password-otp", { state: { email: formData.email } });
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.response?.data?.message || err.message || "Failed to send reset email";
      toast({ title: "Request failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans";
  const labelClasses = "text-white";
  const buttonClasses = "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow";

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#D4AF37]">Forgot Password</h2>
      <p className="text-gray-400 text-center mb-8">Enter your email address and we'll send you a reset code.</p>

      <CommonForm
        formControls={forgotPasswordControls}
        formData={formData}
        setFormData={setFormData}
        formErrors={errors}
        onSubmit={handleSubmit}
        buttonText={isLoading ? "Sending…" : "Send Reset Code"}
        buttonDisabled={isLoading}
        inputClass={inputClasses}
        labelClass={labelClasses}
        buttonClass={buttonClasses}
      />

      <p className="text-sm text-center mt-4">
        Remember your password?{" "}
        <Link to="/auth/login" className="text-[#D4AF37] hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
