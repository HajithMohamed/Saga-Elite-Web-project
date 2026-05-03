import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleAdminStatus } from "../../store/admin/super-admin-slice";
import { itemVariants, containerVariants } from "@/components/admin-components/_shared/animations";
import { EmptyState } from "@/components/admin-components/_shared/EmptyState";
import { Users } from "lucide-react";
import { DangerButton, SecondaryButton } from "@/components/admin-components/_shared/Buttons";

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
      <EmptyState
        icon={Users}
        title="No admin accounts found"
        subtitle="Create a new admin to grant dashboard access."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-[20px] border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Admin
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Role
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Joined
            </th>
            <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Last Active
            </th>
            <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Actions
            </th>
            <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Status
            </th>
          </tr>
        </thead>
        <motion.tbody
          className="bg-transparent"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {admins.map((admin) => {
            const isSelf = admin._id === currentUserId;
            const isSuperAdmin = admin.role === "super_admin";
            const isToggling = toggleLoading === admin._id;

            return (
              <motion.tr
                key={admin._id}
                variants={itemVariants}
                className="border-t border-white/10 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] to-[#9a7a1e] text-xs font-semibold text-black">
                      {getInitials(admin.name || admin.email)}
                    </div>
                    <div>
                      <p className="font-medium leading-tight text-white">
                        {admin.name || "N/A"}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">{admin.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isSuperAdmin
                        ? "bg-[#D4AF37] text-black"
                        : "bg-white/10 text-gray-200"
                    }`}
                  >
                    {getRoleLabel(admin.role)}
                  </span>
                </td>

                <td className="px-5 py-4 text-gray-400">{formatDate(admin.createdAt)}</td>

                <td className="px-5 py-4 text-gray-400">
                  {admin.lastActiveAt ? formatDate(admin.lastActiveAt) : "Never"}
                </td>

                <td className="px-5 py-4 text-right">
                  <span className="font-medium text-white">{admin.actionCount ?? 0}</span>
                  <span className="ml-1 text-xs text-gray-500">actions</span>
                </td>

                <td className="px-5 py-4 text-right">
                  {isSelf || isSuperAdmin ? (
                    <span className="text-xs text-gray-500">—</span>
                  ) : admin.isActive ? (
                    <DangerButton
                      type="button"
                      disabled={isToggling}
                      onClick={() => dispatch(toggleAdminStatus(admin._id))}
                      className="px-3 py-1.5 text-xs"
                    >
                      {isToggling ? (
                        <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Deactivate"
                      )}
                    </DangerButton>
                  ) : (
                    <SecondaryButton
                      type="button"
                      disabled={isToggling}
                      onClick={() => dispatch(toggleAdminStatus(admin._id))}
                      className="px-3 py-1.5 text-xs"
                    >
                      {isToggling ? (
                        <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Activate"
                      )}
                    </SecondaryButton>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
};

export default AdminTable;
