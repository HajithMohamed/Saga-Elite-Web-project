const mongoose = require("mongoose");
const logger = require("../Utils/logger");

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) {
    logger.debug("Using existing MongoDB connection");
    return;
  }

  let mongoUri = process.env.MONGO_DB_URI;

  const looksLikePlaceholder = (uri) =>
    typeof uri === "string" && /<.*>|<credentials>|<username>|<password>/.test(uri);

  if (!mongoUri || looksLikePlaceholder(mongoUri)) {
    if (process.env.NODE_ENV !== "production") {
      const fallback = "mongodb://127.0.0.1:27017/sagaelite";
      logger.warn(
        "MONGO_DB_URI is missing or looks like a placeholder; falling back to local MongoDB for development",
        { fallback }
      );
      mongoUri = fallback;
    } else {
      logger.error("MONGO_DB_URI is not defined in environment variables");
      process.exit(1);
    }
  }

  const hasDatabase = /\/[^\/?]+(\?.*)?$/.test(mongoUri);
  if (!hasDatabase) {
    mongoUri = `${mongoUri.replace(/\/?$/, "")}/sagaelite`;
  }

  try {
    logger.info("Attempting to connect to MongoDB");

    const safeUri = mongoUri.replace(/\/\/.*@/, "//<credentials>@");
    logger.debug("MongoDB connection target prepared", { uri: safeUri });

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      logger.info("MongoDB connected successfully", {
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
      });
    }

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error", { error: err });
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected; will attempt to reconnect on next use");
      isConnected = false;
    });
  } catch (error) {
    logger.error("MongoDB connection failed", { error: error.message });
    process.exit(1);
  }
};

module.exports = connectToDB;
