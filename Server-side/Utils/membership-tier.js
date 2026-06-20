/**
 * Membership tier helper.
 *
 * Tiers are auto-promoted based on lifetime totalSpent.
 * `vip` is never auto-assigned and never auto-downgraded — it's manual-only.
 *
 * Thresholds (LKR):
 *   legend  ≥ 100,000
 *   rare    ≥  50,000
 *   elite   ≥  20,000
 *   else    standard
 */

const TIERS = {
  STANDARD: "standard",
  ELITE: "elite",
  RARE: "rare",
  LEGEND: "legend",
  VIP: "vip",
};

const computeMembershipTier = (totalSpent, currentMembership) => {
  // Never auto-touch a VIP — only admins can assign or remove this tier.
  if (currentMembership === TIERS.VIP) return TIERS.VIP;

  const spent = Number(totalSpent) || 0;
  if (spent >= 100000) return TIERS.LEGEND;
  if (spent >= 50000) return TIERS.RARE;
  if (spent >= 20000) return TIERS.ELITE;
  return TIERS.STANDARD;
};

module.exports = {
  TIERS,
  computeMembershipTier,
};
