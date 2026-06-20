const Customer = require("../Models/Customer");
const Guest = require("../Models/Guest");
const User = require("../Models/User");
const logger = require("../Utils/logger");

// ── Guest-to-user migration ──
// Transfers enrichment data from Guest → Customer when a guest registers.
// Does NOT duplicate User fields (totalSpent, membership, etc.) — those
// remain authoritative on the User model. Only transfers:
//   - Guest activity log
//   - Guest preferences
//   - Basic identity (name, phone)

const migrateGuestToUser = async (guestToken, user) => {
  if (!guestToken || !user) {
    logger.warn("[migration] missing guestToken or user");
    return null;
  }

  const guest = await Guest.findOne({ guestToken });
  if (!guest) {
    logger.info("[migration] no guest found for token", { guestToken });
    return null;
  }

  try {
    const existingCustomer = await Customer.findOne({ guestToken });
    if (existingCustomer) {
      existingCustomer.type = "registered";
      existingCustomer.userId = user._id;
      existingCustomer.email = user.email;
      existingCustomer.name = user.username || guest.name || existingCustomer.name;
      existingCustomer.lastSessionAt = new Date();

      // Merge guest activity log if Customer has fewer entries
      if (guest.activityLog?.length > 0) {
        const existingTypes = new Set(
          (existingCustomer.activityLog || []).map((a) => `${a.type}_${a.at?.getTime?.() || a.at}`)
        );
        for (const entry of (guest.activityLog || []).slice().reverse()) {
          const key = `${entry.type}_${entry.at?.getTime?.() || entry.at}`;
          if (!existingTypes.has(key)) {
            existingCustomer.activityLog.unshift(entry);
          }
        }
      }

      await existingCustomer.save();
      await Guest.findByIdAndUpdate(guest._id, { isRegistered: true });

      logger.info("[migration] existing customer updated to registered", {
        customerId: existingCustomer._id,
        userId: user._id,
      });

      return existingCustomer;
    }

    const customer = await Customer.create({
      email: user.email,
      type: "registered",
      userId: user._id,
      guestId: guest._id,
      guestToken,
      name: user.username || guest.name || null,
      firstSeenAt: guest.createdAt || user.createdAt || new Date(),
      lastSessionAt: new Date(),
      preferences: {
        promoOptIn: guest.preferences?.promoOptIn ?? true,
        newsletterOptIn: false,
      },
      activityLog: (guest.activityLog || []).slice(-200),
    });

    await Guest.findByIdAndUpdate(guest._id, { isRegistered: true });

    logger.info("[migration] guest migrated to customer", {
      customerId: customer._id,
      userId: user._id,
      guestId: guest._id,
      activityCount: guest.activityLog?.length || 0,
    });

    return customer;
  } catch (err) {
    logger.error("[migration] failed", {
      guestToken,
      userId: user._id,
      error: err.message,
    });
    throw err;
  }
};

// ── Ensure Customer record exists ──
// Creates a Customer enrichment record if one doesn't already exist for the
// given userId or guestToken. Does NOT duplicate User data — only stores
// enrichment fields.

const ensureCustomerRecord = async ({ userId, guestToken, email } = {}) => {
  if (userId) {
    let customer = await Customer.findOne({ userId });
    if (customer) return customer;

    const user = await User.findById(userId);
    if (!user) return null;

    // If a Customer already exists for this guestToken, link it to the user
    if (guestToken) {
      const existingByToken = await Customer.findOne({ guestToken });
      if (existingByToken) {
        existingByToken.userId = userId;
        existingByToken.type = "registered";
        existingByToken.email = user.email;
        existingByToken.name = user.username || existingByToken.name;
        await existingByToken.save();
        return existingByToken;
      }
    }

    customer = await Customer.create({
      email: user.email,
      type: "registered",
      userId: user._id,
      name: user.username,
      firstSeenAt: user.createdAt,
      lastSessionAt: new Date(),
    });

    return customer;
  }

  if (guestToken) {
    const guest = await Guest.findOne({ guestToken });

    const customerEmail = guest?.email || email;
    const customer = await Customer.findOneAndUpdate(
      { guestToken },
      {
        $setOnInsert: {
          guestToken,
          type: "guest",
          guestId: guest?._id || null,
          ...(customerEmail ? { email: customerEmail } : {}),
          name: guest?.name || null,
          firstSeenAt: guest?.createdAt || new Date(),
          lastSessionAt: new Date(),
          preferences: {
            promoOptIn: guest?.preferences?.promoOptIn ?? true,
            newsletterOptIn: false,
          },
          activityLog: (guest?.activityLog || []).slice(-200),
        },
      },
      { upsert: true, new: true }
    );

    return customer;
  }

  return null;
};

const getOrCreateCustomer = async (req) => {
  const userId = req.user?.id || req.user?._id;
  const guestToken = req.guestToken;

  try {
    return await ensureCustomerRecord({ userId, guestToken });
  } catch (err) {
    // E11000 = duplicate key race (two concurrent requests create the same
    // customer). Fall back to a read — the winning insert is already there.
    if (err.code === 11000) {
      logger.warn("[migration] E11000 in getOrCreateCustomer, retrying with read", {
        error: err.message,
      });
      if (userId) {
        const existing = await Customer.findOne({ userId });
        if (existing) return existing;
      }
      if (guestToken) {
        const existing = await Customer.findOne({ guestToken });
        if (existing) return existing;
      }
    }
    throw err;
  }
};

module.exports = {
  migrateGuestToUser,
  ensureCustomerRecord,
  getOrCreateCustomer,
};
