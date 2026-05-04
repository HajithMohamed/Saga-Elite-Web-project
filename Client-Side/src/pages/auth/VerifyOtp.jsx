import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import OtpCells from "@/components/auth-components/OtpCells";
import { Btn, Eyebrow } from "@/components/ui/editorial";

const VerifyOtp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (user?.isVerified) {
      toast({
        title: "Verified",
        description: "Welcome to the atelier.",
        variant: "success",
      });
      const t = setTimeout(() => {
        navigate(user.role === "admin" ? "/admin/dashboard" : "/shopping/home");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

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
    <div>
      <Eyebrow tone="gold" size="md">One last step</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Confirm<br />your email.
      </h1>
      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed">
        We sent a four-digit code to{" "}
        <span className="text-[#e5e2e1]">{masked || "your inbox"}</span>. Enter it below.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 md:mt-12">
        <div className="flex justify-center">
          <OtpCells
            length={4}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          />
        </div>

        <Btn
          variant="default"
          size="lg"
          className="w-full mt-10"
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

export default VerifyOtp;
