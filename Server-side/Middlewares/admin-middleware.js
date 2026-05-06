const AppError = require('../Utils/appError');
const catchAsync = require('../Utils/catchAsync');
const { isAdminRole, isSuperAdmin } = require('../Utils/admin-roles');

/**
 * Requires any admin role (admin, super_admin, sub_admin).
 */
const requireAdmin = catchAsync(async (req, res, next) => {
  if (!req.userInfo || !req.userInfo.role) {
    return next(new AppError('Authentication required', 401));
  }

  if (!isAdminRole(req.userInfo.role)) {
    return next(new AppError('You do not have permission to perform this action. Admin access required.', 403));
  }

  next();
});

/**
 * Requires super_admin or superadmin role specifically.
 */
const requireSuperAdmin = catchAsync(async (req, res, next) => {
  if (!req.userInfo || !req.userInfo.role) {
    return next(new AppError('Authentication required', 401));
  }

  if (!isSuperAdmin(req.userInfo.role)) {
    return next(new AppError('You do not have permission to perform this action. Super Admin access required.', 403));
  }

  next();
});

/**
 * Requires one or more specific permissions.
 * Super admins bypass all permission checks.
 * Accepts multiple permission keys — ALL must be true.
 *
 * Usage:
 *   requirePermission("orders")
 *   requirePermission("orders", "verifyPayments")
 */
const requirePermission = (...permissions) => catchAsync(async (req, res, next) => {
  if (!req.userInfo || !req.userInfo.role) {
    return next(new AppError('Authentication required', 401));
  }

  // Super admins bypass all permission checks
  if (isSuperAdmin(req.userInfo.role)) {
    return next();
  }

  // Must be an admin-level role
  if (!isAdminRole(req.userInfo.role)) {
    return next(new AppError('Admin access required.', 403));
  }

  // Check each required permission
  const userPerms = req.userInfo.permissions || {};
  const missing = permissions.filter((p) => !userPerms[p]);

  if (missing.length > 0) {
    return next(new AppError(`You do not have the required permissions: ${missing.join(', ')}.`, 403));
  }

  next();
});

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
};