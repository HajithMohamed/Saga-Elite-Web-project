import React from "react";
import { useSelector } from "react-redux";

const ActivityLogTable = () => {
  const { activityLogs, logsLoading } = useSelector((s) => s.superAdmin);

  if (logsLoading) return <div className="text-center py-16 text-gray-400 text-sm animate-pulse">Loading logs…</div>;
  if (!activityLogs.length) return <div className="text-center py-16 text-gray-400 text-sm">No activity logs found.</div>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 mt-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Admin Email</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Action</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Method & Route</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {activityLogs.map((log) => (
            <tr key={log._id} className="hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString("en-GB")}
              </td>
              <td className="px-5 py-4 font-medium text-gray-900">
                {log.adminId?.email || "Unknown Admin"}
              </td>
              <td className="px-5 py-4 text-gray-700">{log.action}</td>
              <td className="px-5 py-4">
                <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-mono mr-2">
                  {log.method}
                </span>
                <span className="text-xs text-gray-400 font-mono">{log.route}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogTable;