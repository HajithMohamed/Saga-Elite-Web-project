import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LoginForm, JoinOptions, RegisterForm, OtpPanel } from "./AuthForms";
import {
  ForgotPasswordForm,
  VerifyResetOtpForm,
  SetNewPasswordForm,
} from "./RecoveryForms";

/* ── Context ─────────────────────────────────────── */
const DrawerCtx = createContext({ open: () => {}, close: () => {} });
export const useAuthDrawer = () => useContext(DrawerCtx);

/* ── Tab bar ─────────────────────────────────────── */
const Tabs = ({ tab, setTab }) => (
  <div className="flex border-b border-[#1a1a1a] shrink-0">
    {[["login","Sign In"],["register","Join"]].map(([key, label]) => (
      <button
        key={key}
        onClick={() => setTab(key)}
        className={`flex-1 py-3.5 relative se-label text-[10px] tracking-[0.25em] uppercase transition-colors ${
          tab === key ? "text-[#f2ca50]" : "text-[#574500] hover:text-[#99907c]"
        }`}
      >
        {label}
        {tab === key && (
          <motion.span layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#f2ca50]" />
        )}
      </button>
    ))}
  </div>
);

/* ── Provider + Drawer Shell ─────────────────────── */
export const AuthDrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  // view: login | register | register-email | otp | forgot-password | reset-otp | set-new-password
  const [view, setView] = useState("login");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [loginPrefillEmail, setLoginPrefillEmail] = useState("");
  const { isAuthenticated } = useSelector(s => s.auth);

  const open = useCallback((startView = "login") => {
    setView(startView);
    setRecoveryEmail("");
    setRecoveryOtp("");
    setLoginPrefillEmail("");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => { setIsOpen(false); }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Tab derived from view
  const activeTab = view === "login" ? "login" : "register";
  const isRecoveryView = ["forgot-password", "reset-otp", "set-new-password"].includes(view);

  const handleTabChange = (tab) => {
    setView(tab === "login" ? "login" : "register");
  };

  return (
    <DrawerCtx.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={close}
              className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed top-0 right-0 z-[201] h-full w-full ${isRecoveryView ? "sm:w-[460px]" : "sm:w-[420px]"} bg-[#0a0a0a] border-l border-[#2a2a2a] flex flex-col shadow-2xl`}
            >
              {/* Gold left accent */}
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#f2ca50]/70 via-[#D4AF37]/20 to-transparent pointer-events-none" />

              {/* Header row */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src="/LOGO.png" alt="Saga Elite" className="h-7 w-7 object-contain" onError={e => e.currentTarget.style.display="none"} />
                  <span className="se-label text-[10px] tracking-[0.35em] text-[#D4AF37] uppercase">Saga Elite</span>
                </div>
                <button onClick={close} aria-label="Close" className="text-[#574500] hover:text-[#d0c5af] transition-colors p-1 rounded">
                  <X size={17} strokeWidth={1.5} />
                </button>
              </div>

              {/* Tabs — hide when on inner views */}
              {(view === "login" || view === "register") && (
                <Tabs tab={activeTab} setTab={handleTabChange} />
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 overscroll-contain">
                <AnimatePresence mode="wait">
                  {view === "login" && (
                    <LoginForm
                      key="login"
                      onClose={close}
                      switchToRegister={() => setView("register")}
                      onForgotPassword={() => setView("forgot-password")}
                      initialEmail={loginPrefillEmail}
                    />
                  )}
                  {view === "register" && (
                    <JoinOptions key="join" onEmailClick={() => setView("register-email")} onClose={close} />
                  )}
                  {view === "register-email" && (
                    <RegisterForm key="reg-email" onBack={() => setView("register")} onOtpRequired={() => setView("otp")} />
                  )}
                  {view === "otp" && (
                    <OtpPanel key="otp" onClose={close} onBack={() => setView("register-email")} />
                  )}
                  {view === "forgot-password" && (
                    <ForgotPasswordForm
                      key="forgot-password"
                      onBack={() => setView("login")}
                      onNext={(email) => {
                        setRecoveryEmail(email);
                        setView("reset-otp");
                      }}
                    />
                  )}
                  {view === "reset-otp" && (
                    <VerifyResetOtpForm
                      key="reset-otp"
                      email={recoveryEmail}
                      onBack={() => setView("forgot-password")}
                      onNext={(otp) => {
                        setRecoveryOtp(otp);
                        setView("set-new-password");
                      }}
                    />
                  )}
                  {view === "set-new-password" && (
                    <SetNewPasswordForm
                      key="set-new-password"
                      email={recoveryEmail}
                      otp={recoveryOtp}
                      onBack={() => setView("reset-otp")}
                      onDone={(email) => {
                        setLoginPrefillEmail(email);
                        setRecoveryOtp("");
                        setRecoveryEmail(email);
                        setView("login");
                      }}
                    />
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
