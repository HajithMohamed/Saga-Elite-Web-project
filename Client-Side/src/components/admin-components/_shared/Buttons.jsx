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
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold to-gold-deep px-6 py-2.5 text-sm font-bold text-black shadow-[0_4px_20px_-4px_rgba(212,175,55,0.5)] ring-1 ring-inset ring-ink/20 hover:from-[#f5d570] hover:to-[#e6bf45] hover:shadow-[0_6px_25px_-4px_rgba(212,175,55,0.65)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
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
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-line bg-transparent px-5 py-2.5 text-sm font-medium text-ink-2 hover:bg-panel hover:border-muted disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
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
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-red-500/50 bg-transparent px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}
