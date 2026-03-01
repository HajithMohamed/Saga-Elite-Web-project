import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import CommonForm from "@/components/common-components/CommonForm";
import { verifyOtpFormControls } from "@/config";

const VerifyOtp = () => {
  const [formData, setFormData] = useState({ otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = formData.otp;

    if (!otpString || otpString.length < 4) {
      toast({
        title: "Incomplete Code",
        description: "Please enter all 4 digits of your OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // TODO: perform OTP verification action here
    console.log("Submitting verify OTP data:", otpString);

    // Simulated API response
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Verified",
        description: "Your account is successfully verified.",
        variant: "success",
      });
      // Example of where you might route them next:
      // navigate("/auth/login");
    }, 1500);
  };
  
  const handleResend = () => {
    toast({
      title: "OTP Resent",
      description: "A fresh verification code has been sent to your email.",
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Verify OTP</h1>
        <p className="text-gray-400">
          Please enter the 4-digit code sent to your email
        </p>
      </div>

      <div className="mt-8">
        <CommonForm
          formControls={verifyOtpFormControls}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          buttonText={isLoading ? "Verifying..." : "Verify OTP"}
          buttonDisabled={isLoading}
          buttonClass="bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow w-full mt-8 disabled:opacity-50"
        />
      </div>

      <p className="text-sm text-center mt-6 text-gray-400">
        Didn't receive code?{" "}
        <button 
           type="button"
           onClick={handleResend}
           className="text-[#D4AF37] hover:underline bg-transparent border-none cursor-pointer p-0 ml-1"
        >
          Resend OTP
        </button>
      </p>

      <p className="text-sm text-center mt-4">
        <Link to="/auth/login" className="text-[#D4AF37] hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default VerifyOtp;
