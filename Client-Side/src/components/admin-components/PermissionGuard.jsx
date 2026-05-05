import React from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ShieldOff } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * PermissionGuard — wraps admin pages that require specific permissions.
 *
 * Usage:
 *   <PermissionGuard permission="products">
 *     <AdminProduct />
 *   </PermissionGuard>
 *
 *   <PermissionGuard superAdminOnly>
 *     <SuperAdminDashboard />
 *   </PermissionGuard>
 *
 * Super admins bypass all permission checks.
 * Full admins have all permissions ON by default.
 * Sub-admins are checked against their individual permission flags.
 */
const PermissionGuard = ({ permission, superAdminOnly = false, children }) => {
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin =
    user?.role === "super_admin" || user?.role === "superadmin";

  // Super admins bypass everything
  if (isSuperAdmin) return <>{children}</>;

  // If this page is super-admin only and the user is NOT super admin → block
  if (superAdminOnly) {
    return <AccessDenied reason="This section is restricted to the Super Admin." />;
  }

  // If no specific permission is required, allow all admin roles
  if (!permission) return <>{children}</>;

  // Check the user's permission flag
  const userPerms = user?.permissions || {};
  if (userPerms[permission]) return <>{children}</>;

  // Permission denied
  return (
    <AccessDenied
      reason={`You do not have the "${formatPermission(permission)}" permission required to access this section.`}
    />
  );
};

const formatPermission = (key) =>
  String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

const AccessDenied = ({ reason }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex min-h-[60vh] items-center justify-center p-6"
  >
    <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
        <ShieldOff className="h-8 w-8 text-rose-400" />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-white">Access Restricted</h2>

      <p className="mt-4 text-sm leading-7 text-gray-400">{reason}</p>

      <p className="mt-2 text-xs text-gray-500">
        Contact the Super Admin to request access to this feature.
      </p>

      <Link
        to="/admin/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-6 py-3 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
      >
        ← Return to Dashboard
      </Link>
    </div>
  </motion.div>
);

export default PermissionGuard;
