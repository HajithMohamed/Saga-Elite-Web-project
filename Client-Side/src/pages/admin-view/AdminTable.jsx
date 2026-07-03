import React from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleAdminStatus } from "../../store/admin/super-admin-slice";
import { itemVariants, containerVariants } from "@/components/admin-components/_shared/animations";
import { EmptyState } from "@/components/admin-components/_shared/EmptyState";
import { Users } from "lucide-react";
import { DangerButton, SecondaryButton } from "@/components/admin-components/_shared/Buttons";

const SUB_ROLE_LABELS = {
  order_manager: "Order Manager",
  product_manager: "Product Manager",
  marketing_manager: "Marketing",
  support_admin: "Support",
  inventory_manager: "Inventory",
};

const getRoleLabel = (admin) => {
  if (admin.role === "super_admin" || admin.role === "superadmin") return "Super Admin";
  if (admin.role === "sub_admin") return SUB_ROLE_LABELS[admin.subRole] || "Sub Admin";
  return "Full Admin";
};

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

const AdminTable = ({ admins = [], currentUserId, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const { toggleLoading, deleteLoading } = useSelector((s) => s.superAdmin);

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
    <div className="overflow-x-auto rounded-[20px] border border-ink/10">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-panel/95 backdrop-blur-md">
          <tr className="border-b border-line text-[9px] uppercase tracking-[0.25em] text-muted se-label">
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
            const isSuperAdmin = admin.role === "super_admin" || admin.role === "superadmin";
            const isToggling = toggleLoading === admin._id;

            return (
              <motion.tr
                key={admin._id}
                variants={itemVariants}
                className="border-t border-line/40 transition-all duration-300 hover:bg-card hover:shadow-[inset_4px_0_0_0_#D4AF37]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-[#9a7a1e] text-xs font-semibold text-ongold">
                      {getInitials(admin.name || admin.email)}
                    </div>
                    <div>
                      <p className="font-medium leading-tight text-ink-2 se-body">
                        {admin.name || "N/A"}
                        {isSelf ? (
                          <span className="ml-2 text-[10px] font-normal text-muted se-label tracking-widest">(you)</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted se-mono">{admin.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-sm px-2 py-1 text-[9px] se-label tracking-widest ${
                      isSuperAdmin
                        ? "bg-gold text-ongold"
                        : "bg-line text-ink-2"
                    }`}
                  >
                    {getRoleLabel(admin)}
                  </span>
                </td>

                <td className="px-4 py-4 text-muted se-mono text-[10px]">{formatDate(admin.createdAt)}</td>

                <td className="px-4 py-4 text-muted se-mono text-[10px]">
                  {admin.lastActiveAt ? formatDate(admin.lastActiveAt) : "Never"}
                </td>

                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span>
                      <span className="font-medium text-ink-2 se-mono">{admin.actionCount ?? 0}</span>
                      <span className="ml-1 text-[9px] text-muted se-label tracking-widest">actions</span>
                    </span>
                    {!(isSelf || isSuperAdmin) ? (
                      <span className="flex items-center gap-1.5 border-l border-line/60 pl-3">
                        <button
                          type="button"
                          onClick={() => onEdit?.(admin)}
                          title="Edit admin"
                          className="rounded-md border border-ink/10 bg-black/40 p-1.5 text-gray-300 transition hover:border-gold-ink2/40 hover:text-gold-ink2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(admin)}
                          title="Delete admin"
                          disabled={deleteLoading === admin._id}
                          className="rounded-md border border-ink/10 bg-black/40 p-1.5 text-gray-300 transition hover:border-rose-400/40 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleteLoading === admin._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </span>
                    ) : null}
                  </div>
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
