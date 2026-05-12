import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ShieldCheck, Check, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  loginUserAction, registerUserAction, googleSignInAction,
  googleSignUpAction, facebookSignInAction, facebookSignUpAction,
  verifyOtpAction, resendOtpAction, forgotPasswordAction,
} from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { firstPasswordError } from "@/lib/password-strength";
import LuxuryInput from "./LuxuryInput";
import OtpCells from "./OtpCells";
import GoogleAuthButton from "./GoogleAuthButton";
import FacebookAuthButton from "./FacebookAuthButton";
import PasswordStrengthMeter from "@/components/common-components/PasswordStrengthMeter";
import { AUTH_PRIMARY_BTN, Btn, Eyebrow, Hairline } from "@/components/ui/editorial";

/* ── Context ─────────────────────────────────────────────── */
const DrawerCtx = createContext({ open: () => {}, close: () => {} });
export const useAuthDrawer = () => useContext(DrawerCtx);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+?94|0)?7[0-9]{8}$/;
const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
const FACEBOOK_ENABLED = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);

const BENEFITS = ["Faster checkout", "Order tracking", "Exclusive drops", "Early access", "Save wishlist"];

const resolveDestination = (user) => {
  const role = String(user?.role || "").toLowerCase();
  return ["admin", "super_admin", "superadmin", "sub_admin"].includes(role)
    ? "/admin/dashboard"
    : "/shopping/home";
};

const resolveUser = (payload) =>
  payload?.data?.user ?? (payload?.data && typeof payload.data === "object" ? payload.data : null) ?? payload?.user ?? null;

