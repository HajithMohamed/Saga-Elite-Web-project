const User = require("../Models/User");
const AdminLog = require("../Models/AdminLog");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const {
  ADMIN_ROLES,
  isSuperAdmin,
  SUB_ROLE_LABELS,
  SUB_ROLE_PERMISSION_PRESETS,
  FULL_ADMIN_PERMISSIONS,
  buildDefaultPermissions,
} = require("../Utils/admin-roles");

// ── Create Admin or Sub-Admin ───────────────────────────────────────
exports.createAdmin = catchAsync(async (req, res, next) => {
  const { email, password, name, role = "admin", subRole, permissions } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide an email and password", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("An account with this email already exists", 400));
  }

  // Resolve permissions based on role type
  let finalPermissions;
  if (role === "admin") {
    // Full admin gets all permissions by default
    finalPermissions = permissions
      ? { ...FULL_ADMIN_PERMISSIONS, ...permissions }
      : { ...FULL_ADMIN_PERMISSIONS };
  } else if (role === "sub_admin") {
    if (!subRole) {
      return next(new AppError("subRole is required when creating a sub_admin", 400));
    }
    // Start with preset, then overlay any explicit overrides
    const preset = SUB_ROLE_PERMISSION_PRESETS[subRole] || buildDefaultPermissions(false);
    finalPermissions = permissions
      ? { ...preset, ...permissions }
      : { ...preset };
  } else {
    finalPermissions = buildDefaultPermissions(false);
  }

  const newAdmin = await User.create({
    email,
    password,
    name: name || undefined,
    role,
    subRole: role === "sub_admin" ? subRole : null,
    permissions: finalPermissions,
    createdBy: req.userInfo._id,
    isVerified: true,
    isActive: true,
  });

  req.adminAction = `Created ${role === "sub_admin" ? `sub-admin (${SUB_ROLE_LABELS[subRole] || subRole})` : "admin"}: ${email}`;
  req.adminResourceId = newAdmin._id;
  req.adminCategory = "admin";

  res.status(201).json({
    status: "success",
    data: {
      admin: {
        _id: newAdmin._id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        subRole: newAdmin.subRole,
        permissions: newAdmin.permissions,
        isActive: newAdmin.isActive,
        createdBy: req.userInfo._id,
        createdAt: newAdmin.createdAt,
      },
    },
  });
});

// ── Update Admin Permissions ────────────────────────────────────────
exports.updateAdminPermissions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!permissions || typeof permissions !== "object") {
    return next(new AppError("Please provide permissions object", 400));
  }

  const adminToUpdate = await User.findById(id);
  if (!adminToUpdate) {
    return next(new AppError("No admin found with that ID", 404));
  }

  if (isSuperAdmin(adminToUpdate.role)) {
    return next(new AppError("Cannot modify super admin permissions.", 403));
  }

  if (!["admin", "sub_admin"].includes(adminToUpdate.role)) {
    return next(new AppError("Can only update permissions for admin or sub_admin accounts.", 403));
  }

  adminToUpdate.permissions = { ...adminToUpdate.permissions, ...permissions };
  await adminToUpdate.save({ validateBeforeSave: false });

  req.adminAction = `Updated permissions for ${adminToUpdate.email}`;
  req.adminResourceId = adminToUpdate._id;
  req.adminCategory = "admin";

  res.status(200).json({
    status: "success",
    data: {
      admin: {
        _id: adminToUpdate._id,
        email: adminToUpdate.email,
        name: adminToUpdate.name,
        role: adminToUpdate.role,
        subRole: adminToUpdate.subRole,
        permissions: adminToUpdate.permissions,
        isActive: adminToUpdate.isActive,
      },
    },
  });
});

// ── Update Admin Role / Sub-Role ────────────────────────────────────
exports.updateAdminRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, subRole } = req.body;

  const adminToUpdate = await User.findById(id);
  if (!adminToUpdate) {
    return next(new AppError("No admin found with that ID", 404));
  }

  if (isSuperAdmin(adminToUpdate.role)) {
    return next(new AppError("Cannot modify super admin role.", 403));
  }

  if (role && !["admin", "sub_admin"].includes(role)) {
    return next(new AppError("Role must be admin or sub_admin", 400));
  }

  if (role) adminToUpdate.role = role;

  if (role === "sub_admin" || (!role && adminToUpdate.role === "sub_admin")) {
    if (subRole) {
      adminToUpdate.subRole = subRole;
      // Apply preset permissions for the new sub-role
      const preset = SUB_ROLE_PERMISSION_PRESETS[subRole] || {};
      adminToUpdate.permissions = { ...adminToUpdate.permissions, ...preset };
    }
  } else {
    adminToUpdate.subRole = null;
  }

  await adminToUpdate.save({ validateBeforeSave: false });

  req.adminAction = `Changed role for ${adminToUpdate.email} to ${adminToUpdate.role}${adminToUpdate.subRole ? ` (${SUB_ROLE_LABELS[adminToUpdate.subRole]})` : ""}`;
  req.adminResourceId = adminToUpdate._id;
  req.adminCategory = "admin";

  res.status(200).json({
    status: "success",
    data: {
      admin: {
        _id: adminToUpdate._id,
        email: adminToUpdate.email,
        name: adminToUpdate.name,
        role: adminToUpdate.role,
        subRole: adminToUpdate.subRole,
        permissions: adminToUpdate.permissions,
        isActive: adminToUpdate.isActive,
      },
    },
  });
});

