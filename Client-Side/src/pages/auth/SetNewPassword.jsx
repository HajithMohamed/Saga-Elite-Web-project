import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight, CheckCircle2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { resetPasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import usePageMeta from "@/hooks/use-page-meta";
import AuthPageWrapper from "@/components/auth-components/AuthPageWrapper";
import LuxuryInput from "@/components/auth-components/LuxuryInput";

const checkPasswordReqs = (pwd) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /\d/.test(pwd),
  special: /[@$!%*?&]/.test(pwd)
});

const calculateStrength = (reqs) => {
  const score = Object.values(reqs).filter(Boolean).length;
  if (score <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
  if (score <= 2) return { label: "Fair", color: "bg-orange-500", text: "text-orange-500" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-500", text: "text-yellow-500" };
  if (score <= 4) return { label: "Strong", color: "bg-emerald-400", text: "text-emerald-400" };
  return { label: "Excellent", color: "bg-[#F2CA50]", text: "text-[#F2CA50]" };
};

const PasswordChecklist = ({ password }) => {
  const reqs = checkPasswordReqs(password);
  const strength = calculateStrength(reqs);
  const allReqs = [
    { label: "Minimum 8 Characters", met: reqs.length },
    { label: "Uppercase Letter", met: reqs.upper },
    { label: "Lowercase Letter", met: reqs.lower },
    { label: "Number", met: reqs.number },
    { label: "Special Character (@$!%*?&)", met: reqs.special }
  ];

  return (
    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="se-label text-[10px] uppercase tracking-[0.2em] text-[#99907c]">Password Strength</span>
        <span className={`se-label text-[10px] uppercase tracking-[0.2em] font-bold ${strength.text}`}>{strength.label}</span>
      </div>
      <div className="flex gap-1 mb-4 h-1">
        {[...Array(5)].map((_, i) => {
          const score = Object.values(reqs).filter(Boolean).length;
          return (
            <div key={i} className={`h-full flex-1 rounded-full transition-colors duration-500 ${i < score ? strength.color : 'bg-white/10'}`} />
          );
        })}
      </div>
      <div className="space-y-2">
        {allReqs.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {req.met ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-rose-400/50" />}
            <span className={`text-xs ${req.met ? 'text-[#e5e2e1]' : 'text-[#99907c]'}`}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const validateReset = (data, touched = {}) => {
  const errs = {};
  if (touched.newPassword && !data.newPassword) errs.newPassword = "Choose a new password.";
  else if (data.newPassword && Object.values(checkPasswordReqs(data.newPassword)).includes(false)) {
    errs.newPassword = "Please meet all password requirements.";
  }
  if (touched.confirmPassword && !data.confirmPassword) errs.confirmPassword = "Confirm your new password.";
  else if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
    errs.confirmPassword = "Passwords do not match.";
  }
  return errs;
};

const SetNewPassword = () => {
  usePageMeta({ title: "Set New Password" });
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { email, otp } = location.state || {};

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setErrors(validateReset(formData, touched));
  }, [formData, touched]);

  if (!email || !otp) {
    return (
      <AuthPageWrapper title="Session Expired" description="Your password reset session has expired. Please request a new recovery link." badgeText="Session Lost">
        <Link to="/auth/forgot-password" className="group relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[#F2CA50] px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0E0E0E] transition-all hover:bg-[#FFD86A]">
          Return to Forgot Password
        </Link>
      </AuthPageWrapper>
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
      await dispatch(resetPasswordAction({ email, otp, newPassword: formData.newPassword, confirmPassword: formData.confirmPassword })).unwrap();
      setIsSuccess(true);
    } catch (err) {
      toast({ title: "Reset failed", description: err || "Couldn't reset your password. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthPageWrapper title="Password Updated Successfully" description="Your password has been changed. You can now use your new password to access your account." badgeText="Recovery Complete">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F2CA50]/10 border border-[#F2CA50]/20 mb-8">
            <CheckCircle2 className="h-12 w-12 text-[#F2CA50]" />
          </div>
          <Link to="/auth/login" className="group relative flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[#F2CA50] px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0E0E0E] transition-all hover:bg-[#FFD86A]">
            Return to Login
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </AuthPageWrapper>
    );
  }

  return (
    <AuthPageWrapper
      title="Create New Password"
      description="Your identity has been verified. Please choose a strong new password to secure your account."
      badgeText="Secure Recovery"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <LuxuryInput
            id="newPassword"
            type="password"
            label="New Password"
            placeholder="Choose with care"
            autoComplete="new-password"
            value={formData.newPassword}
            error={touched.newPassword ? errors.newPassword : ""}
            onChange={(e) => {
              setFormData((p) => ({ ...p, newPassword: e.target.value }));
              setTouched((p) => ({ ...p, newPassword: true }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, newPassword: true }))}
          />
          {formData.newPassword && <PasswordChecklist password={formData.newPassword} />}
        </div>

        <LuxuryInput
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Once more"
          autoComplete="new-password"
          value={formData.confirmPassword}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          onChange={(e) => {
            setFormData((p) => ({ ...p, confirmPassword: e.target.value }));
            setTouched((p) => ({ ...p, confirmPassword: true }));
          }}
          onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex h-[56px] w-full mt-6 items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[#F2CA50] px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0E0E0E] transition-all hover:bg-[#FFD86A] disabled:cursor-not-allowed disabled:bg-[#F2CA50]/50"
        >
          {isLoading ? "Securing..." : "Set New Password"}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6">
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

export default SetNewPassword;
