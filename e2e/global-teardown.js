const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const TEST_DB_URI =
  process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/saga_elite_test";

module.exports = async () => {
  // Keep the test DB around when running locally so failures can be inspected.
  // In CI, drop it so the next run starts clean.
  if (!process.env.CI) {
    console.log("[e2e teardown] skipping DB drop (set CI=1 to drop)");
    return;
  }

  const mongoose = require("mongoose");
  await mongoose.connect(TEST_DB_URI);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log("[e2e teardown] dropped test database");
};
