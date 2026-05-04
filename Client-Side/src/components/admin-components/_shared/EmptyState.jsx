import { motion } from "framer-motion";
import { pageVariants } from "./animations";

/** RULE 6 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`.trim()}
    >
      {Icon ? (
        <Icon className="mb-4 h-16 w-16 text-white opacity-20" strokeWidth={1} />
      ) : null}
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle ? (
        <p className="mt-2 max-w-md text-sm text-gray-500">{subtitle}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
