import { motion, AnimatePresence } from "framer-motion";
import { toastFlashVariants } from "./animations";

/** Master prompt 2J */
export function ToastFlash({ show, message, className = "" }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          variants={toastFlashVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ${className}`.trim()}
        >
          ✓ {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
