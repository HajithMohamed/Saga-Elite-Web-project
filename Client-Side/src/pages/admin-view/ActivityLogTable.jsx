import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Search, ScrollText } from "lucide-react";
import { containerVariants, itemVariants } from "@/components/admin-components/_shared/animations";
import { MethodBadge } from "@/components/admin-components/_shared/StatusBadge";
import { SkeletonRow } from "@/components/admin-components/_shared/SkeletonCard";
import { EmptyState } from "@/components/admin-components/_shared/EmptyState";

const ActivityLogTable = ({ logs: logsProp, loading: loadingProp, hideSearch = false }) => {
  // Default to the SuperAdmin slice while still allowing callers to pass
  // their own logs explicitly.
  const fallback = useSelector((s) => s.superAdmin);
  const activityLogs = logsProp ?? fallback.activityLogs;
  const logsLoading = loadingProp ?? fallback.logsLoading;
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return activityLogs;
    return (activityLogs || []).filter((log) => {
      const email = (log.adminId?.email || "").toLowerCase();
      const action = (log.action || "").toLowerCase();
      const route = (log.route || "").toLowerCase();
      return email.includes(s) || action.includes(s) || route.includes(s);
    });
  }, [activityLogs, q]);

  if (logsLoading) {
    return (
      <div className="mt-6 overflow-x-auto rounded-[20px] border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-panel text-[9px] uppercase tracking-[0.25em] text-muted se-label">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Admin Email</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Method &amp; Route</th>
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

  if (!activityLogs?.length) {
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
      {hideSearch ? null : (
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by email, action, or route…"
            className="w-full rounded-2xl border border-ink/10 bg-black/60 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-gold-ink2"
          />
        </div>
      )}

      {!filtered.length ? (
        <p className="text-sm text-gray-500">No logs match your search.</p>
      ) : null}

      <div className="overflow-x-auto rounded-[20px] border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-panel text-[9px] uppercase tracking-[0.25em] text-muted se-label">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Admin Email</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Method &amp; Route</th>
            </tr>
          </thead>
          <motion.tbody
            className="bg-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((log) => (
              <motion.tr
                key={log._id}
                variants={itemVariants}
                className="border-t border-line/40 transition-colors hover:bg-panel"
              >
                <td className="whitespace-nowrap px-4 py-3 text-muted se-mono text-[10px]">
                  {new Date(log.createdAt).toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-3 font-medium text-ink-2 se-body text-sm">
                  {log.adminId?.email || "Unknown Admin"}
                </td>
                <td className="px-4 py-3 text-cream se-body text-sm">{log.action}</td>
                <td className="px-4 py-3">
                  <MethodBadge method={log.method} />
                  <span className="ml-2 text-xs se-mono text-muted">{log.route}</span>
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
