import { motion, AnimatePresence } from "framer-motion";
import { modalCardVariants } from "./animations";

/**
 * Inline delete/action confirmation (RULE 3) — scaled-down modal entrance.
 */
export function ConfirmInline({
  show,
  message = "Are you sure?",
  confirmLabel = "Confirm Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  className = "",
}) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalCardVariants}
          className={`mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 ${className}`.trim()}
        >
          <p className="mb-3 font-medium">{message}</p>
          <div className="flex flex-wrap gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={onCancel}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white"
            >
              {cancelLabel}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={onConfirm}
              className="rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-100"
            >
              {confirmLabel}
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
