import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  loginUserAction,
  googleSignInAction,
  facebookSignInAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import AuthPageWrapper from "@/components/auth-components/AuthPageWrapper";
import LuxuryInput from "@/components/auth-components/LuxuryInput";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import FacebookAuthButton from "@/components/auth-components/FacebookAuthButton";
import { describeAuthError } from "@/lib/auth-errors";
import { AUTH_PRIMARY_BTN, Btn, Hairline } from "@/components/ui/editorial";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateLogin = (data, touched = {}) => {
  const errs = {};
  if (touched.email && !data.email) {
    errs.email = "Please enter your email.";
  } else if (data.email && !EMAIL_REGEX.test(data.email)) {
    errs.email = "Please enter a valid email format.";
  }
  if (touched.password && !data.password) {
    errs.password = "Please enter your password.";
  }
  return errs;
};

const resolveDestination = (user) => {
  const role = String(user?.role || "").toLowerCase();
  if (["admin", "super_admin", "sub_admin"].includes(role)) {
    return "/admin/dashboard";
  }
  return "/shopping/home";
};

const resolveUserFromPayload = (payload) => {
  if (!payload) return null;
  return payload.data?.user || (payload.data && typeof payload.data === "object" ? payload.data : null) || payload.user || null;
};

const Login = () => {
  usePageMeta({ title: "Sign In" });

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) navigate(resolveDestination(user), { replace: true });
  }, [isAuthenticated, user, navigate]);

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
      const response = await dispatch(loginUserAction({ ...formData, rememberMe })).unwrap();
      const u = resolveUserFromPayload(response);

      toast({
        title: "Welcome back",
        description: response?.message || "Signed in successfully.",
        variant: "success",
      });
      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      const { title, description } = describeAuthError(err);
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSuccess = (provider) => async ({ access_token }) => {
    setIsLoading(true);
    try {
      const action = provider === 'google' ? googleSignInAction : facebookSignInAction;
      const response = await dispatch(action({ accessToken: access_token })).unwrap();
      const u = resolveUserFromPayload(response);

      toast({
        title: "Welcome back",
        description: response?.message || "Signed in.",
        variant: "success",
      });
      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      const { title, description } = describeAuthError(err);
      toast({
        title: title === "Login failed" ? `${provider} sign-in failed` : title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageWrapper
      title="Welcome Back"
      description="Sign in to access your orders, wishlist, exclusive drops, and faster checkout."
      badgeText="Secure Authentication"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <LuxuryInput
          id="email"
          type="email"
          label="Email Address"
          placeholder="your@email.com"
          autoComplete="email"
          value={formData.email}
          error={touched.email ? errors.email : ""}
          onChange={(e) => {
            setFormData((p) => ({ ...p, email: e.target.value }));
            setTouched((p) => ({ ...p, email: true }));
          }}
          onBlur={() => setTouched((p) => ({ ...p, email: true }))}
        />

        <div>
          <LuxuryInput
            id="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={formData.password}
            error={touched.password ? errors.password : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, password: e.target.value }));
              setTouched((p) => ({ ...p, password: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, password: true }))}
          />
          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex h-4 w-4 items-center justify-center rounded border border-white/20 bg-transparent transition-colors group-hover:border-[#F2CA50]">
                <input
                  type="checkbox"
                  className="peer absolute inset-0 opacity-0 cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <CheckCircle2 className="h-3 w-3 text-[#F2CA50] opacity-0 transition-opacity peer-checked:opacity-100" />
              </div>
              <span className="se-body text-xs text-[#99907c] group-hover:text-[#d0c5af] transition-colors">Remember me</span>
            </label>
            <Link
              to="/auth/forgot-password"
              className="se-label text-[10px] uppercase tracking-[0.2em] text-[#99907c] hover:text-[#F2CA50] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[#F2CA50] px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0E0E0E] transition-all hover:bg-[#FFD86A] disabled:cursor-not-allowed disabled:bg-[#F2CA50]/50"
        >
          {isLoading ? "Signing in..." : "Sign In"}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      {(GOOGLE_ENABLED || FACEBOOK_ENABLED) && (
        <div className="mt-8">
          <div className="mb-6 flex items-center gap-4">
            <Hairline tone="soft" />
            <span className="se-label text-[10px] uppercase tracking-[0.28em] text-[#574500] whitespace-nowrap">
              Or continue with
            </span>
            <Hairline tone="soft" />
          </div>
          <div className="space-y-3">
            {GOOGLE_ENABLED && (
              <div className="opacity-85 transition-opacity hover:opacity-100">
                <GoogleAuthButton
                  onSuccess={handleSocialSuccess('google')}
                  onError={() => toast({ title: "Google sign-in failed", description: "Try again.", variant: "destructive" })}
                  label="Continue with Google"
                />
              </div>
            )}
            {FACEBOOK_ENABLED && (
              <div className="opacity-85 transition-opacity hover:opacity-100">
                <FacebookAuthButton
                  onSuccess={handleSocialSuccess('facebook')}
                  onError={() => toast({ title: "Facebook sign-in failed", description: "Try again.", variant: "destructive" })}
                  label="Continue with Facebook"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center border-t border-white/5 pt-6">
        <p className="se-body text-sm text-[#99907c]">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="se-label text-[10px] font-medium uppercase tracking-[0.2em] text-[#F2CA50] transition-colors hover:text-[#ffe088]"
          >
            Create New Account
          </Link>
        </p>
      </div>
    </AuthPageWrapper>
  );
};

export default Login;
