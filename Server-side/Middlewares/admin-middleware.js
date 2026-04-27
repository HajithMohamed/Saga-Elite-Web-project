const AppError = require('../Utils/appError');
const catchAsync = require('../Utils/catchAsync');

const requireAdmin = catchAsync(async (req, res, next) => {
  if (!req.userInfo || !req.userInfo.role) {
    return next(new AppError('Authentication required', 401));
  }

  // Allow both admin and super_admin (or superadmin, depending on what currently sits in DB)
  const allowedRoles = ['admin', 'super_admin', 'superadmin'];
  if (!allowedRoles.includes(req.userInfo.role)) {
    return next(new AppError('You do not have permission to perform this action. Admin access required.', 403));
  }

  next();
});

const requireSuperAdmin = catchAsync(async (req, res, next) => {
  if (!req.userInfo || !req.userInfo.role) {
    return next(new AppError('Authentication required', 401));
  }

  const allowedRoles = ['super_admin', 'superadmin'];
  if (!allowedRoles.includes(req.userInfo.role)) {
    return next(new AppError('You do not have permission to perform this action. Super Admin access required.', 403));
  }

  next();
});

module.exports = {
  requireAdmin,
  requireSuperAdmin
};