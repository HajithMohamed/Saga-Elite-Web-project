import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, KeyRound, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createAdmin, clearCreateStatus } from "../../store/admin/super-admin-slice";
import {
  modalBackdropVariants,
  modalCardVariants,
  toastFlashVariants,
} from "@/components/admin-components/_shared/animations";
import { PrimaryButton, SecondaryButton } from "@/components/admin-components/_shared/Buttons";

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

const ROLE_PRESETS = {
  fulfillment_manager: {
    label: "Fulfillment Manager",
    description: "Can process orders and verify bank payments. Cannot touch content.",
    subRole: "order_manager",
    permissions: {
      orders: true,
      verifyPayments: true,
      manageInventory: true,
      products: false,
      users: false,
      notifications: false,
      drops: false,
      manageReviews: false,
      viewAnalytics: false,
      sendCampaigns: false,
      manageAdmins: false,
    },
  },
  content_manager: {
    label: "Content Manager",
    description: "Can manage drops, products, and moderate reviews. No payment access.",
    subRole: "product_manager",
    permissions: {
      products: true,
      drops: true,
      manageReviews: true,
      sendCampaigns: true,
      notifications: true,
      viewAnalytics: true,
      orders: false,
      users: false,
      verifyPayments: false,
      manageInventory: false,
      manageAdmins: false,
    },
  },
  customer_support: {
    label: "Customer Support",
    description: "Can see orders and user info to answer customer queries.",
    subRole: "support_admin",
    permissions: {
      users: true,
      orders: true,
      products: false,
      drops: false,
      notifications: false,
      verifyPayments: false,
      manageReviews: false,
      viewAnalytics: false,
      sendCampaigns: false,
      manageInventory: false,
      manageAdmins: false,
    },
  },
};

const ROLE_PRESET_ENTRIES = Object.entries(ROLE_PRESETS);

const SUB_ROLES = [
  {
    value: "order_manager",
    label: "Order Manager",
    description: "Orders and payment verification",
    permissions: { orders: true, verifyPayments: true },
  },
  {
    value: "product_manager",
    label: "Product Manager",
    description: "Products, drops, and stock",
    permissions: { products: true, drops: true, manageInventory: true },
  },
  {
    value: "marketing_manager",
    label: "Marketing Manager",
    description: "Notifications, analytics, and campaigns",
    permissions: { notifications: true, viewAnalytics: true, sendCampaigns: true },
  },
  {
    value: "support_admin",
    label: "Customer Support",
    description: "Orders, customers, and reviews",
    permissions: { orders: true, users: true, manageReviews: true },
  },
  {
    value: "inventory_manager",
    label: "Inventory Manager",
    description: "Product stock control",
    permissions: { products: true, manageInventory: true },
  },
];

const allPermissions = () =>
  PERMISSIONS.reduce((acc, permission) => {
    acc[permission.key] = true;
    return acc;
  }, {});

const blankPermissions = () =>
  PERMISSIONS.reduce((acc, permission) => {
    acc[permission.key] = false;
    return acc;
  }, {});

const presetPermissions = (subRole) => ({
  ...blankPermissions(),
  ...(SUB_ROLES.find((role) => role.value === subRole)?.permissions || {}),
});

