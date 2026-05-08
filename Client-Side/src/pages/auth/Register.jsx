import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { registerUserAction, googleSignUpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import usePageMeta from "@/hooks/use-page-meta";
import {
  AUTH_INPUT,
  AUTH_PRIMARY_BTN,
  Btn,
  Eyebrow,
  FieldError,
  Hairline,
} from "@/components/ui/editorial";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn("[Saga Elite] VITE_GOOGLE_CLIENT_ID not set — Google auth disabled.");
}

const GENDER_OPTIONS = ["Gents", "Ladies", "Unisex"];
const STYLE_OPTIONS = ["Streetwear", "Oversized", "Minimal", "Luxury", "Sporty"];
const DROP_OPTIONS = ["Limited Drops", "Streetwear", "Accessories", "Mystery Rewards"];

const describeAuthError = (err) => {
  if (typeof err === "string") return { title: "Registration failed", description: err };
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message;
  const code = err?.code;

  if (code === "ERR_NETWORK" || err?.message === "Network Error") {
    return {
      title: "Cannot reach the atelier",
      description:
        "The backend isn't responding. Confirm it's running and that CORS allows http://localhost:5173 with credentials.",
    };
  }
  if (status === 409) {
    return {
      title: "Account already exists",
      description: serverMsg || "An account with this email already exists. Sign in instead.",
    };
  }
  if (status === 422 || status === 400) {
    return {
      title: "Couldn't register",
      description: serverMsg || "Some details weren't accepted. Check the fields and try again.",
    };
  }
  if (status === 429) {
    return { title: "Too many attempts", description: serverMsg || "Wait a few minutes and try again." };
  }
  if (status >= 500) {
    return { title: `Server error · ${status}`, description: serverMsg || "Try again shortly." };
  }
  if (status) {
    return { title: `Registration failed · ${status}`, description: serverMsg || err?.message || "Something didn't work." };
  }
  return { title: "Registration failed", description: serverMsg || err?.message || "Something didn't work." };
};

const summarizeBlocking = (errs) => {
  const fields = Object.keys(errs);
  if (fields.length === 0) return null;
  if (fields.length === 1) {
    const k = fields[0];
    if (k === "email") return "Check your email address.";
    if (k === "password") return "Password doesn't meet the requirements yet.";
    if (k === "confirmPassword") return "Confirm your password to match.";
  }
  return "A few fields need attention before we can create your account.";
};

const validateRegister = (data, touched = {}) => {
  const errs = {};
  if (touched.email && !data.email) {
    errs.email = "Tell us your email.";
  } else if (data.email && !EMAIL_REGEX.test(data.email)) {
    errs.email = "Please enter a valid email address.";
  }
  if (touched.password && !data.password) {
    errs.password = "Choose a password.";
  } else if (data.password) {
    const pwdError = firstPasswordError(data.password);
    if (pwdError) errs.password = pwdError;
  }
  if (touched.confirmPassword && !data.confirmPassword) {
    errs.confirmPassword = "Confirm your password.";
  } else if (
    data.confirmPassword &&
    data.password &&
    data.password !== data.confirmPassword
  ) {
    errs.confirmPassword = "Passwords do not match.";
  }
  return errs;
};

const PILL_BASE =
  "se-label text-[10px] tracking-[0.18em] px-4 py-2 transition-colors";
const PILL_INACTIVE =
  "bg-[#1c1b1b] text-[#d0c5af] border border-[#4d4635] hover:border-[#99907c]";
const PILL_SINGLE_ACTIVE =
  "bg-[#f2ca50] text-[#1b1c1c] border border-[#f2ca50]";
