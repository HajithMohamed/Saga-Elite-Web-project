import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginUserAction, googleSignInAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import usePageMeta from "@/hooks/use-page-meta";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
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

import AuthLayout from "@/components/auth-components/AuthLayout";
import { motion } from "framer-motion";

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

  return (
    <AuthLayout isImageRight={false}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col w-full max-w-sm mx-auto"
      >
        <div className="text-center md:text-left mb-10">
          <p className="text-red-500 font-medium tracking-widest text-sm uppercase mb-2 animate-pulse">
            Access Exclusive Drops
          </p>
          <h1 className="text-white text-5xl font-['Bebas_Neue',_sans-serif] tracking-wide mb-3">
            ENTER THE ELITE
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to unlock premium streetwear and early access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 relative group">
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

          <div className="space-y-1 relative group">
            <div className="flex justify-between items-center pl-1 pr-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider">
                Recover Elite Access
              </Link>
            </div>
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden group bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-4 flex justify-center items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? "Authenticating..." : "ENTER THE ELITE"}
              {!isLoading && <ArrowRight size={18} />}
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

        <p className="text-center text-sm text-gray-500 mt-8">
          New Here?{" "}
          <Link to="/register" className="text-white hover:text-red-400 font-semibold tracking-wide transition-colors">
            JOIN THE ELITE
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;