import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerUserAction, googleSignUpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { Btn, Eyebrow, FieldError, Hairline } from "@/components/ui/editorial";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Friendly summary of which fields blocked submission, so the user knows the
// click WAS registered but validation prevented the API call.
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

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Bounce away if already authenticated
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      const role = String(user?.role || "").toLowerCase();
      navigate(
        role === "admin" || role === "super_admin" || role === "superadmin"
          ? "/admin/dashboard"
          : "/shopping/home",
        { replace: true }
      );
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    setErrors(validateRegister(formData, touched));
  }, [formData, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { email: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    const fresh = validateRegister(formData, allTouched);
    setErrors(fresh);

    // Surface why submit didn't fire — was hidden silently before.
    const blockingMsg = summarizeBlocking(fresh);
    if (blockingMsg) {
      toast({
        title: "Almost there",
        description: blockingMsg,
        variant: "destructive",
      });
      // eslint-disable-next-line no-console
      console.warn("[register] blocked by validation", fresh);
      return;
    }

    setIsLoading(true);
    try {
      // eslint-disable-next-line no-console
      console.info("[register] sending", { email: formData.email });
      const response = await dispatch(registerUserAction(formData)).unwrap();
      // eslint-disable-next-line no-console
      console.info("[register] response", response);
      toast({
        title: "Account opened",
        description:
          response?.message ||
          "Check your email for the verification code.",
        variant: "success",
      });
      navigate("/auth/verify-otp");
    } catch (err) {
      // eslint-disable-next-line no-console
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
      const response = await dispatch(googleSignUpAction({ accessToken: access_token })).unwrap();
      // eslint-disable-next-line no-console
      console.info("[google sign-up] response", response);
      toast({
        title: "Welcome to the atelier",
        description: response?.message || "Signed up.",
        variant: "success",
      });
      navigate("/shopping/home", { replace: true });
    } catch (err) {
      // eslint-disable-next-line no-console
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

  const handleGoogleError = () =>
    toast({
      title: "Google sign-up failed",
      description: "Could not open Google sign-in.",
      variant: "destructive",
    });

  const inputBase =
    "w-full bg-transparent border-b py-3 text-[#e5e2e1] placeholder:text-[#574500] outline-none se-body text-base transition-colors";
  const inputOk = "border-[#4d4635] focus:border-[#f2ca50]";
  const inputErr = "border-[#ffb4ab] focus:border-[#ffb4ab]";

  return (
    <div>
      <Eyebrow tone="gold" size="md">Become a member</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Open an account.
      </h1>
      <p className="mt-5 se-body text-sm text-[#99907c]">
        Already inside the atelier?{" "}
        <Link to="/auth/login" className="text-[#f2ca50] underline-offset-4 hover:underline">
          Sign in
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-10 md:mt-12 space-y-6">
        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="your.name@email.com"
            aria-invalid={Boolean(touched.email && errors.email)}
            className={`mt-2 ${inputBase} ${
              touched.email && errors.email ? inputErr : inputOk
            }`}
          />
          <FieldError>{touched.email ? errors.email : null}</FieldError>
        </div>

        <div>
          <FieldLabel hint="At least 8 characters">Password</FieldLabel>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Choose with care"
              aria-invalid={Boolean(touched.password && errors.password)}
              className={`pr-10 ${inputBase} ${
                touched.password && errors.password ? inputErr : inputOk
              }`}
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
          <FieldLabel>Confirm password</FieldLabel>
          <div className="relative mt-2">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
              }
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              placeholder="Once more"
              aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
              className={`pr-10 ${inputBase} ${
                touched.confirmPassword && errors.confirmPassword ? inputErr : inputOk
              }`}
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
          <FieldError>{touched.confirmPassword ? errors.confirmPassword : null}</FieldError>
        </div>

        <Btn
          variant="default"
          size="lg"
          className="w-full"
          iconRight={ArrowRight}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Opening account" : "Open account"}
        </Btn>
      </form>

      <div className="mt-10 flex items-center gap-5">
        <Hairline />
        <span className="se-label text-[10px] tracking-[0.28em] text-[#99907c]">or</span>
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
            title="Set VITE_GOOGLE_CLIENT_ID in your .env.local to enable Google sign-up"
            className="w-full h-12 bg-white/95 border border-[#dadce0] rounded-sm flex items-center justify-center gap-3 text-[#5f6368] cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.06)] opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#9aa0a6" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            <span className="text-sm font-medium" style={{ fontFamily: 'Geist, "Roboto", sans-serif' }}>
              Google sign-up unavailable
            </span>
          </button>
        )}
      </div>

      <p className="mt-10 se-body text-xs text-[#574500] leading-relaxed">
        By becoming a member you accept our{" "}
        <Link to="/legal/terms-and-conditions" className="text-[#99907c] hover:text-[#f2ca50]">
          terms
        </Link>{" "}
        and{" "}
        <Link to="/legal/privacy-policy" className="text-[#99907c] hover:text-[#f2ca50]">
          privacy practice
        </Link>
        . You'll receive a verification code by email.
      </p>
    </div>
  );
};

export default Register;
