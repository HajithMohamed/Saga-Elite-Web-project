let cron;
try {
  cron = require("node-cron");
} catch (err) {
  cron = null;
}

const User = require("../Models/User");
const UserCoupon = require("../Models/UserCoupon");
const { createPersonalReward } = require("./reward-service");
const logger = require("./logger");

const ABANDONED_AFTER_MS = Number(process.env.CART_RECOVERY_AFTER_HOURS || 6) * 60 * 60 * 1000;
const COOLDOWN_MS = Number(process.env.CART_RECOVERY_COOLDOWN_DAYS || 7) * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 50;

const runCartAbandonmentBatch = async () => {
  const abandonedBefore = new Date(Date.now() - ABANDONED_AFTER_MS);
  const cooldownAfter = new Date(Date.now() - COOLDOWN_MS);

  const users = await User.find({
    email: { $exists: true, $ne: null },
    "cart.0": { $exists: true },
    "cart.addedAt": { $lte: abandonedBefore },
  })
    .select("email username cart")
    .limit(BATCH_SIZE);

  let issued = 0;

  for (const user of users) {
    const recentRecovery = await UserCoupon.exists({
      user: user._id,
      source: "cart_recovery",
      assignedAt: { $gte: cooldownAfter },
    });

    if (recentRecovery) continue;

    try {
      const result = await createPersonalReward({
        user,
        source: "cart_recovery",
        codePrefix: "COMPLETE",
        discountType: "percent",
        discountValue: 15,
        expiryDays: 1,
        description: "24-hour cart recovery reward",
        metadata: {
          cartSize: user.cart.length,
          abandonedAt: abandonedBefore,
        },
        notify: true,
        emailTitle: "Your Saga Elite cart reward expires soon",
        emailMessage:
          "Your reserved pieces are still waiting. Complete checkout within 24 hours with this private recovery reward.",
      });

      if (result) issued += 1;
    } catch (err) {
      logger.warn("[cart-recovery] reward failed", {
        userId: user._id,
        error: err?.message,
      });
    }
  }

  if (issued > 0) {
    logger.info("[cart-recovery] rewards issued", { issued });
  }

  return { scanned: users.length, issued };
};

const initCartAbandonmentJob = () => {
  if (!cron) {
    logger.warn("[cart-recovery] node-cron not available; job not scheduled.");
    return;
  }

  cron.schedule("15 * * * *", () => {
    runCartAbandonmentBatch().catch((err) =>
      logger.error("[cart-recovery] hourly run failed", { error: err.message })
    );
  });
  logger.info("[cart-recovery] Scheduled hourly cart reward scan.");
};

module.exports = {
  initCartAbandonmentJob,
  runCartAbandonmentBatch,
};