const INITIAL = {
  name: "",
  email: "",
  role: "admin",
  subRole: "order_manager",
  password: "",
  autoPassword: true,
  permissions: allPermissions(),
};

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const CreateAdminModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { createLoading, createError, createSuccess, lastCreatedMailSent } = useSelector(
    (s) => s.superAdmin
  );
  const [form, setForm] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [activePreset, setActivePreset] = useState(null);

  useEffect(() => {
    if (createSuccess) {
      const t = setTimeout(() => {
        dispatch(clearCreateStatus());
        onClose();
        setForm(INITIAL);
        setTouched({});
        setActivePreset(null);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [createSuccess, dispatch, onClose]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearCreateStatus());
      setTouched({});
      setActivePreset(null);
    }
  }, [isOpen, dispatch]);

  const selectedSubRole = useMemo(
    () => SUB_ROLES.find((role) => role.value === form.subRole),
    [form.subRole]
  );

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Valid email required";
    if (!["admin", "sub_admin"].includes(form.role)) errs.role = "Select an admin role";
    if (form.role === "sub_admin" && !form.subRole) errs.subRole = "Select a sub-admin role";
    if (!form.autoPassword && !passwordPattern.test(form.password)) {
      errs.password = "Use uppercase, lowercase, number, special character, and 8+ characters";
    }
    if (!Object.values(form.permissions).some(Boolean)) {
      errs.permissions = "Select at least one permission";
    }
    return errs;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const inputClass = (name) =>
    `w-full rounded-xl border bg-black/70 px-3 py-2.5 text-sm text-white outline-none transition-colors ${
      touched[name] && errors[name]
        ? "border-red-500/60 focus:border-red-500"
        : "border-white/10 focus:border-[#D4AF37]"
    }`;

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setForm((prev) => ({
      ...prev,
      role,
      permissions: role === "admin" ? allPermissions() : presetPermissions(prev.subRole),
    }));
    setActivePreset(null);
  };

  const handleSubRoleChange = (e) => {
    const subRole = e.target.value;
    setForm((prev) => ({
      ...prev,
      subRole,
      permissions: presetPermissions(subRole),
    }));
    setActivePreset(null);
  };

  const handlePermissionToggle = (key) => {
    setActivePreset(null);
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleBlur = (e) => setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const applyRolePreset = (presetKey) => {
    const preset = ROLE_PRESETS[presetKey];
    if (!preset) return;

    setActivePreset(presetKey);
    setForm((prev) => ({
      ...prev,
      role: "sub_admin",
      subRole: preset.subRole,
      permissions: { ...blankPermissions(), ...preset.permissions },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      role: true,
      subRole: true,
      password: true,
      permissions: true,
    });

    if (!isValid) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      permissions: form.permissions,
    };

    if (form.role === "sub_admin") payload.subRole = form.subRole;
    if (!form.autoPassword) payload.password = form.password;

    dispatch(createAdmin(payload));
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="create-admin-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            key="create-admin-card"
            className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-2xl"
            variants={modalCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.22em]">Super Admin</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-white">Create admin access</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Select a role, verify permissions, and send login credentials by email.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-96px)] overflow-y-auto">
              <AnimatePresence>
                {createSuccess ? (
                  <motion.div
                    key="success"
                    variants={toastFlashVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mx-6 mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-200"
                  >
                    <Check className="h-4 w-4" />
                    Admin created{lastCreatedMailSent ? " and login email sent." : ", but email delivery failed."}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {createError ? (
                  <motion.div
                    key="err"
                    variants={toastFlashVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mx-6 mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
                  >
                    {createError}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Full name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleTextChange}
                      onBlur={handleBlur}
                      placeholder="Admin full name"
                      className={inputClass("name")}
                    />
                    {touched.name && errors.name ? (
                      <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Email address</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleTextChange}
                        onBlur={handleBlur}
                        placeholder="admin@sagaelite.lk"
                        className={`${inputClass("email")} pl-10`}
                      />
                    </div>
                    {touched.email && errors.email ? (
                      <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Admin role</label>
                    <div className="relative">
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleRoleChange}
                        onBlur={handleBlur}
                        className={`${inputClass("role")} appearance-none pr-10`}
                      >
                        <option value="admin">Full Admin</option>
                        <option value="sub_admin">Sub Admin</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Sub-admin role</label>
                    <div className="relative">
                      <select
                        name="subRole"
                        value={form.subRole}
                        onChange={handleSubRoleChange}
                        onBlur={handleBlur}
                        disabled={form.role !== "sub_admin"}
                        className={`${inputClass("subRole")} appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-45`}
                      >
                        {SUB_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    </div>
                    {form.role === "sub_admin" && selectedSubRole ? (
                      <p className="mt-1 text-xs text-gray-500">{selectedSubRole.description}</p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Temporary password</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Auto-generated passwords are emailed to the new admin.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.autoPassword}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            autoPassword: e.target.checked,
                            password: e.target.checked ? "" : prev.password,
                          }))
                        }
                        className="h-4 w-4 accent-[#D4AF37]"
                      />
                      Auto generate
                    </label>
                  </div>

                  {!form.autoPassword ? (
                    <div className="mt-3">
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={handleTextChange}
                          onBlur={handleBlur}
                          placeholder="Strong temporary password"
                          className={`${inputClass("password")} pl-10`}
                        />
                      </div>
                      {touched.password && errors.password ? (
                        <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Quick role presets</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Pick a starting profile, then fine-tune the permissions below.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {ROLE_PRESET_ENTRIES.map(([presetKey, preset]) => {
                      const isActive = activePreset === presetKey;
                      return (
                        <button
                          key={presetKey}
                          type="button"
                          onClick={() => applyRolePreset(presetKey)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                            isActive
                              ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-white shadow-[0_0_24px_rgba(212,175,55,0.12)]"
                              : "border-white/10 bg-black/30 text-gray-300 hover:border-[#D4AF37]/30 hover:bg-black/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{preset.label}</p>
                              <p className="mt-1 text-xs text-gray-500">{preset.description}</p>
                            </div>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]">
                              Preset
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Permission verification</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Full admins receive all permissions. Sub-admins start from the role preset.
                      </p>
                    </div>
                    {touched.permissions && errors.permissions ? (
                      <p className="text-xs text-red-400">{errors.permissions}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {PERMISSIONS.map((permission) => {
                      const checked = Boolean(form.permissions[permission.key]);
                      return (
                        <label
                          key={permission.key}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                            checked
                              ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-white"
                              : "border-white/10 bg-black/30 text-gray-400 hover:border-white/20"
                          }`}
                        >
                          <span>{permission.label}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handlePermissionToggle(permission.key)}
                            className="h-4 w-4 accent-[#D4AF37]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <SecondaryButton
                    type="button"
                    onClick={onClose}
                    className="justify-center rounded-xl px-5 py-2.5"
                  >
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton
                    type="submit"
                    disabled={createLoading || createSuccess}
                    className="justify-center rounded-xl px-5 py-2.5"
                  >
                    {createLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating
                      </span>
                    ) : (
                      "Create and email access"
                    )}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default CreateAdminModal;
