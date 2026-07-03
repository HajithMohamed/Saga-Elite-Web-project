import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight, Edit2 } from "lucide-react";
import { verifyResetOtpAction, forgotPasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import AuthPageWrapper from "@/components/auth-components/AuthPageWrapper";
import OtpCells from "@/components/auth-components/OtpCells";

const VerifyResetOtp = () => {
  usePageMeta({ title: "Verify Reset Code" });
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { email } = location.state || {};

  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast({ title: "Missing details", description: "Please enter your email first.", variant: "destructive" });
      navigate("/auth/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast({ title: "Incomplete code", description: "Enter all digits to verify.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      await dispatch(verifyResetOtpAction({ email, otp })).unwrap();
      navigate("/auth/set-new-password", { state: { email, otp } });
    } catch (err) {
      toast({ title: "Verification failed", description: err || "The code is invalid or has expired.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await dispatch(forgotPasswordAction({ email })).unwrap();
      toast({ title: "Code Resent", description: "A fresh code is on its way.", variant: "success" });
      setSeconds(60);
    } catch (err) {
      const msg = err?.response?.data?.message || "Couldn't resend. Try again shortly.";
      toast({ title: "Failed to resend", description: msg, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = (() => {
    const e = email || "";
    if (!e.includes("@")) return e;
    const [name, domain] = e.split("@");
    if (name.length <= 3) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 3)}***@${domain}`;
  })();

  if (!email) return null;

  return (
    <AuthPageWrapper
      title="Verify Recovery Code"
      description="We have sent a verification code to your email address. Please enter it below to securely reset your password."
      badgeText="Secure Recovery"
    >
      <div className="mb-8 flex items-center justify-between rounded-[16px] border border-white/10 bg-[#0a0a0a] p-4">
        <div>
          <p className="se-label text-[9px] uppercase tracking-[0.2em] text-[#99907c] mb-1">Sent to</p>
          <p className="se-body text-sm font-medium text-[#e5e2e1]">{maskedEmail}</p>
        </div>
        <Link to="/auth/forgot-password" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#F2CA50] transition-colors hover:bg-white/10">
          <Edit2 className="h-3 w-3" /> Edit
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <OtpCells
          length={4}
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || otp.length < 4}
          className="group relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[#F2CA50] px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0E0E0E] transition-all hover:bg-[#FFD86A] disabled:cursor-not-allowed disabled:bg-[#F2CA50]/50"
        >
          {isLoading ? "Verifying..." : "Verify Identity"}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6">
        <p className="se-body text-sm text-[#99907c] mb-2">Didn't receive the code?</p>
        {seconds > 0 ? (
          <span className="se-label text-[10px] tracking-[0.28em] text-[#99907c]">
            Resend available in <span className="text-[#F2CA50]">{seconds}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="se-label text-[10px] font-medium uppercase tracking-[0.2em] text-[#F2CA50] hover:text-[#ffe088] transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 se-label text-[10px] uppercase tracking-[0.2em] text-[#99907c] hover:text-[#F2CA50] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Cancel Recovery
        </Link>
      </div>
    </AuthPageWrapper>
  );
};

export default VerifyResetOtp;
