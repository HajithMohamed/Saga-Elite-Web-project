import { motion } from "framer-motion";

/** Master prompt 2E — single skeleton card */
export function SkeletonCard({ className = "" }) {
  return (
    <motion.div
      className={`rounded-[28px] border border-white/10 bg-white/[0.03] p-5 h-36 ${className}`.trim()}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
    />
  );
}

/** Table row placeholder */
export function SkeletonRow({ colSpan = 1 }) {
  return (
    <motion.tr
      className="border-t border-white/10"
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
    >
      <td colSpan={colSpan} className="px-5 py-4">
        <div className="h-4 w-full max-w-md rounded-full bg-white/10" />
      </td>
    </motion.tr>
  );
}

export function SkeletonGrid({ count = 6, className = "grid gap-4 md:grid-cols-2 xl:grid-cols-3" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
