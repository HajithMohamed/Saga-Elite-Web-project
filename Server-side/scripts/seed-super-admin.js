const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Update path to your .env depending on workspace root (usually running this relative to project dir)
dotenv.config({ path: path.join(__dirname, "../Config/.env") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

const User = require("../Models/User");
const db = require("../DataBase/db");

// Simple argument parser:
// Usage: node seed-super-admin.js email="admin@saga.com" password="SecurePassword123!"
const args = process.argv.slice(2);
const params = {};
args.forEach(arg => {
  const [key, value] = arg.split("=");
  if (key && value) {
    params[key] = value;
  }
});

const DEFAULT_SUPER_EMAIL = params.email || "superadmin@sagaelite.com";
const DEFAULT_SUPER_PASSWORD = params.password || "SuperSecret123!";

const seedSuperAdmin = async () => {
  try {
    console.log(`Connecting to database...`);
    // NOTE: Replace process.env.DATABASE_URL or wherever your connect string sits if it differs
    const DB_URI = process.env.MONGO_URI || process.env.DATABASE_URI || process.env.DATABASE;
    if (!DB_URI) {
      console.warn("DB Connection string not found in environment, make sure .env is configured correctly.");
    }
    
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected successfully.");

    const existingSuperAdmin = await User.findOne({ 
      role: { $in: ["super_admin", "superadmin"] } 
    });

    if (existingSuperAdmin) {
      console.log(`\n[INFO] A Super Admin already exists: ${existingSuperAdmin.email}`);
      console.log("System requires exactly one true Super Admin. Exiting seeder safely.");
      process.exit(0);
    }

    console.log(`\n[ACTION] Creating first Super Admin account...`);
    
    // Uses pre-save hooks so do not hash here:
    // User validation hooks will enforce strong passwords unless skipped.
    const newSuperAdmin = new User({
      email: DEFAULT_SUPER_EMAIL,
      password: DEFAULT_SUPER_PASSWORD,
      role: "super_admin",
      isVerified: true,
      isActive: true,
    });

    await newSuperAdmin.save();

    console.log(`\n[SUCCESS] Super Admin account created!`);
    console.log(`Email: ${DEFAULT_SUPER_EMAIL}`);
    console.log(`Password: ${DEFAULT_SUPER_PASSWORD}`);
    console.log(`Please log in immediately and change the default password.`);
    process.exit(0);

  } catch (error) {
    console.error(`\n[ERROR] Seeding failed!`);
    console.error(error.message);
    if (error.errors) {
      console.error(error.errors);
    }
    process.exit(1);
  }
};

seedSuperAdmin();
