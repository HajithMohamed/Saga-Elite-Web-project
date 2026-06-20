import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, CheckCheck, ChevronLeft, Mail, ShieldCheck } from "lucide-react";
import {
  loginUserAction, registerUserAction,
  googleSignInAction, googleSignUpAction,
  facebookSignInAction, facebookSignUpAction,
  verifyOtpAction, resendOtpAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import { describeAuthError } from "@/lib/auth-errors";
import LuxuryInput from "./LuxuryInput";
import OtpCells from "./OtpCells";
import GoogleAuthButton from "./GoogleAuthButton";
import FacebookAuthButton from "./FacebookAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { AUTH_PRIMARY_BTN, Btn, Eyebrow, Hairline } from "@/components/ui/editorial";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^(\+?94|0)?7[0-9]{8}$/;
const GOOGLE = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FB = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);

void motion;

const resolveUser = (p) =>
  p?.data?.user ?? (p?.data && typeof p.data === "object" ? p.data : null) ?? p?.user ?? null;

const resolveDest = (user) => {
  const r = String(user?.role || "").toLowerCase();
  return ["admin","super_admin","superadmin","sub_admin"].includes(r) ? "/admin/dashboard" : "/shopping/home";
};

/* ─── Social Buttons Row ─────────────────────────── */
export const SocialButtons = ({ onGoogleSuccess, onGoogleError, onFbSuccess, onFbError, googleLabel, fbLabel }) => (
  <div className="space-y-2.5">
    {GOOGLE && <GoogleAuthButton onSuccess={onGoogleSuccess} onError={onGoogleError} label={googleLabel} />}
    {FB && <FacebookAuthButton onSuccess={onFbSuccess} onError={onFbError} label={fbLabel} />}
  </div>
);

