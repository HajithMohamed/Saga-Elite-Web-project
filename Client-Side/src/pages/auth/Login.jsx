import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginUserAction, googleSignInAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
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

  return (
    <div>
      <Eyebrow tone="gold" size="md">
        Welcome back
      </Eyebrow>

      <h1 className="mt-4 se-serif text-[#e5e2e1] text-4xl md:text-6xl">
        Sign in.
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6"
      >
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              email: e.target.value,
            }))
          }
          className={AUTH_INPUT}
        />

        <input
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              password: e.target.value,
            }))
          }
          className={AUTH_INPUT}
        />

        <Btn
          type="submit"
          className={AUTH_PRIMARY_BTN}
          iconRight={ArrowRight}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Btn>
      </form>

      {GOOGLE_ENABLED && (
        <GoogleAuthButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      )}
    </div>
  );
};

export default Login;