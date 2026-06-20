import React, { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars -- motion JSX
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateAdminRole,
  updateAdminPermissions,
  resetAdminPassword,
  fetchAdmins,
} from "@/store/admin/super-admin-slice";
import {
  modalBackdropVariants,
  modalCardVariants,
} from "@/components/admin-components/_shared/animations";
import { PrimaryButton, SecondaryButton } from "@/components/admin-components/_shared/Buttons";
import { useToast } from "@/hooks/use-toast";

const PERMISSIONS = [
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "notifications", label: "Notifications" },
  { key: "drops", label: "Drops" },
  { key: "verifyPayments", label: "Verify Payments" },
  { key: "manageReviews", label: "Reviews" },
  { key: "viewAnalytics", label: "Analytics" },
  { key: "sendCampaigns", label: "Campaigns" },
  { key: "manageInventory", label: "Inventory" },
  { key: "manageAdmins", label: "Admin Management" },
];

const SUB_ROLES = [
  {
    value: "order_manager",
    label: "Order Manager",
    description: "Orders and payment verification",
  },
  {
    value: "product_manager",
    label: "Product Manager",
    description: "Products, drops, and stock",
  },
  {
    value: "marketing_manager",
    label: "Marketing Manager",
    description: "Notifications, analytics, and campaigns",
  },
  {
    value: "support_admin",
    label: "Customer Support",
    description: "Orders, customers, and reviews",
  },
  {
    value: "inventory_manager",
    label: "Inventory Manager",
    description: "Product stock control",
  },
];

const buildPermissionsFromAdmin = (admin) => {
  const base = PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {});
  if (!admin?.permissions) return base;
  return { ...base, ...admin.permissions };
};

