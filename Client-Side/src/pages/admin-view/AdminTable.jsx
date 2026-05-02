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
      <div className="py-16 text-center text-sm text-gray-400">
        No admin accounts found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-black/40">
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Admin</th>
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Role</th>
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Joined</th>
            <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Last Active</th>
            <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Actions</th>
            <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-[#0b0b0b]">
          {admins.map((admin) => {
            const isSelf = admin._id === currentUserId;
            const isSuperAdmin = admin.role === "super_admin";
            const isToggling = toggleLoading === admin._id;

            return (
              <tr
                key={admin._id}
                className="transition-colors hover:bg-white/[0.02]"
              >
                {/* Admin info */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-semibold text-black">
                      {getInitials(admin.name || admin.email)}
                    </div>
                    <div>
                      <p className="font-medium leading-tight text-white">
                        {admin.name || "N/A"}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-gray-400">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
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
                          ? "bg-[#D4AF37] text-black"
                          : "bg-white/10 text-gray-200"
                      }`}
                  >
                    {getRoleLabel(admin.role)}
                  </span>
                </td>

                <td className="px-5 py-4 text-gray-400">
                  {formatDate(admin.createdAt)}
                </td>

                <td className="px-5 py-4 text-gray-400">
                  {admin.lastActiveAt
                    ? formatDate(admin.lastActiveAt)
                    : "Never"}
                </td>

                <td className="px-5 py-4 text-right">
                  <span className="font-medium text-white">
                    {admin.actionCount ?? 0}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">actions</span>
                </td>

                <td className="px-5 py-4 text-right">
                  {isSelf || isSuperAdmin ? (
                    <span className="text-xs text-gray-500">—</span>
                  ) : (
                    <button
                      onClick={() => dispatch(toggleAdminStatus(admin._id))}
                      disabled={isToggling}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          admin.isActive
                            ? "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
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