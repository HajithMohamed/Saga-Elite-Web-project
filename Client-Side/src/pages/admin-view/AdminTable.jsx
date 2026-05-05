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
        <thead className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md">
          <tr className="border-b border-[#4d4635] text-[9px] uppercase tracking-[0.25em] text-[#99907c] se-label">
            <th className="px-4 py-3 text-left">
              Admin
            </th>
            <th className="px-4 py-3 text-left">
              Role
            </th>
            <th className="px-4 py-3 text-left">
              Joined
            </th>
            <th className="px-4 py-3 text-left">
              Last Active
            </th>
            <th className="px-4 py-3 text-right">
              Actions
            </th>
            <th className="px-4 py-3 text-right">
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
                className="border-t border-[#4d4635]/40 transition-all duration-300 hover:bg-[#1c1b1b] hover:shadow-[inset_4px_0_0_0_#D4AF37]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f2ca50] to-[#9a7a1e] text-xs font-semibold text-[#0a0a0a]">
                      {getInitials(admin.name || admin.email)}
                    </div>
                    <div>
                      <p className="font-medium leading-tight text-[#e5e2e1] se-body">
                        {admin.name || "N/A"}
                        {isSelf ? (
                          <span className="ml-2 text-[10px] font-normal text-[#99907c] se-label tracking-widest">(you)</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#99907c] se-mono">{admin.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-sm px-2 py-1 text-[9px] se-label tracking-widest ${
                      isSuperAdmin
                        ? "bg-[#f2ca50] text-[#0a0a0a]"
                        : "bg-[#4d4635] text-[#e5e2e1]"
                    }`}
                  >
                    {getRoleLabel(admin.role)}
                  </span>
                </td>

                <td className="px-4 py-4 text-[#99907c] se-mono text-[10px]">{formatDate(admin.createdAt)}</td>

                <td className="px-4 py-4 text-[#99907c] se-mono text-[10px]">
                  {admin.lastActiveAt ? formatDate(admin.lastActiveAt) : "Never"}
                </td>

                <td className="px-4 py-4 text-right">
                  <span className="font-medium text-[#e5e2e1] se-mono">{admin.actionCount ?? 0}</span>
                  <span className="ml-1 text-[9px] text-[#99907c] se-label tracking-widest">actions</span>
                </td>

                <td className="px-4 py-4 text-right">
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
