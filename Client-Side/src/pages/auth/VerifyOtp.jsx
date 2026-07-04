import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, CheckCircle2, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyOtpAction, resendOtpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import AuthPageWrapper from "@/components/auth-components/AuthPageWrapper";
import OtpCells from "@/components/auth-components/OtpCells";

const VerifyOtp = () => {
  usePageMeta({ title: "Verify Email" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);

  const { state: routerState } = useLocation();
  const fallbackEmail = routerState?.email;
  const fallbackUserId = routerState?.userId;

  const resolvedUser = user?._id ? user : (fallbackUserId ? { _id: fallbackUserId, email: fallbackEmail } : null);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (resolvedUser?.isVerified && !showSuccess) {
      setShowSuccess(true);
      const t = setTimeout(() => {
        navigate(resolvedUser.role === "admin" ? "/admin/dashboard" : "/shopping/home");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [resolvedUser, navigate, showSuccess]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast({ title: "Incomplete code", description: "Enter all digits to verify.", variant: "destructive" });
      return;
    }
    if (!resolvedUser?._id) {
      toast({ title: "Session expired", description: "Please register again.", variant: "destructive" });
      navigate("/auth/register");
      return;
    }
    dispatch(verifyOtpAction({ otp, userId: resolvedUser._id }))
      .unwrap()
      .catch((err) => {
        toast({ title: "Verification failed", description: err || "The code didn't match or has expired.", variant: "destructive" });
      });
  };

  const handleResend = async () => {
    if (!resolvedUser?.email) return;
    setResending(true);
    try {
      await dispatch(resendOtpAction({ email: resolvedUser.email })).unwrap();
      toast({ title: "Code Resent", description: "A fresh code is on its way.", variant: "success" });
      setSeconds(60);
    } catch (err) {
      toast({ title: "Couldn't resend", description: err || "Try again in a moment.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = (() => {
    const e = resolvedUser?.email || "";
    if (!e.includes("@")) return e;
    const [name, domain] = e.split("@");
    if (name.length <= 3) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 3)}***@${domain}`;
  })();

  if (showSuccess) {
    return (
      <AuthPageWrapper title="Account Activated" description="Your email has been successfully verified." badgeText="Verification Complete">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 border border-gold-ink/20 mb-6">
            <CheckCircle2 className="h-12 w-12 text-gold-ink" />
          </div>
          <h2 className="se-serif text-3xl text-ink-2">Access Granted</h2>
          <p className="se-body mt-4 text-muted max-w-sm">Redirecting to your atelier...</p>
        </motion.div>
      </AuthPageWrapper>
    );
  }

  return (
    <AuthPageWrapper
      title="Verify Your Email"
      description="We have sent a verification code to your email address. Please enter it below."
      badgeText="Email Verification"
    >
      <div className="mb-8 flex items-center justify-between rounded-[16px] border border-ink/10 bg-page p-4">
        <div>
          <p className="se-label text-[9px] uppercase tracking-[0.2em] text-muted mb-1">Sent to</p>
          <p className="se-body text-sm font-medium text-ink-2">{maskedEmail || "your email"}</p>
        </div>
        <Link to="/auth/register" className="flex items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-gold-ink transition-colors hover:bg-ink/10">
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
          className="group relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-gold px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-ongold transition-all hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-gold/50"
        >
          {isLoading ? "Verifying..." : "Verify Identity"}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-ink/5 pt-6">
        <p className="se-body text-sm text-muted mb-2">Didn't receive the code?</p>
        {seconds > 0 ? (
          <span className="se-label text-[10px] tracking-[0.28em] text-muted">
            Resend available in <span className="text-gold-ink">{seconds}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="se-label text-[10px] font-medium uppercase tracking-[0.2em] text-gold-ink hover:text-gold-ink transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>
    </AuthPageWrapper>
  );
};

export default VerifyOtp;
