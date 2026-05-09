import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { resendResetPasswordOtpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import OtpCells from "@/components/auth-components/OtpCells";
import {
  Btn,
  Eyebrow,
  AUTH_PRIMARY_BTN,
} from "@/components/ui/editorial";

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || "";
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}${name[1]}***${name[name.length - 1]}@${domain}`;
};

const ResetPasswordOtp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useSelector((state) => state.auth);

  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  if (!email) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast({
        title: "Incomplete code",
        description: "Enter all four digits.",
        variant: "destructive",
      });
      return;
    }
    navigate("/auth/set-new-password", { state: { email, otp } });
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
        description:
          typeof err === "string" ? err : err?.message || "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Eyebrow tone="gold" size="md">Reset · step two</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Enter<br />the code.
      </h1>
      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
        A four-digit code is on its way to{" "}
        <span className="text-[#e5e2e1]">{maskEmail(email)}</span>.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 md:mt-12 space-y-8">
        <div className="flex justify-center md:justify-start">
          <OtpCells
            length={4}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          />
        </div>

        <Btn
          variant="default"
          className={AUTH_PRIMARY_BTN}
          iconRight={ArrowRight}
          type="submit"
          disabled={isLoading || otp.length < 4}
        >
          {isLoading ? "Checking" : "Verify code"}
        </Btn>
      </form>

      <div className="mt-8">
        {seconds > 0 ? (
          <span className="se-label text-[10px] tracking-[0.28em] text-[#99907c]">
            Resend in <span className="text-[#e5e2e1]">{seconds}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>

      <Link
        to="/auth/forgot-password"
        className="mt-12 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to forgot password
      </Link>
    </motion.div>
  );
};

export default ResetPasswordOtp;