/* ── Login Form ──────────────────────────────────────────── */
const LoginForm = ({ onClose, switchToRegister }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [fd, setFd] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback((data, t) => {
    const e = {};
    if (t.email && !data.email) e.email = "Enter your email.";
    else if (data.email && !EMAIL_REGEX.test(data.email)) e.email = "Invalid email.";
    if (t.password && !data.password) e.password = "Enter your password.";
    return e;
  }, []);

  useEffect(() => { setErrors(validate(fd, touched)); }, [fd, touched, validate]);

  const set = (k) => (e) => {
    setFd(p => ({ ...p, [k]: e.target.value }));
    setTouched(p => ({ ...p, [k]: true }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const t = { email: true, password: true };
    setTouched(t);
    const fresh = validate(fd, t);
    setErrors(fresh);
    if (Object.keys(fresh).length) return;
    setLoading(true);
    try {
      const res = await dispatch(loginUserAction(fd)).unwrap();
      const u = resolveUser(res);
      toast({ title: "Welcome back", variant: "success" });
      onClose();
      navigate(resolveDestination(u), { replace: true });
    } catch (err) {
      toast({ title: "Login failed", description: err?.response?.data?.message || err?.message || "Check your details.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGoogle = async ({ access_token }) => {
    setLoading(true);
    try {
      const res = await dispatch(googleSignInAction({ accessToken: access_token })).unwrap();
      onClose(); navigate(resolveDestination(resolveUser(res)), { replace: true });
      toast({ title: "Welcome back", variant: "success" });
    } catch (err) {
      toast({ title: "Google sign-in failed", description: err?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleFacebook = async ({ access_token }) => {
    setLoading(true);
    try {
      const res = await dispatch(facebookSignInAction({ accessToken: access_token })).unwrap();
      onClose(); navigate(resolveDestination(resolveUser(res)), { replace: true });
      toast({ title: "Welcome back", variant: "success" });
    } catch (err) {
      toast({ title: "Facebook sign-in failed", description: err?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <Eyebrow tone="gold" size="md">Welcome Back</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-tight">Continue your<br />elite experience.</h2>
      <p className="mt-3 text-xs text-[#99907c] leading-relaxed">Sign in to unlock exclusive collections and early drop access.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <LuxuryInput id="drawer-email" type="email" label="Email Address" autoComplete="email"
          value={fd.email} error={touched.email ? errors.email : ""} onChange={set("email")} onBlur={() => setTouched(p => ({ ...p, email: true }))} />
        <div>
          <LuxuryInput id="drawer-password" type="password" label="Your Private Key" autoComplete="current-password"
            value={fd.password} error={touched.password ? errors.password : ""} onChange={set("password")} onBlur={() => setTouched(p => ({ ...p, password: true }))} />
          <div className="flex justify-end mt-1">
            <Link to="/auth/forgot-password" onClick={onClose} className="se-label text-[9px] uppercase tracking-[0.24em] text-[#99907c] hover:text-[#f2ca50] transition-colors">
              Reset your access
            </Link>
          </div>
        </div>
        <Btn variant="default" className={`${AUTH_PRIMARY_BTN} w-full`} iconRight={loading ? undefined : ArrowRight} type="submit" disabled={loading}>
          {loading ? "Entering..." : "Enter the elite"}
        </Btn>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#99907c]">
        <ShieldCheck size={12} className="text-[#f2ca50]" /><span>Secure & Encrypted</span>
      </div>

      {(GOOGLE_ENABLED || FACEBOOK_ENABLED) && (
        <div className="mt-4">
          <div className="flex items-center gap-3 my-4">
            <Hairline tone="soft" /><span className="se-label text-[9px] tracking-[0.28em] text-[#574500] whitespace-nowrap">Or continue with</span><Hairline tone="soft" />
          </div>
          <div className="space-y-2">
            {GOOGLE_ENABLED && <GoogleAuthButton onSuccess={handleGoogle} onError={() => toast({ title: "Google failed", variant: "destructive" })} label="Continue with Google" />}
            {FACEBOOK_ENABLED && <FacebookAuthButton onSuccess={handleFacebook} onError={() => toast({ title: "Facebook failed", variant: "destructive" })} label="Continue with Facebook" />}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-[#99907c] text-center">
        Not a member yet?{" "}
        <button onClick={switchToRegister} className="text-[#f2ca50] hover:text-[#ffe088] transition-colors se-label text-[9px] tracking-[0.2em] uppercase">Join the brand</button>
      </p>
    </motion.div>
  );
};

/* ── Register Form ───────────────────────────────────────── */
const RegisterForm = ({ onClose, switchToLogin, onOtpRequired }) => {
  const dispatch = useDispatch();
  const [fd, setFd] = useState({ username: "", email: "", password: "", confirmPassword: "", phoneNumber: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback((data, t) => {
    const e = {};
    if (t.username && !data.username) e.username = "How should we call you?";
    if (t.email && !data.email) e.email = "Tell us your email.";
    else if (data.email && !EMAIL_REGEX.test(data.email)) e.email = "Invalid email.";
    if (t.password && !data.password) e.password = "Create a password.";
    else if (data.password) { const pe = firstPasswordError(data.password); if (pe) e.password = pe; }
    if (t.confirmPassword && !data.confirmPassword) e.confirmPassword = "Confirm your password.";
    else if (data.confirmPassword && data.password !== data.confirmPassword) e.confirmPassword = "Passwords don't match.";
    if (t.phoneNumber && !data.phoneNumber) e.phoneNumber = "Phone number required.";
    else if (data.phoneNumber && !PHONE_REGEX.test(data.phoneNumber.replace(/\s/g, ""))) e.phoneNumber = "Enter a valid Sri Lankan mobile.";
    return e;
  }, []);

  useEffect(() => { setErrors(validate(fd, touched)); }, [fd, touched, validate]);

  const set = (k) => (e) => {
    setFd(p => ({ ...p, [k]: e.target.value }));
    setTouched(p => ({ ...p, [k]: true }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const t = { username: true, email: true, password: true, confirmPassword: true, phoneNumber: true };
    setTouched(t);
    const fresh = validate(fd, t);
    setErrors(fresh);
    if (Object.keys(fresh).length) return;
    setLoading(true);
    try {
      await dispatch(registerUserAction(fd)).unwrap();
      toast({ title: "Welcome to the atelier", description: "Verify your email to continue.", variant: "success" });
      onOtpRequired(fd.email);
    } catch (err) {
      toast({ title: "Registration failed", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <Eyebrow tone="gold" size="md">Create Account</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-tight">Gain<br />access.</h2>

      <div className="mt-4 p-3 bg-[#111]/80 border border-[#1f1f1f] rounded-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[#d0c5af] text-[11px]">
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#f2ca50]/10 text-[#f2ca50]"><Check size={8} strokeWidth={2.5} /></span>
              {b}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <LuxuryInput id="r-username" type="text" label="Your Handle" autoComplete="username" value={fd.username} error={touched.username ? errors.username : ""} onChange={set("username")} onBlur={() => setTouched(p => ({ ...p, username: true }))} />
        <LuxuryInput id="r-email" type="email" label="Email Address" autoComplete="email" value={fd.email} error={touched.email ? errors.email : ""} onChange={set("email")} onBlur={() => setTouched(p => ({ ...p, email: true }))} />
        <div>
          <LuxuryInput id="r-password" type="password" label="Choose Password" autoComplete="new-password" value={fd.password} error={touched.password ? errors.password : ""} onChange={set("password")} onBlur={() => setTouched(p => ({ ...p, password: true }))} />
          {fd.password && <div className="mt-1"><PasswordStrengthMeter password={fd.password} /></div>}
        </div>
        <LuxuryInput id="r-confirm" type="password" label="Confirm Password" autoComplete="new-password" value={fd.confirmPassword} error={touched.confirmPassword ? errors.confirmPassword : ""} onChange={set("confirmPassword")} onBlur={() => setTouched(p => ({ ...p, confirmPassword: true }))} />
        <LuxuryInput id="r-phone" type="tel" label="Mobile (Sri Lanka)" placeholder="0771234567" autoComplete="tel" value={fd.phoneNumber} error={touched.phoneNumber ? errors.phoneNumber : ""} onChange={set("phoneNumber")} onBlur={() => setTouched(p => ({ ...p, phoneNumber: true }))} />
        <Btn variant="default" className={`${AUTH_PRIMARY_BTN} w-full`} iconRight={loading ? undefined : ArrowRight} type="submit" disabled={loading}>
          {loading ? "Preparing your space..." : "Continue"}
        </Btn>
      </form>

      <p className="mt-5 text-xs text-[#99907c] text-center">
        Already a member?{" "}
        <button onClick={switchToLogin} className="text-[#f2ca50] hover:text-[#ffe088] transition-colors se-label text-[9px] tracking-[0.2em] uppercase">Sign in</button>
      </p>
    </motion.div>
  );
};

/* ── OTP Panel ───────────────────────────────────────────── */
const OtpPanel = ({ onClose, onBack }) => {
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
      setTimeout(() => { onClose(); navigate(resolveDestination(user), { replace: true }); }, 2200);
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
    const [name, domain] = e.split("@");
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}${name[1]}***${name[name.length - 1]}@${domain}`;
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 4) { toast({ title: "Enter all 4 digits", variant: "destructive" }); return; }
    if (!user?._id) { toast({ title: "Session expired. Please register again.", variant: "destructive" }); return; }
    dispatch(verifyOtpAction({ otp, userId: user._id })).unwrap().catch(err => {
      toast({ title: "Verification failed", description: err || "Code didn't match.", variant: "destructive" });
    });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <motion.div className="absolute w-24 h-24 rounded-full border border-[#f2ca50]/30" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.2, 1.0], opacity: [0, 0.6, 0.3] }} transition={{ duration: 0.8 }} />
        <motion.div className="w-14 h-14 rounded-full bg-[#f2ca50]/10 border border-[#f2ca50]/40 flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <CheckCheck size={24} strokeWidth={1.5} className="text-[#f2ca50]" />
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6">
        <p className="se-label text-[11px] tracking-[0.5em] text-[#f2ca50]">ACCESS GRANTED</p>
        <p className="se-serif text-[#e5e2e1] text-xl mt-2">Welcome to the elite.</p>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <button onClick={onBack} className="se-label text-[9px] tracking-[0.24em] text-[#99907c] hover:text-[#f2ca50] transition-colors uppercase mb-5 flex items-center gap-1">
        ← Back
      </button>
      <Eyebrow tone="gold" size="md">Almost inside</Eyebrow>
      <h2 className="mt-2 se-serif text-[#e5e2e1] text-2xl leading-tight">Confirm<br />your access.</h2>
      <p className="mt-3 text-xs text-[#d0c5af]">
        A four-digit code was sent to <span className="text-[#e5e2e1]">{masked || "your inbox"}</span>.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <OtpCells length={4} value={otp} onChange={setOtp} disabled={isLoading} success={success} />
        <Btn variant="default" className={`${AUTH_PRIMARY_BTN} w-full`} iconRight={ArrowRight} type="submit" disabled={isLoading || otp.length < 4}>
          {isLoading ? "Verifying..." : "Confirm access"}
        </Btn>
      </form>
      <div className="mt-5 text-center">
        {seconds > 0 ? (
          <span className="se-label text-[9px] tracking-widest text-[#99907c]">Resend in <span className="text-[#e5e2e1]">{seconds}s</span></span>
        ) : (
          <button onClick={handleResend} disabled={resending} className="se-label text-[9px] tracking-widest text-[#f2ca50] hover:text-[#ffe088] transition-colors disabled:opacity-50">
            {resending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/* ── Drawer Shell ────────────────────────────────────────── */
export const AuthDrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("login"); // login | register | otp
  const { isAuthenticated } = useSelector(s => s.auth);

  const open = useCallback((startTab = "login") => { setTab(startTab); setIsOpen(true); }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close if user becomes authenticated (login success)
  useEffect(() => {
    if (isAuthenticated && tab === "login") setIsOpen(false);
  }, [isAuthenticated, tab]);

  return (
    <DrawerCtx.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 z-[201] h-full w-full sm:w-[420px] bg-[#0a0a0a] border-l border-[#D4AF37]/20 flex flex-col overflow-hidden"
            >
              {/* Gold left accent line */}
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#f2ca50]/60 via-[#D4AF37]/20 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1f1f1f] shrink-0">
                <div className="flex items-center gap-3">
                  <img src="/LOGO.png" alt="Saga Elite" className="h-8 w-8 object-contain" onError={e => e.currentTarget.style.display = "none"} />
                  <span className="se-label text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase">Saga Elite</span>
                </div>
                <button onClick={close} className="text-[#99907c] hover:text-white transition-colors p-1" aria-label="Close">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Tab row — only show for login/register */}
              {tab !== "otp" && (
                <div className="flex border-b border-[#1f1f1f] shrink-0">
                  {[["login", "Sign In"], ["register", "Join"]].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`flex-1 py-3 se-label text-[10px] tracking-[0.22em] uppercase transition-colors relative ${tab === key ? "text-[#f2ca50]" : "text-[#574500] hover:text-[#99907c]"}`}
                    >
                      {label}
                      {tab === key && (
                        <motion.span layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#f2ca50]" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {tab === "login" && (
                    <LoginForm key="login" onClose={close} switchToRegister={() => setTab("register")} />
                  )}
                  {tab === "register" && (
                    <RegisterForm key="register" onClose={close} switchToLogin={() => setTab("login")} onOtpRequired={() => setTab("otp")} />
                  )}
                  {tab === "otp" && (
                    <OtpPanel key="otp" onClose={close} onBack={() => setTab("register")} />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DrawerCtx.Provider>
  );
};
