import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { forgotPasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import LuxuryInput from "@/components/auth-components/LuxuryInput";
import {
  AUTH_PRIMARY_BTN,
  Btn,
  Eyebrow,
} from "@/components/ui/editorial";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  usePageMeta({ title: "Reset Access" });

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
        description: response?.message || "Check your email for the reset code.",
        variant: "success",
      });
      navigate("/auth/verify-reset-otp", { state: { email } });
    } catch (err) {
      console.error("[forgot-password] error", err);
      const msg = err?.response?.data?.message || "Couldn't send the code. Please confirm the email is correct.";
      setError(msg);
      toast({
        title: "Failed to send",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Eyebrow tone="gold" size="md">Lost access</Eyebrow>
        <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
          Reset Your<br />Access.
        </h1>
        <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed max-w-md">
          Tell us the email tied to your profile. We'll send a secure recovery link and code to restore your access.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="mt-10 md:mt-12 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <LuxuryInput
            id="email"
            type="email"
            label="Email Address"
            autoComplete="email"
            value={email}
            error={touched ? error : ""}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched) setError(validate(e.target.value));
            }}
            onBlur={handleBlur}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Btn
            variant="default"
            className={`${AUTH_PRIMARY_BTN} w-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(242,202,80,0.3)]`}
            iconRight={isLoading ? undefined : ArrowRight}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Preparing recovery code..." : "Send access code"}
          </Btn>
        </motion.div>
      </form>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-6 flex items-center justify-center gap-2 text-xs text-[#99907c]">
        <ShieldCheck size={14} className="text-[#f2ca50]" />
        <span>Secure & Encrypted Recovery</span>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Link
          to="/"
          className="mt-12 inline-flex items-center gap-2 se-label text-[10px] uppercase tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Return to sign in
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;
