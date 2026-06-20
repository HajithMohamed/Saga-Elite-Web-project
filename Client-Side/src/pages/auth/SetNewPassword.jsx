import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { resetPasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { Btn, Eyebrow, FieldError, AUTH_INPUT, AUTH_PRIMARY_BTN } from "@/components/ui/editorial";

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
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.div>
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

  const inputBase = AUTH_INPUT;
  const inputOk = "border-[#4d4635] focus:border-[#f2ca50]";
  const inputErr = "border-[#ffb4ab] focus:border-[#ffb4ab]";

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Eyebrow tone="gold" size="md">Reset · final step</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Set your<br />new key.
      </h1>
      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
        Eight characters, with at least one uppercase letter, one number, and one symbol from{" "}
        <span className="se-mono text-[#e5e2e1]">@$!%*?&</span>.
      </p>

      <div className="mt-6 mb-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#a8d8b6] animate-pulse" />
        <span className="se-label text-[10px] tracking-[0.28em] text-[#a8d8b6]">
          Secure session · encrypted
        </span>
        <div className="flex-1 h-px bg-[#4d4635]" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 md:mt-8 space-y-6">
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
              className={`${inputBase} pr-10 ${touched.newPassword && errors.newPassword ? inputErr : inputOk}`}
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
              className={`${inputBase} ${touched.confirmPassword && errors.confirmPassword ? inputErr : inputOk}`}
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
          className={AUTH_PRIMARY_BTN}
          iconRight={ArrowRight}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Securing" : "Set new key"}
        </Btn>
      </form>

      <Link
        to="/auth/login"
        className="mt-12 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Cancel · return to sign in
      </Link>
    </motion.div>
  );
};

export default SetNewPassword;
