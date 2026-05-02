import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Search, ScrollText } from "lucide-react";
import { containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";
import { MethodBadge } from "@/components/admin-components/_shared/StatusBadge";
import { SkeletonRow } from "@/components/admin-components/_shared/SkeletonCard";
import { EmptyState } from "@/components/admin-components/_shared/EmptyState";

const ActivityLogTable = () => {
  const { activityLogs, logsLoading } = useSelector((s) => s.superAdmin);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return activityLogs;
    return activityLogs.filter((log) => {
      const email = (log.adminId?.email || "").toLowerCase();
      const action = (log.action || "").toLowerCase();
      const route = (log.route || "").toLowerCase();
      return email.includes(s) || action.includes(s) || route.includes(s);
    });
  }, [activityLogs, q]);

  if (logsLoading) {
    return (
      <div className="mt-6 overflow-x-auto rounded-[20px] border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-gray-500">
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Admin Email</th>
              <th className="px-5 py-3 text-left">Action</th>
              <th className="px-5 py-3 text-left">Method &amp; Route</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} colSpan={4} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!activityLogs.length) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No activity logs"
        subtitle="Privileged actions will appear here once admins use the system."
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by email, action, or route…"
          className="w-full rounded-2xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
        />
      </div>

      {!filtered.length ? (
        <p className="text-sm text-gray-500">No logs match your search.</p>
      ) : null}

      <div className="overflow-x-auto rounded-[20px] border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-gray-500">
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Admin Email</th>
              <th className="px-5 py-3 text-left">Action</th>
              <th className="px-5 py-3 text-left">Method &amp; Route</th>
            </tr>
          </thead>
          <motion.tbody
            className="bg-[#0b0b0b]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((log) => (
              <motion.tr
                key={log._id}
                variants={itemVariants}
                className="border-t border-white/10 transition-colors hover:bg-white/[0.02]"
              >
                <td className="whitespace-nowrap px-5 py-4 text-gray-400">
                  {new Date(log.createdAt).toLocaleString("en-GB")}
                </td>
                <td className="px-5 py-4 font-medium text-white">
                  {log.adminId?.email || "Unknown Admin"}
                </td>
                <td className="px-5 py-4 text-gray-300">{log.action}</td>
                <td className="px-5 py-4">
                  <MethodBadge method={log.method} />
                  <span className="ml-2 text-xs font-mono text-gray-500">{log.route}</span>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogTable;
