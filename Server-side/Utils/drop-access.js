// Visibility gate for drops that have a future releaseDate.
// Public users see them only at/after `releaseDate`. Customers tagged "vip"
// (set via the admin user-management panel) see them `vipEarlyAccessHours`
// hours earlier, if the drop has that field set.
//
// Consumed by shopping-side product/drop endpoints when filtering what to
// show to a logged-in user. Not yet wired into product visibility — admins
// can configure the offset on each drop now, and the gate is ready to flip
// on when shopping flows adopt it.

const isVipUser = (user) => {
  if (!user) return false;
  const tags = Array.isArray(user.tags) ? user.tags : [];
  return tags.includes("vip");
};

// Returns true if `user` should be allowed to see/buy from `drop` right now.
// Pass `now` for testability (defaults to current time).
const isDropAccessible = (drop, user, now = Date.now()) => {
  if (!drop) return false;
  if (drop.isArchived) return false;
  if (!drop.isPublished) return false;

  const release = drop.releaseDate ? new Date(drop.releaseDate).getTime() : null;
  const end = drop.endDate ? new Date(drop.endDate).getTime() : null;

  if (end && end <= now) return false;

  if (!release) return true; // Published with no scheduled release = live now.
  if (release <= now) return true;

  // Drop is in the future. VIP early-access window?
  const earlyHours = Number(drop.vipEarlyAccessHours) || 0;
  if (earlyHours > 0 && isVipUser(user)) {
    const vipOpen = release - earlyHours * 60 * 60 * 1000;
    return now >= vipOpen;
  }

  return false;
};

// Useful for messaging customers: "Drop opens in 6h" vs "VIP access in 2h".
const accessPhase = (drop, user, now = Date.now()) => {
  if (!drop || drop.isArchived || !drop.isPublished) return "unavailable";
  const release = drop.releaseDate ? new Date(drop.releaseDate).getTime() : null;
  const end = drop.endDate ? new Date(drop.endDate).getTime() : null;
  if (end && end <= now) return "ended";
  if (!release || release <= now) return "live";

  const earlyHours = Number(drop.vipEarlyAccessHours) || 0;
  if (earlyHours > 0) {
    const vipOpen = release - earlyHours * 60 * 60 * 1000;
    if (isVipUser(user) && now >= vipOpen) return "vip_early";
    if (now >= vipOpen) return "scheduled_vip_window";
  }
  return "scheduled";
};

module.exports = {
  isVipUser,
  isDropAccessible,
  accessPhase,
};
