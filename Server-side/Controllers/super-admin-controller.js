const User = require("../Models/User");
const AdminLog = require("../Models/AdminLog");
const crypto = require("crypto");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const logger = require("../Utils/logger");
const {
  ADMIN_ROLES,
  isSuperAdmin,
  SUB_ROLE_LABELS,
  SUB_ROLE_PERMISSION_PRESETS,
  FULL_ADMIN_PERMISSIONS,
  buildDefaultPermissions,
} = require("../Utils/admin-roles");

// ── Create Admin or Sub-Admin ───────────────────────────────────────
const generateTemporaryPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&";
  const all = `${upper}${lower}${digits}${special}`;
  const pick = (chars) => chars[crypto.randomInt(0, chars.length)];

  const required = [pick(upper), pick(lower), pick(digits), pick(special)];
  const rest = Array.from({ length: 10 }, () => pick(all));

  return [...required, ...rest]
    .sort(() => crypto.randomInt(0, 3) - 1)
    .join("");
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendAdminWelcomeEmail = async ({ admin, temporaryPassword, createdBy }) => {
  const roleLabel = admin.role === "sub_admin"
    ? SUB_ROLE_LABELS[admin.subRole] || admin.subRole
    : "Full Admin";

  const body = `
    <p>Hello ${escapeHtml(admin.name || admin.email)},</p>
    <p>Your Saga Elite admin account has been created by ${escapeHtml(createdBy?.email || "a super admin")}.</p>
    <div class="otp-box">
      <p style="margin:0 0 8px 0;"><strong>Admin email</strong></p>
      <p style="margin:0 0 16px 0;">${escapeHtml(admin.email)}</p>
      <p style="margin:0 0 8px 0;"><strong>Temporary password</strong></p>
      <p class="otp-code" style="font-size:20px;letter-spacing:2px;">${escapeHtml(temporaryPassword)}</p>
    </div>
    <p><strong>Assigned role:</strong> ${escapeHtml(roleLabel)}</p>
    <p>Please sign in and change this temporary password immediately.</p>
  `;

  await sendEmail({
    email: admin.email,
    subject: "Saga Elite admin access created",
    html: buildEmailTemplate("Admin Access Created", body),
    text: `Your Saga Elite admin account was created.\nEmail: ${admin.email}\nTemporary password: ${temporaryPassword}\nRole: ${roleLabel}\nPlease change this password after signing in.`,
  });
};

exports.createAdmin = catchAsync(async (req, res, next) => {
  const { email, password, name, role = "admin", subRole, permissions } = req.body;

  if (!email) {
    return next(new AppError("Please provide an email", 400));
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

  const temporaryPassword = password || generateTemporaryPassword();
  const passwordWasGenerated = !password;

  const newAdmin = await User.create({
    email,
    password: temporaryPassword,
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

  let mailError = null;
  try {
    await sendAdminWelcomeEmail({
      admin: newAdmin,
      temporaryPassword,
      createdBy: req.userInfo,
    });
  } catch (error) {
    mailError = error;
    logger.error("Admin welcome email failed", { email, error: error.message });
  }

  res.status(201).json({
    status: "success",
    message: mailError
      ? "Admin account created, but the welcome email could not be sent."
      : "Admin account created and welcome email sent.",
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
      mailSent: !mailError,
      passwordWasGenerated,
      mailError: mailError ? mailError.message : undefined,
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

// ── Delete an Admin / Sub-Admin (hard delete) ───────────────────────
// Same protective guards as the toggle: cannot self-delete, cannot delete
// another super admin. The audit middleware records who did this.
exports.deleteAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const requesterId = req.userInfo?._id?.toString();

  if (requesterId && requesterId === String(id)) {
    return next(new AppError("You cannot delete your own account.", 400));
  }

  const target = await User.findById(id);
  if (!target) {
    return next(new AppError("No admin found with that ID", 404));
  }

  if (isSuperAdmin(target.role)) {
    return next(new AppError("Cannot delete another super admin account.", 403));
  }

  if (!ADMIN_ROLES.has(target.role)) {
    return next(new AppError("Target is not an admin account.", 400));
  }

  const deletedSnapshot = {
    _id: target._id,
    email: target.email,
    name: target.name,
    role: target.role,
    subRole: target.subRole,
  };

  await User.findByIdAndDelete(id);

  req.adminAction = `Deleted admin ${target.email}`;
  req.adminResourceId = target._id;
  req.adminCategory = "admin";

  res.status(200).json({
    status: "success",
    data: { deleted: deletedSnapshot },
  });
});

// ── Reset an Admin's Password (super_admin only) ────────────────────
// Generates a one-time temporary password, sets mustChangePassword=true so
// the target admin is forced to rotate on next login. The plaintext is
// returned exactly once in the HTTP response — never stored, never logged.
exports.resetAdminPassword = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const requesterId = req.userInfo?._id?.toString();

  if (requesterId && requesterId === String(id)) {
    return next(
      new AppError(
        "You cannot reset your own password here. Use the personal account screen.",
        400
      )
    );
  }

  const target = await User.findById(id).select("+password");
  if (!target) {
    return next(new AppError("No admin found with that ID", 404));
  }

  if (isSuperAdmin(target.role)) {
    return next(new AppError("Cannot reset another super admin's password.", 403));
  }

  if (!ADMIN_ROLES.has(target.role)) {
    return next(new AppError("Target is not an admin account.", 400));
  }

  const temporaryPassword = generateTemporaryPassword();
  target.password = temporaryPassword;
  target.mustChangePassword = true;
  // Pre-save hook in User.js hashes the password.
  await target.save({ validateBeforeSave: false });

  req.adminAction = `Reset password for admin ${target.email}`;
  req.adminResourceId = target._id;
  req.adminCategory = "admin";

  res.status(200).json({
    status: "success",
    message:
      "Temporary password generated. Share it through a secure channel — it will not be shown again.",
    data: {
      adminId: target._id,
      email: target.email,
      temporaryPassword,
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
