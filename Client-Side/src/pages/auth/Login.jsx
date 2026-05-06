import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginUserAction, googleSignInAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import { Btn, Eyebrow, FieldError, Hairline, AUTH_INPUT, AUTH_PRIMARY_BTN } from "@/components/ui/editorial";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn("[Saga Elite] VITE_GOOGLE_CLIENT_ID not set — Google auth disabled.");
}

const describeAuthError = (err) => {
  // Thunk rejectWithValue may pass through a string (the unwrapped server msg)
  if (typeof err === "string") return { title: "Login failed", description: err };

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
      description: serverMsg || "Email or password didn't match. Try again.",
    };
  }
  if (status === 403) {
    return {
      title: "Account not verified",
      description: serverMsg || "Verify your email before signing in.",
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
      description: serverMsg || "The atelier had an issue. Try again shortly.",
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

// Login does NOT enforce password complexity client-side — older accounts may
// have passwords that don't match current complexity rules. Just require non-empty
// fields and a well-formed email; let the backend verify the credentials.
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
  if (["admin", "super_admin", "superadmin", "sub_admin"].includes(role)) {
    return "/admin/dashboard";
  }
  return "/shopping/home";
};

const resolveUserFromPayload = (payload) => {
  if (!payload) return null;
  // Accept multiple backend shapes:
  //   { success: true, data: { user } }
  //   { success: true, data: user }
  //   { user: {...} }
  //   { token, user }
  return payload.data?.user || (payload.data && typeof payload.data === "object" ? payload.data : null) || payload.user || null;
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // If already authenticated when landing here, bounce away
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
      const response = await dispatch(loginUserAction(formData)).unwrap();
      // Diagnostic: log full response so the shape is visible during debugging
      // eslint-disable-next-line no-console
      console.info("[login] response", response);

      const u = resolveUserFromPayload(response);
      toast({
        title: "Welcome back",
        description: response?.message || "Signed in.",
        variant: "success",
      });

      // Explicit redirect — don't rely on CheckAuth race
      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      // eslint-disable-next-line no-console
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
      const response = await dispatch(googleSignInAction({ accessToken: access_token })).unwrap();
      // eslint-disable-next-line no-console
      console.info("[google sign-in] response", response);
      const u = resolveUserFromPayload(response);
      toast({
        title: "Welcome back",
        description: response?.message || "Signed in.",
        variant: "success",
      });
      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[google sign-in] error", err);
      const { title, description } = describeAuthError(err);
      toast({
        title: title === "Login failed" ? "Google sign-in failed" : title,
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
      title: "Google sign-in failed",
      description: "Please try again or use email and password.",
      variant: "destructive",
    });
  };

  return (
    <div>
      <Eyebrow tone="gold" size="md">Welcome back</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Sign in.
      </h1>
      <p className="mt-5 se-body text-sm text-[#99907c]">
        New to the atelier?{" "}
        <Link
          to="/auth/register"
          className="text-[#f2ca50] underline-offset-4 hover:underline"
        >
          Become a member
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-10 md:mt-12 space-y-6">
        <div>
          <Eyebrow tone="muted" size="xs">Email</Eyebrow>
          <input
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="your.name@email.com"
            aria-invalid={Boolean(touched.email && errors.email)}
            className={`mt-2 ${AUTH_INPUT} ${touched.email && errors.email ? "border-[#ffb4ab] focus:border-[#ffb4ab]" : ""}`}
          />
          <FieldError>{touched.email ? errors.email : null}</FieldError>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Eyebrow tone="muted" size="xs">Password</Eyebrow>
            <Link
              to="/auth/forgot-password"
              className="se-label text-[9px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088]"
            >
              Forgotten?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••••"
              aria-invalid={Boolean(touched.password && errors.password)}
              className={`mt-2 ${AUTH_INPUT} pr-10 ${touched.password && errors.password ? "border-[#ffb4ab] focus:border-[#ffb4ab]" : ""}`}
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
        </div>

        <Btn
          variant="default"
          className={AUTH_PRIMARY_BTN}
          iconRight={ArrowRight}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing in" : "Sign in"}
        </Btn>
      </form>

      <div className="flex items-center gap-4 my-6">
        <Hairline />
        <span className="se-label text-[9px] tracking-[0.24em] text-[#574500] shrink-0">or</span>
        <Hairline />
      </div>

      <div className="mt-6">
        {GOOGLE_ENABLED ? (
          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={isLoading}
            label="Continue with Google"
          />
        ) : (
          <button
            type="button"
            disabled
            title="Set VITE_GOOGLE_CLIENT_ID in your .env.local to enable Google sign-in"
            className="w-full h-12 bg-white/95 border border-[#dadce0] rounded-sm flex items-center justify-center gap-3 text-[#5f6368] cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.06)] opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#9aa0a6" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            <span className="text-sm font-medium" style={{ fontFamily: 'Geist, "Roboto", sans-serif' }}>
              Google sign-in unavailable
            </span>
          </button>
        )}
      </div>

      <p className="mt-12 se-body text-xs text-[#574500] leading-relaxed">
        By signing in you accept our{" "}
        <Link to="/legal/terms-and-conditions" className="text-[#99907c] hover:text-[#f2ca50]">
          terms
        </Link>{" "}
        and{" "}
        <Link to="/legal/privacy-policy" className="text-[#99907c] hover:text-[#f2ca50]">
          privacy practice
        </Link>
        .
      </p>
    </div>
  );
};

export default Login;
