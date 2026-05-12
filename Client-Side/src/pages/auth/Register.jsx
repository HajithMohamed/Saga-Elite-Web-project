// Register page — updated layout 2026-05-10
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Check, ShieldCheck, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  registerUserAction,
  googleSignUpAction,
  facebookSignUpAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import FacebookAuthButton from "@/components/auth-components/FacebookAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import usePageMeta from "@/hooks/use-page-meta";
import LuxuryInput from "@/components/auth-components/LuxuryInput";
import axiosInstance from "@/api/axiosInstance";
import {
  AUTH_PRIMARY_BTN,
  Btn,
  Eyebrow,
  Hairline,
} from "@/components/ui/editorial";

const PHONE_REGEX = /^(\+?94|0)?7[0-9]{8}$/;

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const describeAuthError = (err) => {
  if (typeof err === "string") return { title: "Registration failed", description: err };
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message;

  if (status === 409) {
    return {
      title: "Account already exists",
      description: serverMsg || "An account with this email already exists. Sign in instead.",
    };
  }
  return {
    title: "Registration failed",
    description: serverMsg || err?.message || "Some details weren't accepted. Check the fields and try again.",
  };
};

const resolveDestination = (user) => {
  const role = String(user?.role || "").toLowerCase();
  if (["admin", "super_admin", "superadmin", "sub_admin"].includes(role)) return "/admin/dashboard";
  return "/auth/verify-otp";
};

const validateStep = (data, touched) => {
  const errs = {};
  if (touched.username && !data.username) errs.username = "How should we call you?";
  if (touched.email && !data.email) errs.email = "Tell us your email.";
  else if (data.email && !EMAIL_REGEX.test(data.email)) errs.email = "Please enter a valid email address.";
  
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

  if (touched.phoneNumber && !data.phoneNumber) {
    errs.phoneNumber = "Phone number is required.";
  } else if (data.phoneNumber && !PHONE_REGEX.test(data.phoneNumber.replace(/\s/g, ""))) {
    errs.phoneNumber = "Enter a valid Sri Lankan mobile (e.g. 0771234567).";
  }

  return errs;
};

