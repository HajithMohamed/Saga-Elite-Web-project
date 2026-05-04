import { motion } from "framer-motion";

const tapHover = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: { type: "spring", stiffness: 400, damping: 20 },
};

/** RULE 5 — primary */
export function PrimaryButton({ className = "", children, ...props }) {
  return (
    <motion.button
      type="button"
      {...tapHover}
      className={`rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#c99d2f] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** RULE 5 — secondary */
export function SecondaryButton({ className = "", children, ...props }) {
  return (
    <motion.button
      type="button"
      {...tapHover}
      className={`rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** RULE 5 — danger */
export function DangerButton({ className = "", children, ...props }) {
  return (
    <motion.button
      type="button"
      {...tapHover}
      className={`rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}
