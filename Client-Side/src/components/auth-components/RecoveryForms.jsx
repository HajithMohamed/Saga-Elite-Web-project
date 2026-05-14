import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  forgotPasswordAction,
  verifyResetOtpAction,
  resendResetPasswordOtpAction,
  resetPasswordAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import LuxuryInput from "./LuxuryInput";
import OtpCells from "./OtpCells";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { AUTH_PRIMARY_BTN, AUTH_INPUT, Btn, Eyebrow, FieldError } from "@/components/ui/editorial";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || "";
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}${name[1]}***${name[name.length - 1]}@${domain}`;
};

const panelMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.25 },
};

export const ForgotPasswordForm = ({ onBack, onNext }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (value) => {
    if (!value) return "We need your email to find your account.";
    if (!EMAIL_REGEX.test(value)) return "Please provide a valid email format.";
    return null;
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    const freshError = validate(email);
    if (freshError) {
      setError(freshError);
      return;
    }

    setLoading(true);
    try {
      const response = await dispatch(forgotPasswordAction({ email })).unwrap();
      toast({
        title: "Code sent",
        description: response?.message || "Check your email for the reset code.",
        variant: "success",
      });
      onNext?.(email);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Couldn't send the code. Please confirm the email is correct.";
      setError(message);
      toast({
        title: "Failed to send",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div {...panelMotion}>
      <Eyebrow tone="gold" size="md">Lost access</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">
        Reset your access.
      </h2>
      <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">
        We’ll send a code to the email tied to your account.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <LuxuryInput
          id="fp-email"
          type="email"
          label="Email Address"
          autoComplete="email"
          value={email}
          error={touched ? error : ""}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched) setError(validate(e.target.value));
          }}
          onBlur={handleBlur}
        />

        <Btn
          variant="default"
          className={`${AUTH_PRIMARY_BTN} w-full`}
          iconRight={loading ? undefined : ArrowRight}
          type="submit"
          disabled={loading}
        >
          {loading ? "Preparing recovery code..." : "Send access code"}
        </Btn>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#574500]">
        <ShieldCheck size={11} className="text-[#f2ca50]" />
        <span>Secure & Encrypted Recovery</span>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to sign in
      </button>
    </motion.div>
  );
};

export const VerifyResetOtpForm = ({ email = "", onBack, onNext }) => {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  if (!email) {
    return (
      <motion.div {...panelMotion}>
        <Eyebrow tone="muted" size="md">Session lost</Eyebrow>
        <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">
          Start again, gently.
        </h2>
        <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">
          We need the email from the previous step before we can verify the code.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back to forgot password
        </button>
      </motion.div>
    );
  }

  const masked = maskEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast({
        title: "Incomplete code",
        description: "Enter all four digits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await dispatch(verifyResetOtpAction({ email, otp })).unwrap();
      toast({
        title: "Code verified",
        description: "Now choose a new password.",
        variant: "success",
      });
      onNext?.(otp);
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err || "That code didn't match.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await dispatch(resendResetPasswordOtpAction({ email })).unwrap();
      toast({
        title: "Code resent",
        description: "A fresh four-digit code is on its way.",
        variant: "success",
      });
      setSeconds(45);
    } catch (err) {
      toast({
        title: "Couldn't resend",
        description: err || "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div {...panelMotion}>
      <Eyebrow tone="gold" size="md">Reset · step two</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">
        Verify the code.
      </h2>
      <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">
        We sent a four-digit code to <span className="text-[#e5e2e1]">{masked}</span>.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="flex justify-center">
          <OtpCells length={4} value={otp} onChange={setOtp} disabled={loading} />
        </div>

        <Btn
          variant="default"
          className={`${AUTH_PRIMARY_BTN} w-full`}
          iconRight={loading ? undefined : ArrowRight}
          type="submit"
          disabled={loading || otp.length < 4}
        >
          {loading ? "Verifying..." : "Verify code"}
        </Btn>
      </form>

      <div className="mt-6 text-center">
        {seconds > 0 ? (
          <span className="se-label text-[10px] tracking-[0.28em] text-[#574500]">
            Resend in {seconds}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend the code"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to forgot password
      </button>
    </motion.div>
  );
};

export const SetNewPasswordForm = ({ email = "", otp = "", onBack, onDone }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextErrors = {};
    const password = formData.newPassword;
    if (touched.newPassword && !password) {
      nextErrors.newPassword = "Choose a new password.";
    } else if (password) {
      const pwdError = firstPasswordError(password);
      if (pwdError) nextErrors.newPassword = pwdError;
    }
    if (touched.confirmPassword && !formData.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (formData.confirmPassword && password && password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
  }, [formData, touched]);

  if (!email || !otp) {
    return (
      <motion.div {...panelMotion}>
        <Eyebrow tone="muted" size="md">Session lost</Eyebrow>
        <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">
          Start again, gently.
        </h2>
        <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">
          The reset session expired before we could set the new password.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back to verification
        </button>
      </motion.div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { newPassword: true, confirmPassword: true };
    setTouched(allTouched);

    const freshErrors = {};
    const password = formData.newPassword;
    if (!password) freshErrors.newPassword = "Choose a new password.";
    else {
      const pwdError = firstPasswordError(password);
      if (pwdError) freshErrors.newPassword = pwdError;
    }
    if (!formData.confirmPassword) {
      freshErrors.confirmPassword = "Confirm your new password.";
    } else if (password && password !== formData.confirmPassword) {
      freshErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(freshErrors);
    if (Object.keys(freshErrors).length > 0) return;

    setLoading(true);
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
        description: "You can now sign in with your new password.",
        variant: "success",
      });
      onDone?.(email);
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err || "Couldn't reset your password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputBase = AUTH_INPUT;
  const inputOk = "border-[#4d4635] focus:border-[#f2ca50]";
  const inputErr = "border-[#ffb4ab] focus:border-[#ffb4ab]";

  return (
    <motion.div {...panelMotion}>
      <Eyebrow tone="gold" size="md">Reset · final step</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">
        Set your new key.
      </h2>
      <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">
        Use at least eight characters with an uppercase letter, a number, and a symbol.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <Eyebrow tone="muted" size="xs">New password</Eyebrow>
          <div className="relative mt-2">
            <input
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
              placeholder="Choose with care"
              aria-invalid={Boolean(touched.newPassword && errors.newPassword)}
              className={`${inputBase} pr-10 ${touched.newPassword && errors.newPassword ? inputErr : inputOk}`}
            />
            <button
              type="button"
              onClick={() => setShowNew((value) => !value)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#99907c] hover:text-[#f2ca50] transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
          </div>
          <FieldError>{touched.newPassword ? errors.newPassword : null}</FieldError>
          <div className="mt-1">
            <PasswordStrengthMeter password={formData.newPassword} />
          </div>
        </div>

        <div>
          <Eyebrow tone="muted" size="xs">Confirm password</Eyebrow>
          <div className="relative mt-2">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              placeholder="Once more"
              aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
              className={`${inputBase} pr-10 ${touched.confirmPassword && errors.confirmPassword ? inputErr : inputOk}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#99907c] hover:text-[#f2ca50] transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
          </div>
          <FieldError>{touched.confirmPassword ? errors.confirmPassword : null}</FieldError>
        </div>

        <Btn
          variant="default"
          className={`${AUTH_PRIMARY_BTN} w-full`}
          iconRight={loading ? undefined : ArrowRight}
          type="submit"
          disabled={loading}
        >
          {loading ? "Securing..." : "Set new key"}
        </Btn>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to code verification
      </button>
    </motion.div>
  );
};