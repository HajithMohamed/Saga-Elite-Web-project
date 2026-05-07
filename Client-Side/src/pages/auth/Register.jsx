import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerUserAction, googleSignUpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import {
  Btn,
  Eyebrow,
  FieldError,
  Hairline,
  AUTH_INPUT,
  AUTH_PRIMARY_BTN,
} from "@/components/ui/editorial";
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

  const handleSubmit = async (e) => {
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
      console.warn("[register] blocked by validation", fresh);
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
      <Eyebrow tone="gold" size="md">Become a member</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] text-4xl md:text-6xl">
        Open an account.
      </h1>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((p) => ({ ...p, email: e.target.value }))
          }
          className={AUTH_INPUT}
        />

        <input
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) =>
            setFormData((p) => ({ ...p, password: e.target.value }))
          }
          className={AUTH_INPUT}
        />

        <input
          type={showConfirm ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              confirmPassword: e.target.value,
            }))
          }
          className={AUTH_INPUT}
        />

        <Btn type="submit" className={AUTH_PRIMARY_BTN} disabled={isLoading}>
          {isLoading ? "Opening account..." : "Open account"}
        </Btn>
      </form>
    </div>
  );
};

export default Register;