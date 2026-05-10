const mongoose = require("mongoose");
const { isSuperAdmin } = require("./admin-roles");

// AdminLog category → permission required to view it. Categories not in
// this map (auth, system, admin) are super-admin-only because they reflect
// admin-team activity, not domain operations.
const CATEGORY_TO_PERMISSION = Object.freeze({
  product: "products",
  order: "orders",
  payment: "verifyPayments",
  user: "users",
  drop: "drops",
  notification: "notifications",
  review: "manageReviews",
});

const SUPER_ONLY_CATEGORIES = Object.freeze(["auth", "system", "admin"]);
const ALL_CATEGORIES = Object.freeze([
  ...Object.keys(CATEGORY_TO_PERMISSION),
  ...SUPER_ONLY_CATEGORIES,
]);

/**
 * Returns the array of AdminLog categories the user is allowed to see.
 * `null` means unrestricted (super-admin or full admin).
 *
 * - super_admin / superadmin → null (sees everything)
 * - admin → null (full admins have all flags ON by default)
 * - sub_admin → only categories whose required permission is held
 */
const buildVisibleCategoriesForUser = (user) => {
  const role = String(user?.role || "").toLowerCase();
  if (isSuperAdmin(role)) return null;
  if (role === "admin") return null;

  const perms = user?.permissions || {};
  const visible = Object.entries(CATEGORY_TO_PERMISSION)
    .filter(([, perm]) => Boolean(perms[perm]))
    .map(([category]) => category);

  return visible;
};

/**
 * Compose the Mongo filter for the activity-log endpoint, honouring both
 * the caller's permissions AND the requested query filters. Privilege
 * escalation guards: non-super admins cannot filter by adminId (silently
 * ignored), and an empty visibleCategories list short-circuits to "no
 * results" (returns a filter that matches nothing).
 */
const buildLogFilter = ({ user, query = {} }) => {
  const filter = {};

  const visible = buildVisibleCategoriesForUser(user);

  // Sub-admin with no permissions → render zero rows rather than 403.
  if (Array.isArray(visible) && visible.length === 0) {
    return { _id: null };
  }

  // Category: client-supplied must intersect with visible categories.
  if (query.category && ALL_CATEGORIES.includes(query.category)) {
    if (visible && !visible.includes(query.category)) {
      return { _id: null };
    }
    filter.category = query.category;
  } else if (visible) {
    filter.category = { $in: visible };
  }

  // Date range — both ends optional.
  if (query.from || query.to) {
    filter.createdAt = {};
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from && !Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
    if (to && !Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }

  // HTTP method.
  if (query.method) {
    const methods = String(query.method)
      .split(",")
      .map((m) => m.trim().toUpperCase())
      .filter(Boolean);
    if (methods.length === 1) filter.method = methods[0];
    else if (methods.length > 1) filter.method = { $in: methods };
  }

  // adminId filter — super-admin only. Silently ignored for other roles.
  if (query.adminId && isSuperAdmin(user?.role) && mongoose.Types.ObjectId.isValid(query.adminId)) {
    filter.adminId = query.adminId;
  }

  // Free-text search on action + route.
  if (query.q) {
    const trimmed = String(query.q).trim();
    if (trimmed.length > 0) {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ action: regex }, { route: regex }];
    }
  }

  return filter;
};

module.exports = {
  CATEGORY_TO_PERMISSION,
  SUPER_ONLY_CATEGORIES,
  ALL_CATEGORIES,
  buildVisibleCategoriesForUser,
  buildLogFilter,
};
