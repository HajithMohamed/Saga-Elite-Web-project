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
      className={`rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0a0a0a] shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:bg-[#F2CA50] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
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
      className={`rounded-full border border-[#4d4635] bg-transparent px-4 py-2.5 text-sm font-medium text-[#e5e2e1] hover:bg-[#131313] hover:border-[#99907c] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
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
      className={`rounded-full border border-red-500/50 bg-transparent px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.button>
  );
}
