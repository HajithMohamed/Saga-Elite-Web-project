let cron = null;
try {
  cron = require("node-cron");
} catch (_error) {
  console.warn("[recommendations-digest] node-cron not installed; scheduler disabled.");
}

const Recommendation = require("../Models/Recommendation");
const User = require("../Models/User");
const sendEmail = require("./send-mail");

const TYPES = ["reviews", "products", "drops", "analytics", "improvements", "ideas"];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const buildHtml = ({ topRecs, frontendUrl }) => {
  const rec = topRecs
    .map(
      (r) => `
        <li style="margin-bottom:12px;">
          <strong style="color:#0a0a0a;">${escape(r.area)}</strong>
          <span style="background:#f2ca50;color:#0a0a0a;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;text-transform:uppercase;margin-left:6px;">${escape(r.type)}</span>
          <span style="background:#eee;color:#444;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:bold;text-transform:uppercase;margin-left:4px;">${escape(r.priority)}</span>
          <span style="color:#888;font-size:11px;margin-left:6px;">${r.confidence}% conf</span>
          <p style="margin:4px 0 0 0;color:#444;font-size:13px;">${escape(r.action)}</p>
          ${r.expectedImpact ? `<p style="margin:2px 0 0 0;color:#888;font-size:12px;font-style:italic;">${escape(r.expectedImpact)}</p>` : ""}
        </li>`
    )
    .join("");

  const dashboardLink = frontendUrl ? `${frontendUrl}/admin/dashboard` : "your admin panel";

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#222;">
      <h2 style="color:#0a0a0a;margin-bottom:6px;">Weekly AI Digest — Saga Elite</h2>
      <p style="color:#555;margin-top:0;">Top recommendations for the week.</p>

      ${topRecs.length > 0 ? `
        <h3 style="color:#0a0a0a;margin-top:24px;">Top recommendations</h3>
        <ul style="padding-left:20px;">${rec}</ul>
        <p style="margin-top:8px;"><a href="${dashboardLink}" style="color:#b8941d;">Open the admin dashboard →</a></p>
      ` : `
        <p style="color:#888;margin-top:24px;">Nothing to flag this week. Quiet is good.</p>
      `}

      <hr style="border:none;border-top:1px solid #ddd;margin:32px 0 16px 0;" />
      <p style="color:#aaa;font-size:11px;">You received this because you're an admin on Saga Elite. Generated automatically each Monday at 09:00.</p>
    </div>
  `;
};

const escape = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const collectTopRecommendations = async () => {
  const result = [];
  for (const type of TYPES) {
    const rec = await Recommendation.findOne({ type }).sort({ generatedAt: -1 }).lean();
    if (!rec || !Array.isArray(rec.recommendations) || rec.recommendations.length === 0) continue;
    // Take the single highest-priority + highest-confidence recommendation per type
    const sorted = [...rec.recommendations].sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
        (b.confidence || 0) - (a.confidence || 0)
    );
    const top = sorted[0];
    if (top) {
      result.push({ ...top, type });
    }
  }
  // Sort across types: priority then confidence
  result.sort(
    (a, b) =>
      (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
      (b.confidence || 0) - (a.confidence || 0)
  );
  return result.slice(0, 5);
};

const sendDigestNow = async () => {
  const [topRecs, admins] = await Promise.all([
    collectTopRecommendations(),
    User.find({ role: { $in: ["admin", "super_admin"] }, email: { $exists: true, $ne: "" } })
      .select("email name")
      .lean(),
  ]);

  if (topRecs.length === 0) {
    console.log("[recommendations-digest] Nothing meaningful to send. Skipping.");
    return { sent: 0, skipped: true };
  }
  if (admins.length === 0) {
    console.log("[recommendations-digest] No admins with emails. Skipping.");
    return { sent: 0, skipped: true };
  }

  const html = buildHtml({
    topRecs,
    frontendUrl: process.env.FRONTEND_URL || "",
  });
  const subject = `[Saga Elite] Weekly AI Digest — ${topRecs.length} recommendation${topRecs.length === 1 ? "" : "s"}`;

  let sent = 0;
  for (const admin of admins) {
    try {
      await sendEmail({ email: admin.email, subject, html });
      sent += 1;
    } catch (err) {
      console.error(`[recommendations-digest] Failed to email ${admin.email}:`, err.message);
    }
  }
  console.log(`[recommendations-digest] Sent digest to ${sent}/${admins.length} admins.`);
  return { sent, total: admins.length };
};

const initRecommendationsDigest = () => {
  if (!cron) return;
  cron.schedule("0 9 * * 1", () => {
    sendDigestNow().catch((err) =>
      console.error("[recommendations-digest] weekly run failed:", err.message)
    );
  });
  console.log("[recommendations-digest] Scheduled weekly digest for Mondays 09:00.");
};

module.exports = { initRecommendationsDigest, sendDigestNow };
