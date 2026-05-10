let cron;
try {
  cron = require("node-cron");
} catch (err) {
  cron = null;
}

const Guest = require("../Models/Guest");
const sendEmail = require("./send-mail");
const buildEmailTemplate = require("./email-template");
const logger = require("./logger");

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

const buildPromoHtml = ({ guest, unsubscribeUrl, shopUrl }) => {
  const greeting = guest.name ? `Hi ${guest.name},` : "Hi there,";
  const body = `
    <p>${greeting}</p>
    <p>It's been a while since you visited <strong>Saga Elite</strong>. We've added new arrivals and limited drops we think you'll love.</p>
    <p style="margin: 24px 0;">
      <a href="${shopUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Shop new arrivals</a>
    </p>
    <p style="color:#64748b;font-size:13px;margin-top:32px;">
      Want more? <a href="${shopUrl}/auth/register" style="color:#0f172a;">Register</a> for surprise gifts and exclusive drops.
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <p style="color:#94a3b8;font-size:12px;">
      You're receiving this because you placed an order or browsed Saga Elite.
      <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>.
    </p>
  `;

  return buildEmailTemplate("We miss you at Saga Elite", body);
};

const runGuestPromoBatch = async () => {
  const oneWeekAgo = new Date(Date.now() - ONE_WEEK_MS);
  const apiBase = process.env.API_PUBLIC_URL || process.env.CLIENT_URL || "http://localhost:5001";
  const shopUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const filter = {
    "preferences.promoOptIn": true,
    lastUsedAt: { $lt: oneWeekAgo },
    email: { $exists: true, $ne: null },
  };

  const total = await Guest.countDocuments(filter);
  if (total === 0) {
    logger.info("[guest-promo] No eligible guests this run.");
    return { sent: 0, total: 0 };
  }

  let sent = 0;
  let processed = 0;

  while (processed < total) {
    const batch = await Guest.find(filter)
      .sort({ lastUsedAt: 1 })
      .skip(processed)
      .limit(BATCH_SIZE)
      .lean();

    if (!batch.length) break;

    for (const guest of batch) {
      const token = guest.guestToken;
      if (!token) {
        // No token = can't unsubscribe. Skip rather than spam.
        continue;
      }
      const unsubscribeUrl = `${apiBase}/api/v1/guest/unsubscribe?token=${encodeURIComponent(token)}`;
      const html = buildPromoHtml({ guest, unsubscribeUrl, shopUrl });

      try {
        await sendEmail({
          email: guest.email,
          subject: "We miss you at Saga Elite — new arrivals waiting",
          html,
        });
        sent += 1;
      } catch (err) {
        logger.error("[guest-promo] email failed", {
          email: guest.email,
          error: err.message,
        });
      }
    }

    processed += batch.length;
  }

  logger.info("[guest-promo] batch complete", { sent, total });
  return { sent, total };
};

const initGuestPromoJob = () => {
  if (!cron) {
    logger.warn("[guest-promo] node-cron not available; job not scheduled.");
    return;
  }

  // Mondays 10:00 (server local time).
  cron.schedule("0 10 * * 1", () => {
    runGuestPromoBatch().catch((err) =>
      logger.error("[guest-promo] weekly run failed", { error: err.message })
    );
  });
  logger.info("[guest-promo] Scheduled weekly promo for Mondays 10:00.");
};

module.exports = { initGuestPromoJob, runGuestPromoBatch };