const PILL_MULTI_ACTIVE =
  "bg-[#f2ca50]/15 text-[#f2ca50] border border-[#f2ca50]";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    stylePreference: "",
    dropInterest: [],
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      const role = String(user?.role || "").toLowerCase();
      navigate(
        ["admin", "super_admin", "superadmin", "sub_admin"].includes(role)
          ? "/admin/dashboard"
          : "/shopping/home",
        { replace: true }
      );
    }
  }, [isAuthenticated, user, navigate]);

  usePageMeta({ title: "Create Account" });

  useEffect(() => {
    setErrors(validateRegister(formData, touched));
  }, [formData, touched]);

  const inputState = (field) =>
    touched[field] && errors[field]
      ? "border-[#ffb4ab] focus:border-[#ffb4ab]"
      : "border-[#4d4635] focus:border-[#f2ca50]";

  const handleNextStep = (e) => {
    e.preventDefault();
    const allTouched = { email: true, password: true, confirmPassword: true };
    setTouched(allTouched);

    const fresh = validateRegister(formData, allTouched);
    setErrors(fresh);

    const blockingMsg = summarizeBlocking(fresh);
    if (blockingMsg) {
      toast({
        title: "Almost there",
        description: blockingMsg,
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      handleNextStep(e);
      return;
    }

    setIsLoading(true);
    try {
      console.info("[register] sending", { email: formData.email });

      const response = await dispatch(registerUserAction(formData)).unwrap();

      console.info("[register] response", response);

      toast({
        title: "Account opened",
        description:
          response?.message || "Check your email for the verification code.",
        variant: "success",
      });

      navigate("/auth/verify-otp");
    } catch (err) {
      console.error("[register] error", err);
      const { title, description } = describeAuthError(err);
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ access_token }) => {
    setIsLoading(true);
    try {
      const response = await dispatch(
        googleSignUpAction({ accessToken: access_token })
      ).unwrap();

      console.info("[google sign-up] response", response);

      toast({
        title: "Welcome to the atelier",
        description: response?.message || "Signed up.",
        variant: "success",
      });

      const role = String(
        response?.data?.user?.role || response?.data?.role || ""
      ).toLowerCase();

      navigate(
        ["admin", "super_admin", "superadmin", "sub_admin"].includes(role)
          ? "/admin/dashboard"
          : "/shopping/home",
        { replace: true }
      );
    } catch (err) {
      console.error("[google sign-up] error", err);
      const { title, description } = describeAuthError(err);

      toast({
        title: title === "Registration failed" ? "Google sign-up failed" : title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (err) => {
    if (err?.type === "popup_closed" || err?.error === "popup_closed_by_user") {
      return;
    }

    toast({
      title: "Google sign-up failed",
      description: "Please try again or use email and password.",
      variant: "destructive",
    });
  };

  const toggleDropInterest = (value) => {
    setFormData((prev) => {
      const next = prev.dropInterest.includes(value)
        ? prev.dropInterest.filter((v) => v !== value)
        : [...prev.dropInterest, value];
      return { ...prev, dropInterest: next };
    });
  };

  const StepDots = (
    <div className="flex items-center gap-1.5 mb-6">
      <div
        className={`h-1 rounded-full transition-all ${
          step === 1 ? "w-6 bg-[#f2ca50]" : "w-2 bg-[#4d4635]"
        }`}
      />
      <div
        className={`h-1 rounded-full transition-all ${
          step === 2 ? "w-6 bg-[#f2ca50]" : "w-2 bg-[#4d4635]"
        }`}
      />
    </div>
  );

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {StepDots}
            <Eyebrow tone="gold" size="md">Become a member</Eyebrow>
            <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
              Join the<br />elite.
            </h1>
            <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
              Create your account to access exclusive drops, members-only chapters,
              and early releases.
            </p>

            <form onSubmit={handleNextStep} noValidate className="mt-10 md:mt-12 space-y-6">
              <div>
                <div className="flex items-baseline justify-between">
                  <Eyebrow tone="muted" size="xs">Username</Eyebrow>
                  <span className="se-label text-[9px] tracking-[0.28em] text-[#574500]">
                    Optional
                  </span>
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, username: e.target.value }))
                  }
                  placeholder="Your handle in the atelier"
                  className={`mt-2 ${AUTH_INPUT} border-[#4d4635] focus:border-[#f2ca50]`}
                />
              </div>

              <div>
                <Eyebrow tone="muted" size="xs">Email</Eyebrow>
                <input
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, email: e.target.value }));
                    setTouched((p) => ({ ...p, email: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="your.name@email.com"
                  aria-invalid={Boolean(touched.email && errors.email)}
                  className={`mt-2 ${AUTH_INPUT} ${inputState("email")}`}
                />
                <FieldError>{touched.email ? errors.email : null}</FieldError>
              </div>

              <div>
                <Eyebrow tone="muted" size="xs">Password</Eyebrow>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, password: e.target.value }));
                      setTouched((p) => ({ ...p, password: true }));
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                    placeholder="Choose with care"
                    aria-invalid={Boolean(touched.password && errors.password)}
                    className={`${AUTH_INPUT} pr-10 ${inputState("password")}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#99907c] hover:text-[#f2ca50] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <FieldError>{touched.password ? errors.password : null}</FieldError>
                <PasswordStrengthMeter password={formData.password} />
              </div>

              <div>
                <Eyebrow tone="muted" size="xs">Confirm password</Eyebrow>
                <div className="relative mt-2">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }));
                      setTouched((p) => ({ ...p, confirmPassword: true }));
                    }}
                    onBlur={() =>
                      setTouched((p) => ({ ...p, confirmPassword: true }))
                    }
                    placeholder="Once more"
                    aria-invalid={Boolean(
                      touched.confirmPassword && errors.confirmPassword
                    )}
                    className={`${AUTH_INPUT} pr-10 ${inputState("confirmPassword")}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#99907c] hover:text-[#f2ca50] transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <FieldError>
                  {touched.confirmPassword ? errors.confirmPassword : null}
                </FieldError>
              </div>

              <Btn
                variant="default"
                className={AUTH_PRIMARY_BTN}
                iconRight={ArrowRight}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Continuing" : "Continue"}
              </Btn>
            </form>

            {GOOGLE_ENABLED && (
              <>
                <div className="my-8 flex items-center gap-4">
                  <Hairline tone="soft" />
                  <span className="se-label text-[10px] tracking-[0.28em] text-[#574500]">
                    Or
                  </span>
                  <Hairline tone="soft" />
                </div>
                <div className="google-auth-wrapper opacity-85 transition-opacity hover:opacity-100">
                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    label="Quick Access with Google"
                  />
                </div>
              </>
            )}

            <p className="mt-10 se-body text-sm text-[#99907c]">
              Already elite?{" "}
              <Link
                to="/auth/login"
                className="se-label text-[10px] tracking-[0.24em] text-[#f2ca50] hover:text-[#ffe088] transition-colors"
              >
                Enter here
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {StepDots}
            <Eyebrow tone="gold" size="md">Your atelier</Eyebrow>
            <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
              Make it<br />personal.
            </h1>
            <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
              Tell us a little so we can shape your feed.
              Skip if you'd rather come back to it.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 md:mt-12 space-y-8">
              <div>
                <Eyebrow tone="muted" size="xs">You shop for</Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((value) => {
                    const active = formData.gender === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, gender: value }))
                        }
                        className={`${PILL_BASE} ${
                          active ? PILL_SINGLE_ACTIVE : PILL_INACTIVE
                        }`}
                      >
                        {value.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Eyebrow tone="muted" size="xs">Your vibe</Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((value) => {
                    const active = formData.stylePreference === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, stylePreference: value }))
                        }
                        className={`${PILL_BASE} ${
                          active ? PILL_SINGLE_ACTIVE : PILL_INACTIVE
                        }`}
                      >
                        {value.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Eyebrow tone="muted" size="xs">What excites you</Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DROP_OPTIONS.map((value) => {
                    const active = formData.dropInterest.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleDropInterest(value)}
                        className={`${PILL_BASE} ${
                          active ? PILL_MULTI_ACTIVE : PILL_INACTIVE
                        }`}
                      >
                        {value.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Btn
                variant="default"
                className={AUTH_PRIMARY_BTN}
                iconRight={ArrowRight}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Unlocking" : "Unlock access"}
              </Btn>
            </form>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-10 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
