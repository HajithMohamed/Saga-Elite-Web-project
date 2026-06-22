/**
 * Centralised admin role helpers & permission definitions.
 *
 * Every file that needs to decide "is this user an admin?" or check
 * permissions should import from here so the definitions are maintained
 * in exactly one place.
 */

// ── Role Constants ──────────────────────────────────────────────────
const ADMIN_ROLES = Object.freeze(["admin", "super_admin", "superadmin", "sub_admin"]);
const SUPER_ADMIN_ROLES = Object.freeze(["super_admin", "superadmin"]);
const CUSTOMER_ACCOUNT_ROLES = Object.freeze(["user", "customer"]);

// ── Permission Keys ─────────────────────────────────────────────────
const PERMISSION_KEYS = Object.freeze([
  "products",
  "orders",
  "users",
  "notifications",
  "drops",
  "verifyPayments",
  "manageReviews",
  "viewAnalytics",
  "sendCampaigns",
  "manageInventory",
  "manageAdmins",
]);

// ── Sub-Role Definitions ────────────────────────────────────────────
const SUB_ROLES = Object.freeze([
  "order_manager",
  "product_manager",
  "marketing_manager",
  "support_admin",
  "inventory_manager",
]);

const SUB_ROLE_LABELS = Object.freeze({
  order_manager: "Order Manager",
  product_manager: "Product Manager",
  marketing_manager: "Marketing Manager",
  support_admin: "Customer Support",
  inventory_manager: "Inventory Manager",
});

/**
 * Default permission presets for each sub-role.
 * When a super admin picks a sub-role, the UI pre-fills these.
 */
const SUB_ROLE_PERMISSION_PRESETS = Object.freeze({
  order_manager: {
    products: false, orders: true, users: false, notifications: false,
    drops: false, verifyPayments: true, manageReviews: false,
    viewAnalytics: false, sendCampaigns: false, manageInventory: false, manageAdmins: false,
  },
  product_manager: {
    products: true, orders: false, users: false, notifications: false,
    drops: true, verifyPayments: false, manageReviews: false,
    viewAnalytics: false, sendCampaigns: false, manageInventory: true, manageAdmins: false,
  },
  marketing_manager: {
    products: false, orders: false, users: false, notifications: true,
    drops: false, verifyPayments: false, manageReviews: false,
    viewAnalytics: true, sendCampaigns: true, manageInventory: false, manageAdmins: false,
  },
  support_admin: {
    products: false, orders: true, users: true, notifications: false,
    drops: false, verifyPayments: false, manageReviews: true,
    viewAnalytics: false, sendCampaigns: false, manageInventory: false, manageAdmins: false,
  },
  inventory_manager: {
    products: true, orders: false, users: false, notifications: false,
    drops: false, verifyPayments: false, manageReviews: false,
    viewAnalytics: false, sendCampaigns: false, manageInventory: true, manageAdmins: false,
  },
});

// ── Helper Functions ────────────────────────────────────────────────

/** @returns {boolean} true if role is any admin type (admin, super_admin, sub_admin) */
const isAdminRole = (role) => ADMIN_ROLES.includes(String(role || "").toLowerCase());

/** @returns {boolean} true if role is super_admin / superadmin */
const isSuperAdmin = (role) => SUPER_ADMIN_ROLES.includes(String(role || "").toLowerCase());

/** @returns {boolean} true if role is a customer-facing account */
const isCustomerRole = (role) =>
  CUSTOMER_ACCOUNT_ROLES.includes(String(role || "").toLowerCase());

/** Build a permissions object with all keys set to the given default */
const buildDefaultPermissions = (defaultValue = false) => {
  const perms = {};
  PERMISSION_KEYS.forEach((key) => { perms[key] = defaultValue; });
  return perms;
};

/** Full admin gets all permissions */
const FULL_ADMIN_PERMISSIONS = Object.freeze(buildDefaultPermissions(true));

module.exports = {
  ADMIN_ROLES,
  SUPER_ADMIN_ROLES,
  CUSTOMER_ACCOUNT_ROLES,
  PERMISSION_KEYS,
  SUB_ROLES,
  SUB_ROLE_LABELS,
  SUB_ROLE_PERMISSION_PRESETS,
  FULL_ADMIN_PERMISSIONS,
  isAdminRole,
  isSuperAdmin,
  isCustomerRole,
  buildDefaultPermissions,
};
