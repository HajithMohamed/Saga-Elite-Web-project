import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { resetPasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { Btn, Eyebrow, FieldError } from "@/components/ui/editorial";

const validateReset = (data, touched = {}) => {
  const errs = {};
  const pwd = data.newPassword;
  if (touched.newPassword && !pwd) {
    errs.newPassword = "Choose a new password.";
  } else if (pwd) {
    const pwdError = firstPasswordError(pwd);
    if (pwdError) errs.newPassword = pwdError;
  }
  if (touched.confirmPassword && !data.confirmPassword) {
    errs.confirmPassword = "Confirm your new password.";
  } else if (data.confirmPassword && pwd && pwd !== data.confirmPassword) {
    errs.confirmPassword = "Passwords do not match.";
  }
  return errs;
};

const SetNewPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { email, otp } = location.state || {};

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setErrors(validateReset(formData, touched));
  }, [formData, touched]);

  if (!email || !otp) {
    return (
      <div>
        <Eyebrow tone="muted" size="md">Session lost</Eyebrow>
        <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-5xl">
          Start again,<br />gently.
        </h1>
        <p className="mt-5 se-body text-sm text-[#d0c5af] leading-relaxed">
          The reset session has expired. Please request a new code.
        </p>
        <Link to="/auth/forgot-password" className="mt-8 inline-block">
          <Btn variant="default" size="lg" iconRight={ArrowRight}>
            Back to forgot password
          </Btn>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { newPassword: true, confirmPassword: true };
    setTouched(allTouched);
    const fresh = validateReset(formData, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;
    setIsLoading(true);
    try {
      await dispatch(
        resetPasswordAction({
          email,
          otp,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        })
      ).unwrap();
      toast({
        title: "Password updated",
        description: "Sign in with your new password.",
        variant: "success",
      });
      setTimeout(() => navigate("/auth/login"), 1200);
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err || "Couldn't reset your password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full bg-transparent border-b py-3 pr-10 text-[#e5e2e1] placeholder:text-[#574500] outline-none se-body text-base transition-colors";
  const inputOk = "border-[#4d4635] focus:border-[#f2ca50]";
  const inputErr = "border-[#ffb4ab] focus:border-[#ffb4ab]";

  return (
    <div>
      <Eyebrow tone="gold" size="md">Reset · step three</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Choose a new<br />password.
      </h1>
      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
        Eight characters, with at least one uppercase letter, one number, and one symbol from{" "}
        <span className="se-mono text-[#e5e2e1]">@$!%*?&</span>.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-10 md:mt-12 space-y-6">
        <div>
          <Eyebrow tone="muted" size="xs">New password</Eyebrow>
          <div className="relative mt-2">
            <input
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={(e) => setFormData((p) => ({ ...p, newPassword: e.target.value }))}
              onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
              placeholder="Choose with care"
              aria-invalid={Boolean(touched.newPassword && errors.newPassword)}
              className={`${inputBase} ${
                touched.newPassword && errors.newPassword ? inputErr : inputOk
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#99907c] hover:text-[#f2ca50] transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? (
                <EyeOff size={16} strokeWidth={1.5} />
              ) : (
                <Eye size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
          <FieldError>{touched.newPassword ? errors.newPassword : null}</FieldError>
          <PasswordStrengthMeter password={formData.newPassword} />
        </div>

        <div>
          <Eyebrow tone="muted" size="xs">Confirm password</Eyebrow>
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
              className={`${inputBase} ${
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
          {isLoading ? "Updating" : "Update password"}
        </Btn>
      </form>

      <Link
        to="/auth/login"
        className="mt-12 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Cancel and return to sign in
      </Link>
    </div>
  );
};

export default SetNewPassword;
