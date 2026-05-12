import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyOtpAction, resendOtpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import OtpCells from "@/components/auth-components/OtpCells";
import {
  Btn,
  Eyebrow,
  AUTH_PRIMARY_BTN,
} from "@/components/ui/editorial";

const VerifyOtp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?.isVerified && !showSuccess) {
      setShowSuccess(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the Elite.",
        variant: "success",
      });
      const t = setTimeout(() => {
        navigate(user.role === "admin" ? "/admin/dashboard" : "/shopping/home");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [user, navigate, showSuccess]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast({
        title: "Incomplete code",
        description: "Enter all four digits to verify.",
        variant: "destructive",
      });
      return;
    }
    if (!user?._id) {
      toast({
        title: "Session expired",
        description: "Please register again to receive a fresh code.",
        variant: "destructive",
      });
      return;
    }
    dispatch(verifyOtpAction({ otp, userId: user._id }))
      .unwrap()
      .catch((err) => {
        toast({
          title: "Verification failed",
          description: err || "That code didn't match.",
          variant: "destructive",
        });
      });
  };

  const handleResend = async () => {
    if (!user?.email) {
      toast({
        title: "Missing email",
        description: "We don't know where to send the code.",
        variant: "destructive",
      });
      return;
    }
    setResending(true);
    try {
      await dispatch(resendOtpAction({ email: user.email })).unwrap();
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

  const masked = (() => {
    const e = user?.email || "";
    if (!e.includes("@")) return e;
    const [name, domain] = e.split("@");
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}${name[1]}***${name[name.length - 1]}@${domain}`;
  })();

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div
            key="verify-form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors mb-6"
            >
              <ArrowLeft size={12} strokeWidth={1.5} /> Back
            </Link>
            <Eyebrow tone="gold" size="md">Almost inside</Eyebrow>
            <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
              Confirm<br />your access.
            </h1>
            <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
              A four-digit code is on its way to{" "}
              <span className="text-[#e5e2e1]">{masked || "your inbox"}</span>.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 md:mt-12 space-y-8">
              <div className="flex justify-center md:justify-start">
                <OtpCells
                  length={4}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                  success={showSuccess}
                />
              </div>

              <Btn
                variant="default"
                className={AUTH_PRIMARY_BTN}
                iconRight={ArrowRight}
                type="submit"
                disabled={isLoading || otp.length < 4}
              >
                {isLoading ? "Verifying" : "Confirm access"}
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
          </motion.div>
        ) : (
          <motion.div
            key="success-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="relative w-32 h-32 flex items-center justify-center">
              <motion.div
                className="absolute w-32 h-32 rounded-full border border-[#f2ca50]/30"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.2, 1.0], opacity: [0, 0.6, 0.3] }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="relative w-16 h-16 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/40 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <CheckCheck
                    size={28}
                    strokeWidth={1.5}
                    className="text-[#f2ca50]"
                  />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-10"
            >
              <p className="se-label text-[11px] tracking-[0.5em] text-[#f2ca50]">
                ACCESS GRANTED
              </p>
              <p className="se-serif text-[#e5e2e1] text-2xl md:text-3xl mt-3">
                Welcome to the elite.
              </p>
              <p className="se-label text-[10px] tracking-[0.28em] text-[#99907c] mt-4">
                Entering your atelier
              </p>
            </motion.div>

            <div className="w-12 h-px bg-[#4d4635] mt-10 overflow-hidden">
              <motion.div
                className="h-full bg-[#f2ca50]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifyOtp;
