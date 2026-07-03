import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { forgotPasswordAction } from "@/store/auth-slice";
import { describeAuthError } from "@/lib/auth-errors";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import AuthPageWrapper from "@/components/auth-components/AuthPageWrapper";
import LuxuryInput from "@/components/auth-components/LuxuryInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  usePageMeta({ title: "Reset Password" });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (val) => {
    if (!val) return "We need your email to find your account.";
    if (!EMAIL_REGEX.test(val)) return "Please provide a valid email format.";
    return null;
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }

    setIsLoading(true);
    try {
      const response = await dispatch(forgotPasswordAction({ email })).unwrap();
      toast({
        title: "Code sent",
        description: response?.message || "Check your email for the verification code.",
        variant: "success",
      });
      navigate("/auth/verify-reset-otp", { state: { email } });
    } catch (err) {
      const { title, description } = describeAuthError(err, {
        title: "Failed to send",
        fallbackDescription: "Couldn't send the code. Please confirm the email is correct.",
      });
      setError(description);
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageWrapper
      title="Forgot Password?"
      description="Enter your email address and we'll send you a verification code to securely reset your password."
      badgeText="Secure Recovery"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <LuxuryInput
          id="email"
          type="email"
          label="Email Address"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          error={touched ? error : ""}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setError(validate(e.target.value));
          }}
          onBlur={handleBlur}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-gold px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-ongold transition-all hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-gold/50"
        >
          {isLoading ? "Sending Code..." : "Send Verification Code"}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-ink/5 pt-6">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 se-label text-[10px] uppercase tracking-[0.2em] text-muted hover:text-gold-ink transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Return to Sign In
        </Link>
      </div>
    </AuthPageWrapper>
  );
};

export default ForgotPassword;
