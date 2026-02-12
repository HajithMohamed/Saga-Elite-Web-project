// config/db.js
const mongoose = require("mongoose");

let isConnected = false;

const connectToDB = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    const db = await mongoose.connect(
      `${process.env.MONGO_DB_URI}/Saga-Elite?retryWrites=true&w=majority`
    );

    isConnected = db.connections[0].readyState === 1;
    console.log("Database connected successfully!!");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectToDB;