const EditAdminModal = ({ admin, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { editLoading, resetLoading } = useSelector((state) => state.superAdmin);

  const [role, setRole] = useState("admin");
  const [subRole, setSubRole] = useState("");
  const [permissions, setPermissions] = useState({});
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset all local state when admin changes (or modal closes).
  useEffect(() => {
    if (admin) {
      setRole(admin.role === "sub_admin" ? "sub_admin" : "admin");
      setSubRole(admin.subRole || "");
      setPermissions(buildPermissionsFromAdmin(admin));
      setTempPassword(null);
      setResetConfirmOpen(false);
      setCopied(false);
    }
  }, [admin]);

  const isResettingThisAdmin = resetLoading === admin?._id;

  // Detect dirty state — only enable Save if something actually changed.
  const dirty = useMemo(() => {
    if (!admin) return false;
    if ((admin.role === "sub_admin" ? "sub_admin" : "admin") !== role) return true;
    if ((admin.subRole || "") !== subRole) return true;
    const original = buildPermissionsFromAdmin(admin);
    return PERMISSIONS.some((p) => !!original[p.key] !== !!permissions[p.key]);
  }, [admin, role, subRole, permissions]);

  const togglePermission = (key) => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  };

  const applySubRolePreset = (value) => {
    const preset = SUB_ROLES.find((s) => s.value === value);
    setSubRole(value);
    if (!preset) return;
    // Lay the preset over current permissions so the admin can fine-tune.
    const next = PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {});
    Object.entries(preset.permissions || {}).forEach(([k, v]) => {
      next[k] = v;
    });
    setPermissions(next);
  };

  const handleSave = async () => {
    if (!admin || !dirty) return;
    try {
      const original = admin;
      const roleChanged =
        (original.role === "sub_admin" ? "sub_admin" : "admin") !== role ||
        (original.subRole || "") !== subRole;
      const permissionsChanged = PERMISSIONS.some(
        (p) => !!(original.permissions || {})[p.key] !== !!permissions[p.key]
      );

      if (roleChanged) {
        await dispatch(
          updateAdminRole({
            adminId: admin._id,
            role,
            subRole: role === "sub_admin" ? subRole : null,
          })
        ).unwrap();
      }

      if (permissionsChanged) {
        await dispatch(
          updateAdminPermissions({ adminId: admin._id, permissions })
        ).unwrap();
      }

      toast({
        title: "Admin updated",
        description: `${admin.email} saved successfully.`,
        variant: "success",
      });
      // Refetch so the table reflects the latest action counts and any
      // server-side normalization of the permissions object.
      dispatch(fetchAdmins());
      onClose?.();
    } catch (err) {
      toast({
        title: "Could not save",
        description: typeof err === "string" ? err : err?.message || "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!admin) return;
    try {
      const result = await dispatch(resetAdminPassword(admin._id)).unwrap();
      setTempPassword(result?.temporaryPassword || null);
      setResetConfirmOpen(false);
      setCopied(false);
      if (!result?.temporaryPassword) {
        toast({
          title: "Password reset",
          description: "A new temporary password was generated but the server did not return it.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Password reset",
        description: "Share the temp password through a secure channel.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Reset failed",
        description: typeof err === "string" ? err : err?.message || "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard denied — user can still read + copy manually */
    }
  };

  if (!admin) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0b0b] shadow-[0_30px_120px_rgba(0,0,0,0.6)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]">
                  Edit admin
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">{admin.name || admin.email}</h2>
                <p className="mt-0.5 break-all font-mono text-[11px] text-gray-500">
                  {admin.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 p-2 text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                aria-label="Close edit modal"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {/* ROLE */}
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-400">
                  Role
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "admin", label: "Full Admin" },
                    { value: "sub_admin", label: "Sub Admin" },
                  ].map((r) => {
                    const active = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          setRole(r.value);
                          if (r.value === "admin") setSubRole("");
                        }}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                            : "border-white/10 bg-black/40 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SUB ROLE */}
              {role === "sub_admin" ? (
                <div className="mt-5 space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-400">
                    Sub-role preset
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SUB_ROLES.map((sr) => {
                      const active = subRole === sr.value;
                      return (
                        <button
                          key={sr.value}
                          type="button"
                          onClick={() => applySubRolePreset(sr.value)}
                          className={`rounded-xl border p-3 text-left transition ${
                            active
                              ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                              : "border-white/10 bg-black/40 hover:border-white/20"
                          }`}
                        >
                          <p
                            className={`text-sm font-semibold ${
                              active ? "text-[#D4AF37]" : "text-white"
                            }`}
                          >
                            {sr.label}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">{sr.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Tapping a preset overrides current permissions. Fine-tune per-permission below.
                  </p>
                </div>
              ) : null}

              {/* PERMISSIONS */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-400">
                    Permissions
                  </p>
                  <span className="font-mono text-[10px] text-gray-500">
                    {PERMISSIONS.filter((p) => permissions[p.key]).length} of {PERMISSIONS.length} active
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((perm) => {
                    const active = !!permissions[perm.key];
                    return (
                      <button
                        key={perm.key}
                        type="button"
                        onClick={() => togglePermission(perm.key)}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                          active
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                            : "border-white/10 bg-black/40 text-gray-300 hover:border-white/20"
                        }`}
                      >
                        <span className="font-medium">{perm.label}</span>
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            active
                              ? "border-emerald-300 bg-emerald-300/20"
                              : "border-white/20 bg-black/40"
                          }`}
                        >
                          {active ? <Check className="h-3 w-3 text-emerald-200" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PASSWORD RESET */}
              <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                      <KeyRound className="h-4 w-4" /> Reset password
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-gray-400">
                      Generates a new temporary password. The admin will be forced to change it on
                      next login.
                    </p>
                  </div>
                  {tempPassword ? null : (
                    <SecondaryButton
                      type="button"
                      onClick={() => setResetConfirmOpen(true)}
                      disabled={isResettingThisAdmin}
                      className="shrink-0"
                    >
                      {isResettingThisAdmin ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Reset"
                      )}
                    </SecondaryButton>
                  )}
                </div>

                {resetConfirmOpen && !tempPassword ? (
                  <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3">
                    <p className="flex items-center gap-2 text-xs text-rose-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      The current password will stop working immediately. Continue?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={isResettingThisAdmin}
                        className="rounded-full bg-rose-400 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-rose-300 disabled:opacity-50"
                      >
                        {isResettingThisAdmin ? "Resetting…" : "Yes, reset"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetConfirmOpen(false)}
                        disabled={isResettingThisAdmin}
                        className="rounded-full border border-white/20 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-300 hover:border-white/40"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {tempPassword ? (
                  <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> One-time temporary password
                    </p>
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-black/60 p-2">
                      <code className="flex-1 break-all font-mono text-sm text-emerald-200 select-all">
                        {tempPassword}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400/20"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-amber-200">
                      Save this now — closing the modal will discard it. Send it to the admin via a
                      secure channel.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <SecondaryButton type="button" onClick={onClose} disabled={editLoading}>
                Close
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={handleSave}
                disabled={!dirty || editLoading}
                className="inline-flex items-center gap-2"
              >
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </PrimaryButton>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default EditAdminModal;
