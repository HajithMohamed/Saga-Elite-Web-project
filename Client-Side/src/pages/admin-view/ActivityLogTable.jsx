import React from "react";
import { useSelector } from "react-redux";

const ActivityLogTable = () => {
  const { activityLogs, logsLoading } = useSelector((s) => s.superAdmin);

  if (logsLoading) return <div className="py-16 text-center text-sm text-gray-400 animate-pulse">Loading logs…</div>;
  if (!activityLogs.length) return <div className="py-16 text-center text-sm text-gray-400">No activity logs found.</div>;

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-black/40">
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Date</th>
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Admin Email</th>
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Action</th>
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Method & Route</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-[#0b0b0b]">
          {activityLogs.map((log) => (
            <tr key={log._id} className="transition-colors hover:bg-white/[0.02]">
              <td className="whitespace-nowrap px-5 py-4 text-gray-400">
                {new Date(log.createdAt).toLocaleString("en-GB")}
              </td>
              <td className="px-5 py-4 font-medium text-white">
                {log.adminId?.email || "Unknown Admin"}
              </td>
              <td className="px-5 py-4 text-gray-300">{log.action}</td>
              <td className="px-5 py-4">
                <span className="mr-2 inline-flex rounded bg-white/10 px-2 py-1 text-xs font-mono text-gray-200">
                  {log.method}
                </span>
                <span className="text-xs font-mono text-gray-500">{log.route}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogTable;