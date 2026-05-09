import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  verifyResetOtpAction,
  resendResetPasswordOtpAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import OtpCells from "@/components/auth-components/OtpCells";
import { Btn, Eyebrow, AUTH_PRIMARY_BTN } from "@/components/ui/editorial";

const VerifyResetOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
          We don't have an email on file for this reset. Begin the process again to receive a fresh
          code.
        </p>
        <Link to="/auth/forgot-password" className="mt-8 inline-block">
          <Btn variant="default" className={AUTH_PRIMARY_BTN} iconRight={ArrowRight}>
            Back to forgot password
          </Btn>
        </Link>
      </div>
    );
  }

  const masked = (() => {
    if (!email.includes("@")) return email;
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}${name[1]}***${name[name.length - 1]}@${domain}`;
  })();

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
    setIsLoading(true);
    try {
      await dispatch(verifyResetOtpAction({ email, otp })).unwrap();
      toast({
        title: "Code verified",
        description: "Now choose a new password.",
        variant: "success",
      });
      navigate("/auth/set-new-password", { state: { email, otp } });
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err || "That code didn't match.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await dispatch(resendResetPasswordOtpAction({ email })).unwrap();
      toast({
        title: "Code resent",
        description: "A new four-digit code is on its way.",
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
    <div>
      <Eyebrow tone="gold" size="md">Reset · step two</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Verify the code.
      </h1>
      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
        We sent a four-digit code to{" "}
        <span className="text-[#e5e2e1]">{masked}</span>. Enter it below to choose a new
        password.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 md:mt-12">
        <div className="flex justify-center">
          <OtpCells length={4} value={otp} onChange={setOtp} disabled={isLoading} />
        </div>

        <Btn
          variant="default"
          className={`${AUTH_PRIMARY_BTN} mt-10`}
          iconRight={ArrowRight}
          type="submit"
          disabled={isLoading || otp.length < 4}
        >
          {isLoading ? "Verifying" : "Verify code"}
        </Btn>
      </form>

      <div className="mt-8 text-center">
        {seconds > 0 ? (
          <span className="se-label text-[10px] tracking-[0.28em] text-[#574500]">
            Resend in {seconds}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="se-label text-[10px] tracking-[0.28em] text-[#f2ca50] hover:text-[#ffe088] disabled:opacity-50 disabled:pointer-events-none"
          >
            {resending ? "Sending" : "Resend the code"}
          </button>
        )}
      </div>

      <Link
        to="/auth/login"
        className="mt-12 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to sign in
      </Link>
    </div>
  );
};

export default VerifyResetOtp;
