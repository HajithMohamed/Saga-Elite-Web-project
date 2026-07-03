import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowRight, Check, X, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { registerUserAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { describeAuthError } from "@/lib/auth-errors";
import AuthPageWrapper from "@/components/auth-components/AuthPageWrapper";
import LuxuryInput from "@/components/auth-components/LuxuryInput";
import GoogleAuthButton from "@/components/auth-components/GoogleAuthButton";
import FacebookAuthButton from "@/components/auth-components/FacebookAuthButton";
import usePageMeta from "@/hooks/use-page-meta";
import { Hairline } from "@/components/ui/editorial";

const VALID_MOBILE_PREFIXES = ["70", "71", "72", "74", "75", "76", "77", "78"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);

const isValidSriLankanMobile = (raw) => {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return false;
  let local = digits;
  if (local.startsWith("0094")) local = local.slice(4);
  else if (local.startsWith("94") && local.length === 11) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);
  return local.length === 9 && VALID_MOBILE_PREFIXES.includes(local.slice(0, 2));
};

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
  return { label: "Excellent", color: "bg-gold", text: "text-gold-ink" };
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
    <div className="mt-4 rounded-xl border border-ink/5 bg-ink/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="se-label text-[10px] uppercase tracking-[0.2em] text-muted">Password Strength</span>
        <span className={`se-label text-[10px] uppercase tracking-[0.2em] font-bold ${strength.text}`}>{strength.label}</span>
      </div>
      <div className="flex gap-1 mb-4 h-1">
        {[...Array(5)].map((_, i) => {
          const score = Object.values(reqs).filter(Boolean).length;
          return (
            <div key={i} className={`h-full flex-1 rounded-full transition-colors duration-500 ${i < score ? strength.color : 'bg-ink/10'}`} />
          );
        })}
      </div>
      <div className="space-y-2">
        {allReqs.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {req.met ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-rose-400/50" />}
            <span className={`text-xs ${req.met ? 'text-ink-2' : 'text-muted'}`}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const validateForm = (data, touched) => {
  const errs = {};
  if (touched.email && !data.email) errs.email = "Tell us your email.";
  else if (data.email && !EMAIL_REGEX.test(data.email)) errs.email = "Please enter a valid email address.";

  if (touched.password && !data.password) errs.password = "Create a password.";
  else if (data.password && Object.values(checkPasswordReqs(data.password)).includes(false)) {
    errs.password = "Please meet all password requirements.";
  }

  if (touched.confirmPassword && !data.confirmPassword) errs.confirmPassword = "Confirm your password.";
  else if (data.confirmPassword && data.password !== data.confirmPassword) errs.confirmPassword = "Passwords do not match.";

  if (data.phoneNumber && !isValidSriLankanMobile(data.phoneNumber)) {
    errs.phoneNumber = "Enter a valid Sri Lankan mobile (e.g. 0771234567).";
  }
  return errs;
};

const Register = () => {
  usePageMeta({ title: "Join Saga Elite" });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setErrors(validateForm(formData, touched));
  }, [formData, touched]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };
  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return toast({ title: "Terms required", description: "Please agree to the Terms and Privacy Policy.", variant: "destructive" });

    const allTouched = { email: true, password: true, confirmPassword: true };
    setTouched((prev) => ({ ...prev, ...allTouched }));

    const fresh = validateForm(formData, allTouched);
    setErrors(fresh);
    if (Object.keys(fresh).length > 0) return;

    setIsLoading(true);
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        username: formData.firstName.trim() ? `${formData.firstName} ${formData.lastName}`.trim() : undefined,
      };
      if (formData.phoneNumber.trim()) payload.phoneNumber = formData.phoneNumber.trim();
      
      const response = await dispatch(registerUserAction(payload)).unwrap();
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/auth/verify-otp", { state: { email: payload.email } });
      }, 3000);
    } catch (err) {
      const { title, description } = describeAuthError(err, { title: "Registration failed" });
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthPageWrapper title="Welcome to Saga Elite" description="Your account has been successfully created. We are sending a secure code to your email." badgeText="Account Created">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 border border-gold-ink/20 mb-6">
            <CheckCircle2 className="h-12 w-12 text-gold-ink" />
          </div>
          <h2 className="se-serif text-3xl text-ink-2">Welcome to the Elite</h2>
          <p className="se-body mt-4 text-muted max-w-sm">Redirecting to email verification...</p>
        </motion.div>
      </AuthPageWrapper>
    );
  }

  return (
    <AuthPageWrapper
      title="Create Your Account"
      description="Join the elite to access exclusive drops, members-only chapters, and early releases."
      badgeText="Secure Registration"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <LuxuryInput
            id="firstName"
            type="text"
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange("firstName")}
            onBlur={() => markTouched("firstName")}
          />
          <LuxuryInput
            id="lastName"
            type="text"
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            onBlur={() => markTouched("lastName")}
          />
        </div>

        <LuxuryInput
          id="email"
          type="email"
          label="Email Address"
          placeholder="your@email.com"
          autoComplete="email"
          value={formData.email}
          error={touched.email ? errors.email : ""}
          onChange={handleChange("email")}
          onBlur={() => markTouched("email")}
        />

        <LuxuryInput
          id="phoneNumber"
          type="tel"
          label="Phone Number (Optional)"
          placeholder="0771234567"
          value={formData.phoneNumber}
          error={touched.phoneNumber ? errors.phoneNumber : ""}
          onChange={handleChange("phoneNumber")}
          onBlur={() => markTouched("phoneNumber")}
        />

        <div>
          <LuxuryInput
            id="password"
            type="password"
            label="Password"
            placeholder="Choose your password"
            autoComplete="new-password"
            value={formData.password}
            error={touched.password ? errors.password : ""}
            onChange={handleChange("password")}
            onBlur={() => markTouched("password")}
          />
          {formData.password.length > 0 && (
            <PasswordChecklist password={formData.password} />
          )}
        </div>

        <LuxuryInput
          id="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          value={formData.confirmPassword}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          onChange={handleChange("confirmPassword")}
          onBlur={() => markTouched("confirmPassword")}
        />

        <div className="flex items-start gap-3 mt-4">
          <label className="flex items-start gap-3 cursor-pointer group mt-1">
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ink/20 bg-transparent transition-colors group-hover:border-gold-ink">
              <input
                type="checkbox"
                className="peer absolute inset-0 opacity-0 cursor-pointer"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <CheckCircle2 className="h-4 w-4 text-gold-ink opacity-0 transition-opacity peer-checked:opacity-100" />
            </div>
            <span className="se-body text-xs leading-relaxed text-muted group-hover:text-cream transition-colors">
              I agree to the <Link to="/legal/terms-and-conditions" className="text-gold-ink hover:underline" target="_blank">Terms & Conditions</Link> and <Link to="/legal/privacy-policy" className="text-gold-ink hover:underline" target="_blank">Privacy Policy</Link>.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex h-[56px] w-full mt-6 items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-gold px-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-ongold transition-all hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-gold/50"
        >
          {isLoading ? "Creating Account..." : "Register"}
          {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      {(GOOGLE_ENABLED || FACEBOOK_ENABLED) && (
        <div className="mt-8">
          <div className="mb-6 flex items-center gap-4">
            <Hairline tone="soft" />
            <span className="se-label text-[10px] uppercase tracking-[0.28em] text-goldshadow whitespace-nowrap">
              Or register with
            </span>
            <Hairline tone="soft" />
          </div>
          <div className="space-y-3">
            {GOOGLE_ENABLED && (
              <div className="opacity-85 transition-opacity hover:opacity-100">
                <GoogleAuthButton onSuccess={() => {}} onError={() => {}} label="Register with Google" />
              </div>
            )}
            {FACEBOOK_ENABLED && (
              <div className="opacity-85 transition-opacity hover:opacity-100">
                <FacebookAuthButton onSuccess={() => {}} onError={() => {}} label="Register with Facebook" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center border-t border-ink/5 pt-6">
        <p className="se-body text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="se-label text-[10px] font-medium uppercase tracking-[0.2em] text-gold-ink transition-colors hover:text-gold-ink"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthPageWrapper>
  );
};

export default Register;