/* ─── Login Form ─────────────────────────────────── */
export const LoginForm = ({ onClose, switchToRegister, onForgotPassword, initialEmail = "" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [fd, setFd] = useState({ email: initialEmail, password: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback((d, t) => {
    const e = {};
    if (t.email && !d.email) e.email = "Enter your email.";
    else if (d.email && !EMAIL.test(d.email)) e.email = "Invalid email.";
    if (t.password && !d.password) e.password = "Enter your password.";
    return e;
  }, []);

  useEffect(() => { setErrors(validate(fd, touched)); }, [fd, touched, validate]);

  const set = (k) => (e) => { setFd(p => ({ ...p, [k]: e.target.value })); setTouched(p => ({ ...p, [k]: true })); };

  const go = async (fn) => { setLoading(true); try { const r = await fn(); return r; } finally { setLoading(false); } };

  const submit = async (e) => {
    e.preventDefault();
    const t = { email: true, password: true };
    setTouched(t);
    const fresh = validate(fd, t);
    setErrors(fresh);
    if (Object.keys(fresh).length) return;
    await go(async () => {
      const r = await dispatch(loginUserAction(fd)).unwrap();
      toast({ title: "Welcome back", variant: "success" });
      onClose();
      navigate(resolveDest(resolveUser(r)), { replace: true });
    }).catch((err) => {
      const { title, description } = describeAuthError(err, {
        title: "Login failed",
      });
      toast({ title, description, variant: "destructive" });
    });
  };

  const handleGoogle = async ({ access_token }) => {
    await go(async () => {
      const r = await dispatch(googleSignInAction({ accessToken: access_token })).unwrap();
      toast({ title: "Welcome back", variant: "success" });
      onClose(); navigate(resolveDest(resolveUser(r)), { replace: true });
    }).catch(() => toast({ title: "Google sign-in failed", variant: "destructive" }));
  };

  const handleFb = async ({ access_token }) => {
    await go(async () => {
      const r = await dispatch(facebookSignInAction({ accessToken: access_token })).unwrap();
      toast({ title: "Welcome back", variant: "success" });
      onClose(); navigate(resolveDest(resolveUser(r)), { replace: true });
    }).catch(() => toast({ title: "Facebook sign-in failed", variant: "destructive" }));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <Eyebrow tone="gold" size="md">Welcome Back</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">Continue your<br />elite experience.</h2>
      <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">Sign in to unlock exclusive collections and early drop access.</p>

      {(GOOGLE || FB) && (
        <div className="mt-5">
          <SocialButtons onGoogleSuccess={handleGoogle} onGoogleError={() => toast({ title: "Google failed", variant: "destructive" })}
            onFbSuccess={handleFb} onFbError={() => toast({ title: "Facebook failed", variant: "destructive" })}
            googleLabel="Continue with Google" fbLabel="Continue with Facebook" />
          <div className="flex items-center gap-3 my-4">
            <Hairline tone="soft" /><span className="se-label text-[9px] tracking-[0.28em] text-[#574500] whitespace-nowrap">Or sign in with email</span><Hairline tone="soft" />
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-4">
        <LuxuryInput id="l-email" type="email" label="Email Address" autoComplete="email"
          value={fd.email} error={touched.email ? errors.email : ""} onChange={set("email")} onBlur={() => setTouched(p => ({ ...p, email: true }))} />
        <div>
          <LuxuryInput id="l-password" type="password" label="Your Private Key" autoComplete="current-password"
            value={fd.password} error={touched.password ? errors.password : ""} onChange={set("password")} onBlur={() => setTouched(p => ({ ...p, password: true }))} />
          <div className="flex justify-end mt-1.5">
            {onForgotPassword ? (
              <button
                type="button"
                onClick={onForgotPassword}
                className="se-label text-[9px] uppercase tracking-[0.2em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
              >
                Forgot password?
              </button>
            ) : (
              <Link
                to="/auth/forgot-password"
                className="se-label text-[9px] uppercase tracking-[0.2em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>
        </div>
        <Btn variant="default" className={`${AUTH_PRIMARY_BTN} w-full`} iconRight={loading ? undefined : ArrowRight} type="submit" disabled={loading}>
          {loading ? "Entering..." : "Enter the elite"}
        </Btn>
      </form>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#574500]">
        <ShieldCheck size={11} className="text-[#f2ca50]" /><span>Secure & Encrypted</span>
      </div>
      <p className="mt-5 text-[11px] text-[#99907c] text-center">
        Not a member yet?{" "}
        <button onClick={switchToRegister} className="text-[#f2ca50] hover:text-[#ffe088] transition-colors se-label text-[9px] tracking-[0.2em] uppercase">Join the brand</button>
      </p>
    </motion.div>
  );
};

/* ─── Join Options (Google / Facebook / Email) ───── */
export const JoinOptions = ({ onEmailClick, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const go = async (fn) => { setLoading(true); try { await fn(); } finally { setLoading(false); } };

  const handleGoogle = async ({ access_token }) => {
    await go(async () => {
      const r = await dispatch(googleSignUpAction({ accessToken: access_token })).unwrap();
      toast({ title: "Welcome to the atelier", variant: "success" });
      onClose(); navigate(resolveDest(resolveUser(r)), { replace: true });
    }).catch(() => toast({ title: "Google sign-up failed", variant: "destructive" }));
  };

  const handleFb = async ({ access_token }) => {
    await go(async () => {
      const r = await dispatch(facebookSignUpAction({ accessToken: access_token })).unwrap();
      toast({ title: "Welcome to the atelier", variant: "success" });
      onClose(); navigate(resolveDest(resolveUser(r)), { replace: true });
    }).catch(() => toast({ title: "Facebook sign-up failed", variant: "destructive" }));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <Eyebrow tone="gold" size="md">Create Account</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">Gain<br />access.</h2>
      <p className="mt-2 text-[11px] text-[#99907c] leading-relaxed">Join the brand to unlock exclusive drops, early access, and members-only chapters.</p>

      <div className="mt-6 space-y-3">
        {GOOGLE && <GoogleAuthButton onSuccess={handleGoogle} onError={() => toast({ title: "Google failed", variant: "destructive" })} label="Sign up with Google" disabled={loading} />}
        {FB && <FacebookAuthButton onSuccess={handleFb} onError={() => toast({ title: "Facebook failed", variant: "destructive" })} label="Sign up with Facebook" disabled={loading} />}

        <div className="flex items-center gap-3 my-2">
          <Hairline tone="soft" /><span className="se-label text-[9px] tracking-[0.28em] text-[#574500] whitespace-nowrap">Or</span><Hairline tone="soft" />
        </div>

        <button
          onClick={onEmailClick}
          className="w-full h-12 flex items-center justify-center gap-3 bg-[#1a1a1a] border border-[#3a3226] hover:border-[#f2ca50]/50 text-[#d0c5af] hover:text-[#f2ca50] transition-all duration-200 group"
        >
          <Mail size={16} className="group-hover:text-[#f2ca50]" />
          <span className="se-label text-[11px] tracking-[0.18em]">Sign up with email</span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-[#111]/60 border border-[#1f1f1f] rounded-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {["Faster checkout","Order tracking","Exclusive drops","Early access","Save wishlist"].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[#99907c] text-[10px]">
              <span className="flex items-center justify-center w-3 h-3 rounded-full bg-[#f2ca50]/10 text-[#f2ca50]"><Check size={7} strokeWidth={2.5} /></span>
              {b}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Email Register Form ────────────────────────── */
export const RegisterForm = ({ onBack, onOtpRequired }) => {
  const dispatch = useDispatch();
  const [fd, setFd] = useState({ username: "", email: "", password: "", confirmPassword: "", phoneNumber: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback((d, t) => {
    const e = {};
    if (t.username && !d.username) e.username = "How should we call you?";
    if (t.email && !d.email) e.email = "Tell us your email.";
    else if (d.email && !EMAIL.test(d.email)) e.email = "Invalid email.";
    if (t.password && !d.password) e.password = "Create a password.";
    else if (d.password) { const pe = firstPasswordError(d.password); if (pe) e.password = pe; }
    if (t.confirmPassword && !d.confirmPassword) e.confirmPassword = "Confirm your password.";
    else if (d.confirmPassword && d.password !== d.confirmPassword) e.confirmPassword = "Passwords don't match.";
    // phoneNumber is optional — only validate format if the user typed something
    if (d.phoneNumber && !PHONE.test(d.phoneNumber.replace(/\s/g,""))) e.phoneNumber = "Valid Sri Lankan mobile (e.g. 0771234567).";
    return e;
  }, []);

  useEffect(() => { setErrors(validate(fd, touched)); }, [fd, touched, validate]);

  const set = (k) => (e) => { setFd(p => ({ ...p, [k]: e.target.value })); setTouched(p => ({ ...p, [k]: true })); };

  const submit = async (e) => {
    e.preventDefault();
    const t = { username: true, email: true, password: true, confirmPassword: true };
    setTouched(t);
    const fresh = validate(fd, t);
    setErrors(fresh);
    if (Object.keys(fresh).length) return;
    setLoading(true);
    try {
      await dispatch(registerUserAction(fd)).unwrap();
      toast({ title: "Welcome to the atelier", description: "Verify your email to continue.", variant: "success" });
      onOtpRequired();
    } catch (err) {
      const { title, description } = describeAuthError(err, {
        title: "Registration failed",
      });
      toast({ title, description, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <button onClick={onBack} className="flex items-center gap-1 se-label text-[9px] tracking-[0.2em] text-[#99907c] hover:text-[#f2ca50] transition-colors uppercase mb-4">
        <ChevronLeft size={12} /> Back
      </button>
      <Eyebrow tone="gold" size="md">Create Account</Eyebrow>
      <h2 className="mt-1 se-serif text-[#e5e2e1] text-xl leading-snug">Sign up with email.</h2>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <LuxuryInput id="r-username" type="text" label="Your Handle" autoComplete="username" value={fd.username} error={touched.username ? errors.username : ""} onChange={set("username")} onBlur={() => setTouched(p => ({ ...p, username: true }))} />
        <LuxuryInput id="r-email" type="email" label="Email Address" autoComplete="email" value={fd.email} error={touched.email ? errors.email : ""} onChange={set("email")} onBlur={() => setTouched(p => ({ ...p, email: true }))} />
        <div>
          <LuxuryInput id="r-password" type="password" label="Choose Password" autoComplete="new-password" value={fd.password} error={touched.password ? errors.password : ""} onChange={set("password")} onBlur={() => setTouched(p => ({ ...p, password: true }))} />
          {fd.password && <div className="mt-1"><PasswordStrengthMeter password={fd.password} /></div>}
        </div>
        <LuxuryInput id="r-confirm" type="password" label="Confirm Password" autoComplete="new-password" value={fd.confirmPassword} error={touched.confirmPassword ? errors.confirmPassword : ""} onChange={set("confirmPassword")} onBlur={() => setTouched(p => ({ ...p, confirmPassword: true }))} />
        <LuxuryInput id="r-phone" type="tel" label="Mobile (Sri Lanka) — Optional" placeholder="0771234567" autoComplete="tel" value={fd.phoneNumber} error={touched.phoneNumber ? errors.phoneNumber : ""} onChange={set("phoneNumber")} onBlur={() => setTouched(p => ({ ...p, phoneNumber: true }))} />
        <Btn variant="default" className={`${AUTH_PRIMARY_BTN} w-full`} iconRight={loading ? undefined : ArrowRight} type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Btn>
      </form>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#574500]">
        <ShieldCheck size={11} className="text-[#f2ca50]" /><span>Secure & Encrypted</span>
      </div>
    </motion.div>
  );
};

/* ─── OTP Panel ──────────────────────────────────── */
export const OtpPanel = ({ onClose, onBack }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector(s => s.auth);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.isVerified && !success) {
      setSuccess(true);
      toast({ title: "Access Granted", description: "Welcome to the Elite.", variant: "success" });
      setTimeout(() => { onClose(); navigate(resolveDest(user), { replace: true }); }, 2000);
    }
  }, [user, success, onClose, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const masked = (() => {
    const e = user?.email || "";
    if (!e.includes("@")) return e;
    const [n, d] = e.split("@");
    return n.length <= 2 ? `${n[0]}***@${d}` : `${n[0]}${n[1]}***${n[n.length-1]}@${d}`;
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 4) { toast({ title: "Enter all 4 digits", variant: "destructive" }); return; }
    if (!user?._id) { toast({ title: "Session expired", variant: "destructive" }); return; }
    dispatch(verifyOtpAction({ otp, userId: user._id })).unwrap()
      .catch(err => toast({ title: "Verification failed", description: err || "Code didn't match.", variant: "destructive" }));
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await dispatch(resendOtpAction({ email: user.email })).unwrap();
      toast({ title: "Code resent", variant: "success" });
      setSeconds(45);
    } catch (err) {
      toast({ title: "Couldn't resend", description: err || "Try again.", variant: "destructive" });
    } finally { setResending(false); }
  };

  if (success) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <motion.div className="absolute w-24 h-24 rounded-full border border-[#f2ca50]/30" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.2, 1], opacity: [0, 0.5, 0.2] }} transition={{ duration: 0.8 }} />
        <motion.div className="w-14 h-14 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/40 flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
          <CheckCheck size={22} className="text-[#f2ca50]" />
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6">
        <p className="se-label text-[10px] tracking-[0.5em] text-[#f2ca50]">ACCESS GRANTED</p>
        <p className="se-serif text-[#e5e2e1] text-xl mt-2">Welcome to the elite.</p>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <button onClick={onBack} className="flex items-center gap-1 se-label text-[9px] tracking-[0.2em] text-[#99907c] hover:text-[#f2ca50] transition-colors uppercase mb-5">
        <ChevronLeft size={12} /> Back
      </button>
      <Eyebrow tone="gold" size="md">Almost inside</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-snug">Confirm<br />your access.</h2>
      <p className="mt-3 text-[11px] text-[#d0c5af]">
        A four-digit code was sent to <span className="text-[#e5e2e1]">{masked || "your inbox"}</span>.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <OtpCells length={4} value={otp} onChange={setOtp} disabled={isLoading} success={success} />
        <Btn variant="default" className={`${AUTH_PRIMARY_BTN} w-full`} iconRight={ArrowRight} type="submit" disabled={isLoading || otp.length < 4}>
          {isLoading ? "Verifying..." : "Confirm access"}
        </Btn>
      </form>
      <div className="mt-5 text-center">
        {seconds > 0
          ? <span className="se-label text-[9px] tracking-widest text-[#99907c]">Resend in <span className="text-[#e5e2e1]">{seconds}s</span></span>
          : <button onClick={handleResend} disabled={resending} className="se-label text-[9px] tracking-widest text-[#f2ca50] hover:text-[#ffe088] disabled:opacity-50">{resending ? "Sending..." : "Resend code"}</button>
        }
      </div>
    </motion.div>
  );
};
