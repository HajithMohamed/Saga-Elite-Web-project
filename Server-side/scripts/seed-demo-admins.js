const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
dotenv.config({ path: path.join(__dirname, "../../.env") });

const User = require("../Models/User");
const {
  FULL_ADMIN_PERMISSIONS,
  SUB_ROLE_PERMISSION_PRESETS,
  buildDefaultPermissions,
} = require("../Utils/admin-roles");

const DEMO_ADMINS = [
  {
    name: "Saga Super Admin",
    email: "superadmin@sagaelite.com",
    password: "SuperSecret123!",
    role: "super_admin",
    permissions: FULL_ADMIN_PERMISSIONS,
  },
  {
    name: "Saga Operations Admin",
    email: "admin@sagaelite.com",
    password: "AdminSecret123!",
    role: "admin",
    permissions: FULL_ADMIN_PERMISSIONS,
  },
  {
    name: "Order Manager Demo",
    email: "orders.admin@sagaelite.com",
    password: "OrderAdmin123!",
    role: "sub_admin",
    subRole: "order_manager",
    permissions: SUB_ROLE_PERMISSION_PRESETS.order_manager,
  },
  {
    name: "Product Manager Demo",
    email: "products.admin@sagaelite.com",
    password: "ProductAdmin123!",
    role: "sub_admin",
    subRole: "product_manager",
    permissions: SUB_ROLE_PERMISSION_PRESETS.product_manager,
  },
  {
    name: "Marketing Manager Demo",
    email: "marketing.admin@sagaelite.com",
    password: "MarketingAdmin123!",
    role: "sub_admin",
    subRole: "marketing_manager",
    permissions: SUB_ROLE_PERMISSION_PRESETS.marketing_manager,
  },
  {
    name: "Support Admin Demo",
    email: "support.admin@sagaelite.com",
    password: "SupportAdmin123!",
    role: "sub_admin",
    subRole: "support_admin",
    permissions: SUB_ROLE_PERMISSION_PRESETS.support_admin,
  },
  {
    name: "Inventory Manager Demo",
    email: "inventory.admin@sagaelite.com",
    password: "InventoryAdmin123!",
    role: "sub_admin",
    subRole: "inventory_manager",
    permissions: SUB_ROLE_PERMISSION_PRESETS.inventory_manager,
  },
];

const seedDemoAdmins = async () => {
  const dbUri = process.env.MONGO_DB_URI || process.env.MONGO_URI || process.env.DATABASE_URI || process.env.DATABASE;

  if (!dbUri) {
    console.error("Missing MONGO_DB_URI or MONGO_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(dbUri);
  console.log("Database connected.");

  for (const account of DEMO_ADMINS) {
    const existing = await User.findOne({ email: account.email }).select("+password");
    const payload = {
      name: account.name,
      role: account.role,
      subRole: account.role === "sub_admin" ? account.subRole : null,
      permissions: account.permissions || buildDefaultPermissions(false),
      isVerified: true,
      isActive: true,
      provider: "local",
    };

    if (existing) {
      Object.assign(existing, payload);
      existing.password = account.password;
      await existing.save();
      console.log(`Updated demo admin: ${account.email}`);
    } else {
      await User.create({
        ...payload,
        email: account.email,
        password: account.password,
      });
      console.log(`Created demo admin: ${account.email}`);
    }
  }

  console.log("\nDemo admin accounts are ready:");
  DEMO_ADMINS.forEach((account) => {
    const role = account.subRole ? `${account.role}:${account.subRole}` : account.role;
    console.log(`${account.email} | ${account.password} | ${role}`);
  });

  await mongoose.disconnect();
};

module.exports = { seedDemoAdmins, DEMO_ADMINS };

if (require.main === module) {
  seedDemoAdmins().catch(async (error) => {
    console.error("Demo admin seeding failed:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  });
}
