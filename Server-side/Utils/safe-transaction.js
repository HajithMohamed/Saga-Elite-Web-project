const mongoose = require("mongoose");
const logger = require("./logger");

/**
 * Runs a block of code within a transaction if the MongoDB connection supports it.
 * Falls back to normal execution if transactions are not available (standalone dev).
 * 
 * @param {Function} work - Async function containing the database operations. Receives (session) or null.
 * @returns {Promise<any>} - The result of the work function.
 */
const runInTransaction = async (work) => {
  const client = mongoose.connection.getClient();
  const topologyType = client?.topology?.description?.type;

  // Transactions are only supported on ReplicaSetNoPrimary, ReplicaSetWithPrimary, or Sharded (mongos).
  // On a standalone instance (Topology Type: 'Single'), transactions are NOT supported.
  const supportsTransactions = topologyType && topologyType !== "Single" && topologyType !== "Unknown";

  if (!supportsTransactions) {
    logger.debug(`MongoDB topology is ${topologyType}; transactions not supported. Running without transaction.`);
    return await work(null);
  }

  let session = null;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    logger.debug("Failed to start MongoDB session; running without transaction.", { error: err.message });
    return await work(null);
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    // If the error is specifically about transactions not being supported (paranoia check)
    if (err.message?.includes("Transaction numbers are only allowed on a replica set")) {
      logger.warn("Transaction failed due to standalone MongoDB; retrying without transaction.");
      return await work(null);
    }
    throw err; // Re-throw real validation/logic errors
  } finally {
    if (session) await session.endSession();
  }
};

module.exports = runInTransaction;
