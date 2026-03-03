import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CommonForm from "@/components/common-components/CommonForm";
import { registerFormControl } from "@/config";
import { Mail, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { registerUserAction, googleAuthAction } from "@/store/auth-slice";
import { useDispatch } from "react-redux";
import { toast } from "@/hooks/use-toast";
import { useGoogleLogin } from "@react-oauth/google";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // simple validations run on every change
  useEffect(() => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // password must be at least 8 chars and contain uppercase, lowercase, and a symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, and a symbol.";
    }
    if (
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // prevent submission if inline validation failed
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Invalid form",
        description: "Please fix the highlighted errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await dispatch(registerUserAction(formData)).unwrap();
      // success response should include message about email verification
      toast({
        title: "Registered",
        description:
          response.message ||
          "Registration successful. Check your email for verification code.",
        variant: "success",
      });
      // optionally redirect to login page or OTP page
      navigate("/auth/verify-otp");
    } catch (err) {
      // thunk.rejectWithValue returns a string message; unwrap will throw that
      const msg = typeof err === 'string' ? err : err?.response?.data?.message || err.message || "Registration failed";
      console.error("registerUserAction error", err);
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ access_token }) => {
    setIsLoading(true);
    try {
      const response = await dispatch(googleAuthAction({ accessToken: access_token })).unwrap();
      toast({
        title: "Signed in with Google",
        description: response.message || "Welcome!",
        variant: "success",
      });
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Google sign-in failed";
      toast({ title: "Google sign-in failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: handleGoogleSuccess,
    onError: () =>
      toast({ title: "Google sign-in failed", description: "Could not open Google sign-in.", variant: "destructive" }),
  });

  const inputClasses =
    "bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:ring-0 font-sans";
  const labelClasses = "text-white";
  const buttonClasses =
    "bg-[#D4AF37] text-black font-bold uppercase tracking-wide py-2 rounded shadow";

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8 space-x-8">
        <Link
          to="/auth/login"
          className={`pb-2 ${location.pathname.endsWith("/login") ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-gray-400 hover:text-white"}`}
        >
          Log In
        </Link>
        <Link
          to="/auth/register"
          className={`pb-2 ${location.pathname.endsWith("/register") ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-gray-400 hover:text-white"}`}
        >
          Create Account
        </Link>
      </div>

      <CommonForm
        formControls={registerFormControl}
        formData={formData}
        setFormData={setFormData}
        formErrors={errors}
        onSubmit={handleSubmit}
        buttonText={isLoading ? "Registering…" : "Create Account"}
        buttonDisabled={isLoading}
        inputClass={inputClasses}
        labelClass={labelClasses}
        buttonClass={buttonClasses}
      />

      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-600" />
        <span className="px-2 text-gray-500">or</span>
        <hr className="flex-grow border-gray-600" />
      </div>

      <Button
        variant="outline"
        onClick={googleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 border-gray-500 text-gray-200"
      >
        <FcGoogle className="h-5 w-5" />
        Continue with Google
      </Button>

      <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-[#D4AF37] hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Register;
