import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Gift, X } from "lucide-react";

const SHOW_DELAY_MS = 5000;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_KEY = "registerPromptShown";
const DISMISS_KEY = "registerPromptDismissedAt";
const SUPPRESS_PATHS = ["/auth", "/admin"];

const RegisterPromptModal = ({ guestToken, isAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated || !guestToken) return;
    if (SUPPRESS_PATHS.some((p) => location.pathname.startsWith(p))) return;

    if (sessionStorage.getItem(SESSION_KEY)) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;

    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [guestToken, isAuthenticated, location.pathname]);

  const close = () => {
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "1");
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Gift size={28} />
                <h2 className="text-xl font-bold tracking-tight">
                  Save your spot at Saga Elite
                </h2>
              </div>
              <p className="text-amber-50 text-sm">
                Register to unlock surprise gifts, save your address, and track every order in one place.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  Eligible for random surprise gifts with orders
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  Saved shipping addresses for one-tap checkout
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  Early access to limited drops &amp; exclusive offers
                </li>
              </ul>

              <div className="flex gap-2 pt-2">
                <Link
                  to="/auth/register"
                  onClick={close}
                  className="flex-1 text-center bg-zinc-900 dark:bg-amber-600 text-white py-2.5 rounded-lg font-semibold hover:bg-zinc-800 dark:hover:bg-amber-500 transition"
                >
                  Register
                </Link>
                <button
                  onClick={close}
                  className="px-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-sm"
                >
                  Maybe later
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center pt-2">
                You can keep shopping as a guest.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegisterPromptModal;
