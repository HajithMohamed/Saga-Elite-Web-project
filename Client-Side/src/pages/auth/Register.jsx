import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerUserAction, googleSignUpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import usePageMeta from "@/hooks/use-page-meta";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn("[Saga Elite] VITE_GOOGLE_CLIENT_ID not set — Google auth disabled.");
}

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

const FieldLabel = ({ children, hint }) => (
  <div className="flex items-baseline justify-between">
    <Eyebrow tone="muted" size="xs">{children}</Eyebrow>
    {hint && (
      <span className="se-label text-[9px] tracking-[0.28em] text-[#574500]">{hint}</span>
    )}
  </div>
);

import { motion, AnimatePresence } from "framer-motion";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    stylePreference: "",
    gender: "",
    dropInterest: "",
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

  return (
    <div>
      <div className="w-full max-w-sm mx-auto relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col w-full"
            >
              <div className="text-center md:text-left mb-8">
                <p className="text-red-500 font-medium tracking-widest text-sm uppercase mb-2 animate-pulse">
                  Join The Elite
                </p>
                <h1 className="text-white text-5xl font-['Bebas_Neue',_sans-serif] tracking-wide mb-3">
                  UNLOCK ACCESS
                </h1>
                <p className="text-gray-400 text-sm">
                  Create your profile to access exclusive drops.
                </p>
              </div>

              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1 group">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Username (Optional)</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                    placeholder="savage_kid"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1 group">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, email: e.target.value }));
                      setTouched((p) => ({ ...p, email: true }));
                    }}
                    placeholder="your@email.com"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                  />
                  {touched.email && errors.email && (
                    <p className="text-red-500 text-xs mt-1 pl-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1 group">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, password: e.target.value }));
                        setTouched((p) => ({ ...p, password: true }));
                      }}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-red-500 text-xs mt-1 pl-1">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-1 group">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, confirmPassword: e.target.value }));
                        setTouched((p) => ({ ...p, confirmPassword: true }));
                      }}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 pl-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full relative overflow-hidden group bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-6 flex justify-center items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    NEXT STEP
                    <ArrowRight size={18} />
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-0" />
                </motion.button>
              </form>

              <div className="mt-8 mb-6 flex items-center justify-center gap-4 text-xs font-semibold text-gray-600 uppercase tracking-widest">
                <div className="h-px bg-white/10 flex-1" />
                Or
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {GOOGLE_ENABLED && (
                <div className="google-auth-wrapper grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100">
                  <GoogleAuthButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="Quick Access with Google"
                  />
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mt-6">
                Already Elite?{" "}
                <Link to="/auth/login" className="text-white hover:text-red-400 font-semibold tracking-wide transition-colors">
                  ENTER HERE
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col w-full"
            >
              <div className="text-center md:text-left mb-8 relative">
                <button 
                  onClick={() => setStep(1)} 
                  className="absolute -top-6 left-0 text-gray-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase flex items-center gap-1"
                >
                  ← Back
                </button>
                <p className="text-red-500 font-medium tracking-widest text-sm uppercase mb-2 animate-pulse mt-6">
                  Personalize
                </p>
                <h1 className="text-white text-5xl font-['Bebas_Neue',_sans-serif] tracking-wide mb-3">
                  ELITE PROFILE
                </h1>
                <p className="text-gray-400 text-sm">
                  Customize your feed.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Style Preferences */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1 mb-2 block">Style Preference</label>
                  <div className="flex flex-wrap gap-2">
                    {["Streetwear", "Oversized", "Minimal", "Luxury", "Sporty"].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, stylePreference: style }))}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                          formData.stylePreference === style 
                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                            : "bg-black/50 text-gray-400 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drop Interest */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1 mb-2 block">Drop Interest</label>
                  <div className="flex flex-wrap gap-2">
                    {["Limited Drops", "Sneakers", "Accessories", "Mystery"].map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, dropInterest: interest }))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                          formData.dropInterest === interest 
                            ? "bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                            : "bg-black/50 text-gray-400 border-white/10 hover:border-white/30"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden group bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-8 flex justify-center items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? "CREATING PROFILE..." : "JOIN THE ELITE"}
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-0" />
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
