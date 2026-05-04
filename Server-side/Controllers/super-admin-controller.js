const User = require("../Models/User");
const AdminLog = require("../Models/AdminLog");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

// Creates a new regular admin account
exports.createAdmin = catchAsync(async (req, res, next) => {
  const { email, password, permissions } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide an email and password", 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("An account with this email already exists", 400));
  }

  // Default permissions if not provided
  const defaultPermissions = {
    products: true,
    orders: true,
    users: false,
    notifications: false,
    drops: false,
  };

  const adminPermissions = permissions ? { ...defaultPermissions, ...permissions } : defaultPermissions;

  // Automatically mark as verified because a super admin created it
  const newAdmin = await User.create({
    email,
    password,
    role: "admin",
    permissions: adminPermissions,
    isVerified: true,
    isActive: true,
  });

  // Manually attach resource info for the auto-logger to pick up
  req.adminAction = `Created admin ${email}`;
  req.adminResourceId = newAdmin._id;

  res.status(201).json({
    status: "success",
    data: {
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        isActive: newAdmin.isActive
      },
    },
  });
});

// Updates permissions for an existing admin
exports.updateAdminPermissions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!permissions || typeof permissions !== 'object') {
    return next(new AppError("Please provide permissions object", 400));
  }

  const adminToUpdate = await User.findById(id);

  if (!adminToUpdate) {
    return next(new AppError("No admin found with that ID", 404));
  }

  if (!["admin"].includes(adminToUpdate.role)) {
    return next(new AppError("Can only update permissions for regular admin accounts.", 403));
  }

  // Update permissions
  adminToUpdate.permissions = { ...adminToUpdate.permissions, ...permissions };
  await adminToUpdate.save({ validateBeforeSave: false });

  req.adminAction = `Updated permissions for admin ${adminToUpdate.email}`;
  req.adminResourceId = adminToUpdate._id;

  res.status(200).json({
    status: "success",
    data: {
      admin: {
        id: adminToUpdate._id,
        email: adminToUpdate.email,
        role: adminToUpdate.role,
        permissions: adminToUpdate.permissions,
        isActive: adminToUpdate.isActive
      },
    },
  });
});

// Lists all admins and super_admins
exports.listAdmins = catchAsync(async (req, res, next) => {
  const admins = await User.find({
    role: { $in: ["admin", "super_admin", "superadmin"] }
  }).select('email role permissions isActive createdAt updatedAt');

  res.status(200).json({
    status: "success",
    results: admins.length,
    data: {
      admins,
    },
  });
});

// Get admin logs
exports.getActivityLogs = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const logs = await AdminLog.find()
    .populate("adminId", "email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalLogs = await AdminLog.countDocuments();

  res.status(200).json({
    status: "success",
    results: logs.length,
    pagination: {
      total: totalLogs,
      page,
      pages: Math.ceil(totalLogs / limit),
      limit,
    },
    data: {
      logs,
    },
  });
});

// Get system stats
exports.getSystemStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'super_admin', 'superadmin'] } });
  const totalProducts = await require('../Models/Product').countDocuments();
  const totalOrders = await require('../Models/Order').countDocuments();

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        totalUsers,
        totalAdmins,
        totalProducts,
        totalOrders,
      },
    },
  });
});

// Deactivates/reactivates an existing admin
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

  // Prevent superadmins from targeting themselves or other superadmins via this route
  if (["super_admin", "superadmin"].includes(adminToUpdate.role)) {
    return next(new AppError("Cannot modify another super admin account.", 403));
  }

  // Change status
  adminToUpdate.isActive = desiredIsActive;
  await adminToUpdate.save({ validateBeforeSave: false });

  req.adminAction = `${desiredIsActive ? 'Reactivated' : 'Deactivated'} admin ${adminToUpdate.email}`;
  req.adminResourceId = adminToUpdate._id;

  res.status(200).json({
    status: "success",
    data: {
      admin: adminToUpdate,
    },
  });
});

// Lists all admins and super_admins with aggregation of their logs
exports.listAdmins = catchAsync(async (req, res, next) => {
  const admins = await User.aggregate([
    // Only find admins and superadmins
    {
      $match: {
        role: { $in: ["admin", "super_admin", "superadmin"] },
      },
    },
    // Left outer join on the AdminLog collection
    {
      $lookup: {
        from: "adminlogs",
        localField: "_id",
        foreignField: "adminId",
        as: "logs",
      },
    },
    // Extract metadata
    {
      $project: {
        _id: 1,
        email: 1,
        role: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        actionCount: { $size: "$logs" },
        lastActiveAt: {
          $max: "$logs.createdAt", // find the most recent log date
        },
      },
    },
    { $sort: { role: -1, createdAt: 1 } },
  ]);

  res.status(200).json({
    status: "success",
    results: admins.length,
    data: {
      admins,
    },
  });
});

// Global paginated log of all admin actions
exports.getActivityLogs = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  // Filter conditionally by a specific admin if requested
  const filter = {};
  if (req.query.adminId) {
    filter.adminId = req.query.adminId;
  }

  const logs = await AdminLog.find(filter)
    .populate("adminId", "email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalLogs = await AdminLog.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: logs.length,
    pagination: {
      total: totalLogs,
      page,
      pages: Math.ceil(totalLogs / limit),
      limit,
    },
    data: {
      logs,
    },
  });
});
