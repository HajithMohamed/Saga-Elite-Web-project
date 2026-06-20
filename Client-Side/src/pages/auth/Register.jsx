// Register page - updated layout 2026-05-10
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { registerUserAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import { describeAuthError } from "@/lib/auth-errors";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import FacebookAuthButton from "@/components/auth-components/FacebookAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import usePageMeta from "@/hooks/use-page-meta";
import LuxuryInput from "@/components/auth-components/LuxuryInput";
import {
  AUTH_PRIMARY_BTN,
  Btn,
  Eyebrow,
  Hairline,
} from "@/components/ui/editorial";

const VALID_MOBILE_PREFIXES = ["70", "71", "72", "74", "75", "76", "77", "78"];

void motion;

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidSriLankanMobile = (raw) => {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return false;

  let local = digits;
  if (local.startsWith("0094")) local = local.slice(4);
  else if (local.startsWith("94") && local.length === 11) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);

  return local.length === 9 && VALID_MOBILE_PREFIXES.includes(local.slice(0, 2));
};

const validateForm = (data, touched) => {
  const errs = {};

  if (touched.email && !data.email) {
    errs.email = "Tell us your email.";
  } else if (data.email && !EMAIL_REGEX.test(data.email)) {
    errs.email = "Please enter a valid email address.";
  }

  if (touched.password && !data.password) {
    errs.password = "Create a password.";
  } else if (data.password) {
    const pErr = firstPasswordError(data.password);
    if (pErr) errs.password = pErr;
  }

  if (touched.confirmPassword && !data.confirmPassword) {
    errs.confirmPassword = "Confirm your password.";
  } else if (data.confirmPassword && data.password !== data.confirmPassword) {
    errs.confirmPassword = "Passwords do not match.";
  }

  if (
    data.phoneNumber &&
    !isValidSriLankanMobile(data.phoneNumber)
  ) {
    errs.phoneNumber =
      "Enter a valid Sri Lankan mobile for WhatsApp OTP (e.g. 0771234567).";
  }

  return errs;
};

const BENEFITS = [
  "Faster checkout",
  "Order tracking",
  "Exclusive drops",
  "Early access collections",
  "Save wishlist",
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  usePageMeta({ title: "Join Saga Elite" });

  useEffect(() => {
    setErrors(validateForm(formData, touched));
  }, [formData, touched]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched((prev) => ({ ...prev, ...allTouched }));

    const fresh = validateForm(formData, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;

    setIsLoading(true);
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        username: formData.username.trim() || undefined,
      };
      const phoneNumber = formData.phoneNumber.trim();
      if (phoneNumber) payload.phoneNumber = phoneNumber;
      const response = await dispatch(registerUserAction(payload)).unwrap();

      toast({
        title: "Welcome to the atelier",
        description:
          response?.message ||
          "Check your email for the verification code.",
        variant: "success",
      });

      navigate("/auth/verify-otp", {
        state: { email: payload.email },
      });
    } catch (err) {
      console.error("[register] error", err);
      const { title, description } = describeAuthError(err, {
        title: "Registration failed",
      });
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Eyebrow tone="gold" size="md">
          Create Account
        </Eyebrow>
        <h1 className="mt-3 se-serif text-[#e5e2e1] leading-[1.05] text-3xl sm:text-4xl md:text-5xl">
          Gain
          <br />
          access.
        </h1>
        <p className="mt-4 se-body text-sm text-[#d0c5af] leading-relaxed max-w-sm">
          Create your account to access exclusive drops, members-only chapters, and early releases.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 p-4 bg-[#111111]/80 border border-[#1f1f1f] rounded-sm"
      >
        <p className="se-label text-[9px] tracking-[0.28em] text-[#99907c] uppercase mb-3">
          Why join us?
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-2 text-[#d0c5af] se-body text-xs"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#f2ca50]/10 text-[#f2ca50]">
                <Check size={10} strokeWidth={2.5} />
              </span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        noValidate
        className="mt-7 space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <LuxuryInput
            id="username"
            type="text"
            label="Your Handle in the Atelier (Optional)"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange("username")}
            onBlur={() => markTouched("username")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <LuxuryInput
            id="email"
            type="email"
            label="Email Address"
            autoComplete="email"
            value={formData.email}
            error={touched.email ? errors.email : ""}
            onChange={handleChange("email")}
            onBlur={() => markTouched("email")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LuxuryInput
            id="password"
            type="password"
            label="Choose Your Password"
            autoComplete="new-password"
            value={formData.password}
            error={touched.password ? errors.password : ""}
            onChange={handleChange("password")}
            onBlur={() => markTouched("password")}
          />
          {formData.password && (
            <div className="mt-1">
              <PasswordStrengthMeter password={formData.password} />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <LuxuryInput
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            error={touched.confirmPassword ? errors.confirmPassword : ""}
            onChange={handleChange("confirmPassword")}
            onBlur={() => markTouched("confirmPassword")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <LuxuryInput
            id="phoneNumber"
            type="tel"
            label="Mobile for WhatsApp OTP (Optional)"
            placeholder="0771234567"
            autoComplete="tel"
            value={formData.phoneNumber}
            error={touched.phoneNumber ? errors.phoneNumber : ""}
            onChange={handleChange("phoneNumber")}
            onBlur={() => markTouched("phoneNumber")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
        >
          <Btn
            variant="default"
            className={`${AUTH_PRIMARY_BTN} w-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(242,202,80,0.3)]`}
            iconRight={isLoading ? undefined : ArrowRight}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Preparing Your Space..." : "Continue"}
          </Btn>
        </motion.div>
      </motion.form>

      {(GOOGLE_ENABLED || FACEBOOK_ENABLED) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <div className="my-6 flex items-center gap-4">
            <Hairline tone="soft" />
            <span className="se-label text-[10px] tracking-[0.28em] text-[#574500] whitespace-nowrap">
              Or continue with
            </span>
            <Hairline tone="soft" />
          </div>
          <div className="space-y-3">
            {GOOGLE_ENABLED && (
              <div className="google-auth-wrapper opacity-85 transition-opacity hover:opacity-100">
                <GoogleAuthButton
                  onSuccess={() => {}}
                  onError={() => {}}
                  label="Join with Google"
                />
              </div>
            )}
            {FACEBOOK_ENABLED && (
              <div className="facebook-auth-wrapper opacity-85 transition-opacity hover:opacity-100">
                <FacebookAuthButton
                  onSuccess={() => {}}
                  onError={() => {}}
                  label="Join with Facebook"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-5 flex items-center justify-center gap-2 text-xs text-[#99907c]"
      >
        <ShieldCheck size={14} className="text-[#f2ca50]" />
        <span>Secure & Encrypted Authentication</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        className="mt-6 se-body text-sm text-[#99907c] text-center pb-4"
      >
        Already an elite member?{" "}
        <Link
          to="/auth/login"
          className="se-label text-[10px] tracking-[0.24em] text-[#f2ca50] hover:text-[#ffe088] transition-colors"
        >
          Continue your journey
        </Link>
      </motion.p>
    </motion.div>
  );
};

export default Register;
