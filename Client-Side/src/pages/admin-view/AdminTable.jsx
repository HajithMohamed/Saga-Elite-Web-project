import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleAdminStatus } from "../../store/admin/super-admin-slice";

const getRoleLabel = (role) =>
  role === "super_admin" ? "Super Admin" : "Admin";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const AdminTable = ({ admins = [], currentUserId }) => {
  const dispatch = useDispatch();
  const { toggleLoading } = useSelector((s) => s.superAdmin);

  if (!admins.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No admin accounts found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 font-medium text-gray-500">Admin</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Joined</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Last Active</th>
            <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
            <th className="text-right px-5 py-3 font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {admins.map((admin) => {
            const isSelf = admin._id === currentUserId;
            const isSuperAdmin = admin.role === "super_admin";
            const isToggling = toggleLoading === admin._id;

            return (
              <tr
                key={admin._id}
                className="bg-white hover:bg-gray-50/60 transition-colors"
              >
                {/* Admin info */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(admin.name || admin.email)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 leading-tight">
                        {admin.name || "N/A"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {admin.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        isSuperAdmin
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {getRoleLabel(admin.role)}
                  </span>
                </td>

                <td className="px-5 py-4 text-gray-500">
                  {formatDate(admin.createdAt)}
                </td>

                <td className="px-5 py-4 text-gray-500">
                  {admin.lastActiveAt
                    ? formatDate(admin.lastActiveAt)
                    : "Never"}
                </td>

                <td className="px-5 py-4 text-right">
                  <span className="text-gray-700 font-medium">
                    {admin.actionCount ?? 0}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">actions</span>
                </td>

                <td className="px-5 py-4 text-right">
                  {isSelf || isSuperAdmin ? (
                    <span className="text-gray-300 text-xs">—</span>
                  ) : (
                    <button
                      onClick={() => dispatch(toggleAdminStatus(admin._id))}
                      disabled={isToggling}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          admin.isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isToggling
                        ? "…"
                        : admin.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;