// ── Toggle Admin Active Status ──────────────────────────────────────
exports.toggleAdminActiveStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const desiredIsActive = typeof isActive === "string" ? isActive === "true" : isActive;

  if (typeof desiredIsActive !== "boolean") {
    return next(new AppError("Please provide isActive status (boolean)", 400));
  }

  const adminToUpdate = await User.findById(id);
  if (!adminToUpdate) {
    return next(new AppError("No admin found with that ID", 404));
  }

  if (isSuperAdmin(adminToUpdate.role)) {
    return next(new AppError("Cannot modify another super admin account.", 403));
  }

  adminToUpdate.isActive = desiredIsActive;
  await adminToUpdate.save({ validateBeforeSave: false });

  req.adminAction = `${desiredIsActive ? "Reactivated" : "Deactivated"} admin ${adminToUpdate.email}`;
  req.adminResourceId = adminToUpdate._id;
  req.adminCategory = "admin";

  res.status(200).json({
    status: "success",
    data: {
      admin: {
        _id: adminToUpdate._id,
        email: adminToUpdate.email,
        name: adminToUpdate.name,
        role: adminToUpdate.role,
        subRole: adminToUpdate.subRole,
        permissions: adminToUpdate.permissions,
        isActive: adminToUpdate.isActive,
      },
    },
  });
});

// ── List All Admins (aggregated with logs) ──────────────────────────
exports.listAdmins = catchAsync(async (req, res, next) => {
  const admins = await User.aggregate([
    {
      $match: {
        role: { $in: ["admin", "super_admin", "superadmin", "sub_admin"] },
      },
    },
    {
      $lookup: {
        from: "adminlogs",
        localField: "_id",
        foreignField: "adminId",
        as: "logs",
      },
    },
    {
      $project: {
        _id: 1,
        email: 1,
        name: 1,
        role: 1,
        subRole: 1,
        permissions: 1,
        isActive: 1,
        createdBy: 1,
        createdAt: 1,
        updatedAt: 1,
        actionCount: { $size: "$logs" },
        lastActiveAt: { $max: "$logs.createdAt" },
      },
    },
    { $sort: { role: -1, createdAt: 1 } },
  ]);

  res.status(200).json({
    status: "success",
    results: admins.length,
    data: { admins },
  });
});

// ── Get Activity Logs (paginated) ───────────────────────────────────
exports.getActivityLogs = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.adminId) filter.adminId = req.query.adminId;
  if (req.query.category) filter.category = req.query.category;

  const [logs, totalLogs] = await Promise.all([
    AdminLog.find(filter)
      .populate("adminId", "email role name subRole")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminLog.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: logs.length,
    pagination: {
      total: totalLogs,
      page,
      pages: Math.ceil(totalLogs / limit),
      limit,
    },
    data: { logs },
  });
});

// ── Get Admin-Specific Logs ─────────────────────────────────────────
exports.getAdminLogs = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const [logs, totalLogs] = await Promise.all([
    AdminLog.find({ adminId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminLog.countDocuments({ adminId: id }),
  ]);

  res.status(200).json({
    status: "success",
    results: logs.length,
    pagination: {
      total: totalLogs,
      page,
      pages: Math.ceil(totalLogs / limit),
      limit,
    },
    data: { logs },
  });
});

// ── System Stats ────────────────────────────────────────────────────
exports.getSystemStats = catchAsync(async (req, res, next) => {
  const Product = require("../Models/Product");
  const Order = require("../Models/Order");

  const [totalCustomers, adminCounts, totalProducts, totalOrders, roleDistribution] =
    await Promise.all([
      User.countDocuments({ role: { $in: ["customer", "user"] } }),
      User.countDocuments({ role: { $in: ADMIN_ROLES } }),
      Product.countDocuments(),
      Order.countDocuments(),
      User.aggregate([
        { $match: { role: { $in: ["admin", "sub_admin", "super_admin", "superadmin"] } } },
        {
          $group: {
            _id: {
              role: "$role",
              subRole: "$subRole",
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  // Format role distribution
  const roleSummary = {};
  roleDistribution.forEach(({ _id, count }) => {
    const key = _id.subRole ? `${_id.role}:${_id.subRole}` : _id.role;
    roleSummary[key] = count;
  });

  // Recent admin activity (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActivityCount = await AdminLog.countDocuments({
    createdAt: { $gte: oneDayAgo },
  });

  // Category breakdown of recent logs
  const categoryBreakdown = await AdminLog.aggregate([
    { $match: { createdAt: { $gte: oneDayAgo } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        totalCustomers,
        totalAdmins: adminCounts,
        totalProducts,
        totalOrders,
        roleSummary,
        recentActivityCount,
        categoryBreakdown,
      },
    },
  });
});
