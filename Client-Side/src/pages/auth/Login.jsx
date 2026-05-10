import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  loginUserAction,
  googleSignInAction,
  facebookSignInAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import FacebookAuthButton from "@/components/auth-components/FacebookAuthButton";
import usePageMeta from "@/hooks/use-page-meta";
import LuxuryInput from "@/components/auth-components/LuxuryInput";
import {
  AUTH_PRIMARY_BTN,
  Btn,
  Eyebrow,
  Hairline,
} from "@/components/ui/editorial";
import { motion } from "framer-motion";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn(
    "[Saga Elite] VITE_GOOGLE_CLIENT_ID not set — Google auth disabled."
  );
}

const describeAuthError = (err) => {
  if (typeof err === "string")
    return { title: "Login failed", description: err };

  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message;
  const code = err?.code;

  if (code === "ERR_NETWORK" || err?.message === "Network Error") {
    return {
      title: "Cannot reach the atelier",
      description:
        "The backend isn't responding. Confirm it's running at the configured VITE_API_URL and that CORS allows http://localhost:5173 with credentials.",
    };
  }
  if (status === 401) {
    return {
      title: "Wrong details",
      description:
        serverMsg || "Email or password didn't match. Try again.",
    };
  }
  if (status === 403) {
    return {
      title: "Account not verified",
      description:
        serverMsg || "Verify your email before signing in.",
    };
  }
  if (status === 429) {
    return {
      title: "Too many attempts",
      description: serverMsg || "Wait a few minutes and try again.",
    };
  }
  if (status >= 500) {
    return {
      title: `Server error · ${status}`,
      description:
        serverMsg || "The atelier had an issue. Try again shortly.",
    };
  }
  if (status) {
    return {
      title: `Login failed · ${status}`,
      description: serverMsg || err?.message || "Something didn't work.",
    };
  }
  return {
    title: "Login failed",
    description: serverMsg || err?.message || "Something didn't work.",
  };
};

const validateLogin = (data, touched = {}) => {
  const errs = {};
  if (touched.email && !data.email) {
    errs.email = "Tell us your email.";
  } else if (data.email && !EMAIL_REGEX.test(data.email)) {
    errs.email = "Please enter a valid email address.";
  }
  if (touched.password && !data.password) {
    errs.password = "Enter your password.";
  }
  return errs;
};

const resolveDestination = (user) => {
  const role = String(user?.role || "").toLowerCase();
  if (
    ["admin", "super_admin", "superadmin", "sub_admin"].includes(role)
  ) {
    return "/admin/dashboard";
  }
  return "/shopping/home";
};

const resolveUserFromPayload = (payload) => {
  if (!payload) return null;
  return (
    payload.data?.user ||
    (payload.data && typeof payload.data === "object"
      ? payload.data
      : null) ||
    payload.user ||
    null
  );
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated)
      navigate(resolveDestination(user), { replace: true });
  }, [isAuthenticated, user, navigate]);

  usePageMeta({ title: "Sign In" });

  useEffect(() => {
    setErrors(validateLogin(formData, touched));
  }, [formData, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { email: true, password: true };
    setTouched(allTouched);

    const fresh = validateLogin(formData, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;

    setIsLoading(true);
    try {
      const response = await dispatch(
        loginUserAction(formData)
      ).unwrap();

      console.info("[login] response", response);

      const u = resolveUserFromPayload(response);

      toast({
        title: "Welcome back",
        description: response?.message || "Signed in.",
        variant: "success",
      });

      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      console.error("[login] error", err);
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
        googleSignInAction({ accessToken: access_token })
      ).unwrap();

      console.info("[google sign-in] response", response);

      const u = resolveUserFromPayload(response);

      toast({
        title: "Welcome back",
        description: response?.message || "Signed in.",
        variant: "success",
      });

      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      console.error("[google sign-in] error", err);
      const { title, description } = describeAuthError(err);

      toast({
        title:
          title === "Login failed"
            ? "Google sign-in failed"
            : title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Google sign-in failed",
      description:
        "Please try again or use email and password.",
      variant: "destructive",
    });
  };

  const handleFacebookSuccess = async ({ access_token }) => {
    setIsLoading(true);
    try {
      const response = await dispatch(
        facebookSignInAction({ accessToken: access_token })
      ).unwrap();

      const u = resolveUserFromPayload(response);

      toast({
        title: "Welcome back",
        description: response?.message || "Signed in.",
        variant: "success",
      });

      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      console.error("[facebook sign-in] error", err);
      const { title, description } = describeAuthError(err);
      toast({
        title: title === "Login failed" ? "Facebook sign-in failed" : title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookError = () => {
    toast({
      title: "Facebook sign-in failed",
      description: "Please try again or use email and password.",
      variant: "destructive",
    });
  };

  const inputState = (field) =>
    touched[field] && errors[field]
      ? "border-[#ffb4ab] focus:border-[#ffb4ab]"
      : "border-[#4d4635] focus:border-[#f2ca50]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.1 }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Eyebrow tone="gold" size="md">Welcome Back</Eyebrow>
        <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
          Continue your<br />elite experience.
        </h1>
        <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
          Sign in to unlock exclusive collections, order updates, and early drop access.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} noValidate className="mt-10 md:mt-12 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
            label="Your Private Key"
            autoComplete="current-password"
            value={formData.password}
            error={touched.password ? errors.password : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, password: e.target.value }));
              setTouched((p) => ({ ...p, password: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, password: true }))}
          />
          <div className="flex items-center justify-end mt-2">
            <Link
              to="/auth/forgot-password"
              className="se-label text-[9px] uppercase tracking-[0.24em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
            >
              Reset your access
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Btn
            variant="default"
            className={`${AUTH_PRIMARY_BTN} w-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(242,202,80,0.3)]`}
            iconRight={isLoading ? undefined : ArrowRight}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Entering Your Elite Space..." : "Enter the elite"}
          </Btn>
        </motion.div>
      </form>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="mt-6 flex items-center justify-center gap-2 text-xs text-[#99907c]">
        <ShieldCheck size={14} className="text-[#f2ca50]" />
        <span>Secure & Encrypted Authentication</span>
      </motion.div>

      {(GOOGLE_ENABLED || FACEBOOK_ENABLED) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="my-8 flex items-center gap-4">
            <Hairline tone="soft" />
            <span className="se-label text-[10px] tracking-[0.28em] text-[#574500]">
              Or continue with
            </span>
            <Hairline tone="soft" />
          </div>
          <div className="space-y-3">
            {GOOGLE_ENABLED && (
              <div className="google-auth-wrapper opacity-85 transition-opacity hover:opacity-100">
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  label="Continue with Google"
                />
              </div>
            )}
            {FACEBOOK_ENABLED && (
              <div className="facebook-auth-wrapper opacity-85 transition-opacity hover:opacity-100">
                <FacebookAuthButton
                  onSuccess={handleFacebookSuccess}
                  onError={handleFacebookError}
                  label="Continue with Facebook"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 se-body text-sm text-[#99907c] text-center">
        Not an elite member yet?{" "}
        <Link
          to="/auth/register"
          className="se-label text-[10px] tracking-[0.24em] text-[#f2ca50] hover:text-[#ffe088] transition-colors"
        >
          Join the brand experience
        </Link>
      </motion.p>
    </motion.div>
  );
};

export default Login;
