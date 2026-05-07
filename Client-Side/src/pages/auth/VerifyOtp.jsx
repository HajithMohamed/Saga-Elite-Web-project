import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import OtpCells from "@/components/auth-components/OtpCells";

import AuthLayout from "@/components/auth-components/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";

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
      }, 3000); // give time for animation to run
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

  const steps = ["Register", "Verify", "Done"];
  const currentStep = 1; // Verify

  return (
    <AuthLayout isImageRight={false}>
      <div className="w-full max-w-sm mx-auto relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="verify-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col w-full"
            >
              <div className="text-center md:text-left mb-8">
                <Link to="/auth/login" className="mb-6 text-gray-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase flex items-center gap-1">
                  <ArrowLeft size={12} /> Back
                </Link>
                <p className="text-red-500 font-medium tracking-widest text-sm uppercase mb-2 animate-pulse mt-4">
                  Security Check
                </p>
                <h1 className="text-white text-5xl font-['Bebas_Neue',_sans-serif] tracking-wide mb-3">
                  CONFIRM ACCESS
                </h1>
                <p className="text-gray-400 text-sm">
                  We sent a secure code to {" "}
                  <span className="text-white font-bold">{masked || "your inbox"}</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex justify-center md:justify-start">
                  <OtpCells
                    length={4}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                    className="gap-4"
                    inputClassName="w-16 h-16 text-center text-2xl font-bold bg-black/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full relative overflow-hidden group bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isLoading ? "VERIFYING..." : "VERIFY CODE"}
                    {!isLoading && <ArrowRight size={18} />}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-0" />
                  )}
                </motion.button>
              </form>

              <div className="mt-8 text-center md:text-left">
                {seconds > 0 ? (
                  <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">
                    Resend in <span className="text-white">{seconds}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs font-bold text-red-500 hover:text-red-400 tracking-widest uppercase transition-colors"
                  >
                    {resending ? "SENDING..." : "RESEND CODE"}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success-state"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-500/20 rounded-full flex flex-col items-center justify-center mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              >
                <motion.svg
                  className="w-12 h-12 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>
              <h2 className="text-3xl font-['Bebas_Neue',_sans-serif] text-white tracking-widest mb-2">
                ACCESS GRANTED
              </h2>
              <p className="text-gray-400 font-semibold tracking-wide uppercase text-sm">
                Welcome To The Elite
              </p>
              
              <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden mt-8">
                <motion.div 
                  className="h-full bg-white"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