const BENEFITS = [
  "Faster checkout",
  "Order tracking",
  "Exclusive drops",
  "Early access collections",
  "Save wishlist"
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [extraData, setExtraData] = useState({
    street: "",
    city: "",
    postalCode: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingExtras, setIsSavingExtras] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Suppress auto-redirect while user is filling step 2 — they may have
    // been auto-authenticated by the registration response. We'll navigate
    // ourselves after Skip or Save.
    if (step === 2) return;
    if (isAuthenticated) navigate(resolveDestination(user), { replace: true });
  }, [isAuthenticated, user, navigate, step]);

  usePageMeta({ title: "Join Saga Elite" });

  useEffect(() => {
    setErrors(validateStep(formData, touched));
  }, [formData, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { username: true, email: true, password: true, confirmPassword: true, phoneNumber: true };
    setTouched(allTouched);

    const fresh = validateStep(formData, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;

    setIsLoading(true);
    try {
      const response = await dispatch(registerUserAction(formData)).unwrap();

      toast({
        title: "Welcome to the atelier",
        description: response?.message || "One last step — add your details.",
        variant: "success",
      });

      // Move to step 2 — phone + address (skippable).
      setStep(2);
    } catch (err) {
      console.error("[register] error", err);
      const { title, description } = describeAuthError(err);
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const goToOtp = () => {
    navigate("/auth/verify-otp", { state: { email: formData.email } });
  };

  const handleSkip = () => {
    toast({ title: "Skipped — you can add these later from your account." });
    goToOtp();
  };

  const handleSaveExtras = async () => {
    const street = extraData.street.trim();
    const city = extraData.city.trim();
    const postalCode = extraData.postalCode.trim();

    const hasAddress = street || city || postalCode;
    if (hasAddress && (!street || !city || !postalCode)) {
      setErrors((p) => ({
        ...p,
        addressIncomplete: "Fill street, city and postal code — or skip to add later.",
      }));
      return;
    }

    setIsSavingExtras(true);
    try {
      if (hasAddress) {
        await axiosInstance.post("/user/addresses", {
          street,
          city,
          postalCode,
          country: "Sri Lanka",
          isDefault: true,
        });
      }
      toast({ title: "Saved", variant: "success" });
      goToOtp();
    } catch (err) {
      const description =
        err?.response?.data?.message || err?.message || "Could not save details.";
      toast({ title: "Save failed", description, variant: "destructive" });
    } finally {
      setIsSavingExtras(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Eyebrow tone="gold" size="md">Create Account</Eyebrow>
        <h1 className="mt-3 se-serif text-[#e5e2e1] leading-[1.05] text-3xl sm:text-4xl md:text-5xl">
          Gain<br />access.
        </h1>
        <p className="mt-4 se-body text-sm text-[#d0c5af] leading-relaxed max-w-sm">
          Create your account to access exclusive drops, members-only chapters, and early releases.
        </p>
      </motion.div>

      {/* Benefits Bar — horizontal on larger screens, hidden on small */}
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
          {BENEFITS.map((benefit, i) => (
            <div
              key={i}
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

      {/* Form */}
      <AnimatePresence mode="wait">
      {step === 1 && (
      <motion.form
        key="step-1"
        onSubmit={handleSubmit}
        noValidate
        className="mt-7 space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <LuxuryInput
            id="username"
            type="text"
            label="Your Handle in the Atelier"
            autoComplete="username"
            value={formData.username}
            error={touched.username ? errors.username : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, username: e.target.value }));
              setTouched((p) => ({ ...p, username: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, username: true }))}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <LuxuryInput
            id="email"
            type="email"
            label="Email Address"
            autoComplete="email"
            value={formData.email}
            error={touched.email ? errors.email : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, email: e.target.value }));
              setTouched((p) => ({ ...p, email: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <LuxuryInput
            id="password"
            type="password"
            label="Choose Your Password"
            autoComplete="new-password"
            value={formData.password}
            error={touched.password ? errors.password : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, password: e.target.value }));
              setTouched((p) => ({ ...p, password: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, password: true }))}
          />
          {formData.password && <div className="mt-1"><PasswordStrengthMeter password={formData.password} /></div>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <LuxuryInput
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            error={touched.confirmPassword ? errors.confirmPassword : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, confirmPassword: e.target.value }));
              setTouched((p) => ({ ...p, confirmPassword: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <LuxuryInput
            id="phoneNumber"
            type="tel"
            label="Mobile (Sri Lanka)"
            placeholder="0771234567"
            autoComplete="tel"
            value={formData.phoneNumber}
            error={touched.phoneNumber ? errors.phoneNumber : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, phoneNumber: e.target.value }));
              setTouched((p) => ({ ...p, phoneNumber: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, phoneNumber: true }))}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
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
      )}

      {step === 2 && (
        <motion.div
          key="step-2"
          className="mt-7 space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <div className="rounded-sm border border-[#1f1f1f] bg-[#111111]/80 p-4">
            <p className="se-label text-[9px] tracking-[0.28em] text-[#f2ca50] uppercase">
              Step 2 of 2 · Optional
            </p>
            <p className="mt-2 text-sm text-[#d0c5af]">
              Add a saved address now for one-tap checkout — or skip and add later.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <LuxuryInput
              id="street"
              type="text"
              label="Street address"
              autoComplete="street-address"
              value={extraData.street}
              onChange={(e) => {
                setExtraData((p) => ({ ...p, street: e.target.value }));
                setErrors((p) => ({ ...p, addressIncomplete: undefined }));
              }}
            />
            <LuxuryInput
              id="city"
              type="text"
              label="City"
              autoComplete="address-level2"
              value={extraData.city}
              onChange={(e) => {
                setExtraData((p) => ({ ...p, city: e.target.value }));
                setErrors((p) => ({ ...p, addressIncomplete: undefined }));
              }}
            />
          </div>

          <LuxuryInput
            id="postalCode"
            type="text"
            label="Postal code"
            autoComplete="postal-code"
            value={extraData.postalCode}
            onChange={(e) => {
              setExtraData((p) => ({ ...p, postalCode: e.target.value }));
              setErrors((p) => ({ ...p, addressIncomplete: undefined }));
            }}
          />

          {errors.addressIncomplete && (
            <p className="text-xs text-rose-400">{errors.addressIncomplete}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Btn
              variant="default"
              type="button"
              onClick={handleSaveExtras}
              disabled={isSavingExtras}
              iconRight={isSavingExtras ? undefined : ArrowRight}
              className={`${AUTH_PRIMARY_BTN} flex-1`}
            >
              {isSavingExtras ? "Saving..." : "Save & continue"}
            </Btn>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSavingExtras}
              className="flex-1 sm:flex-initial sm:px-6 inline-flex items-center justify-center gap-2 border border-[#1f1f1f] text-[#99907c] hover:text-white hover:border-[#4d4635] py-3 transition text-sm se-label tracking-[0.18em] uppercase"
            >
              <SkipForward size={14} /> Skip for now
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Social Auth */}
      {step === 1 && (GOOGLE_ENABLED || FACEBOOK_ENABLED) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
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
                <GoogleAuthButton onSuccess={() => {}} onError={() => {}} label="Join with Google" />
              </div>
            )}
            {FACEBOOK_ENABLED && (
              <div className="facebook-auth-wrapper opacity-85 transition-opacity hover:opacity-100">
                <FacebookAuthButton onSuccess={() => {}} onError={() => {}} label="Join with Facebook" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Trust Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-5 flex items-center justify-center gap-2 text-xs text-[#99907c]"
      >
        <ShieldCheck size={14} className="text-[#f2ca50]" />
        <span>Secure & Encrypted Authentication</span>
      </motion.div>

      {/* Switch to Login */}
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
