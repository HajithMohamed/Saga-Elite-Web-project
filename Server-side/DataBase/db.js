// config/db.js
const mongoose = require("mongoose");

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) {
    console.log("→ Using existing MongoDB connection");
    return;
  }

  let mongoUri = process.env.MONGO_DB_URI;

  if (!mongoUri) {
    console.error("❌ MONGO_DB_URI is not defined in environment variables");
    process.exit(1);
  }

  // ensure the URI specifies the intended database; if not, append a default
  // (Atlas URIs often end with a slash and no database name)
  const hasDatabase = /\/[^\/?]+(\?.*)?$/.test(mongoUri);
  if (!hasDatabase) {
    const defaultDb = "sagaelite";
    mongoUri = mongoUri.replace(/\/?$/, "") + "/" + defaultDb;
  }

  try {
    console.log("→ Attempting to connect to MongoDB...");

    const safeUri = mongoUri.replace(/\/\/.*@/, '//<credentials>@');
    console.log("  URI:", safeUri);

    await mongoose.connect(mongoUri, {
      // Recommended modern options (most are default now, but explicit is clearer)
      serverSelectionTimeoutMS: 5000,     // fail fast if can't connect
      maxPoolSize: 10,                    // reasonable pool for small–medium app
      // useNewUrlParser: true,           // deprecated / default true
      // useUnifiedTopology: true,        // deprecated / default true
    });

    isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      console.log("✅ MongoDB connected successfully!");
      console.log(`   Database: ${mongoose.connection.db.databaseName}`);
      console.log(`   Host: ${mongoose.connection.host}`);
    }

    // Optional: listen for connection events (very useful in production)
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected – will attempt to reconnect on next use");
      isConnected = false;
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    // In production you might want to retry instead of exit
    // For development → exit is fine
    process.exit(1);
  }
};

module.exports = connectToDB;