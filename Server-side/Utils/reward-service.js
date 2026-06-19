const Coupon = require("../Models/Coupon");
const Order = require("../Models/Order");
const UserCoupon = require("../Models/UserCoupon");
const User = require("../Models/User");
const sendEmail = require("./send-mail");
const buildEmailTemplate = require("./email-template");
const logger = require("./logger");

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const SOURCE_LABELS = {
  first_order: "First order reward",
  cart_recovery: "Cart recovery reward",
  vip_tier: "VIP tier reward",
  review_reward: "Review reward",
  birthday: "Birthday reward",
  referral: "Referral reward",
  drop_launch: "Drop launch reward",

  manual: "Member reward",
};

const addDays = (days) => new Date(Date.now() + Number(days || 1) * 24 * 60 * 60 * 1000);

const normalizeUser = async (userOrId) => {
  if (!userOrId) return null;
  if (typeof userOrId === "object" && userOrId._id) return userOrId;
  return User.findById(userOrId);
};

const generateRewardCode = (prefix = "SAGA", length = 6) => {
  let suffix = "";
  for (let i = 0; i < length; i += 1) {
    suffix += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return `${String(prefix || "SAGA").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 14)}-${suffix}`;
};

const uniqueRewardCode = async (prefix) => {
  let code = generateRewardCode(prefix);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const exists = await Coupon.exists({ code });
    if (!exists) return code;
    code = generateRewardCode(prefix);
  }
  return `${generateRewardCode(prefix)}-${Date.now().toString(36).toUpperCase()}`;
};

const humanDiscount = (coupon) => {
  if (!coupon) return "a reward";
  if (coupon.discountType === "fixed") {
    return `LKR ${Number(coupon.discountValue || 0).toLocaleString("en-LK")} off`;
  }
  return `${Number(coupon.discountValue || 0)}% off`;
};

const rewardEmailHtml = ({ user, coupon, title, message }) => {
  const greeting = user?.username || user?.email?.split("@")[0] || "there";
  const expiry = coupon.endsAt
    ? new Date(coupon.endsAt).toLocaleDateString("en-LK")
    : "while it remains active";

  return buildEmailTemplate(
    title,
    `<p>Hi ${greeting},</p>
     <p>${message}</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;color:#f2ca50;margin:26px 0;">${coupon.code}</p>
     <p>This code unlocks <strong>${humanDiscount(coupon)}</strong> and expires ${expiry}.</p>
     <p>Open your Saga Elite rewards vault to use it on your next order.</p>`
  );
};

const maybeEmailReward = async ({ user, coupon, title, message }) => {
  if (!user?.email) return;
  try {
    await sendEmail({
      email: user.email,
      subject: title,
      html: rewardEmailHtml({ user, coupon, title, message }),
    });
  } catch (err) {
    logger.warn("[reward] email failed", {
      userId: user?._id,
      code: coupon?.code,
      error: err?.message,
    });
  }
};

const createPersonalReward = async ({
  user,
  source = "manual",
  sourceRef = null,
  codePrefix = "SAGA",
  description,
  discountType = "percent",
  discountValue = 10,
  minOrderValue = 0,
  maxDiscountAmount = null,
  expiryDays = 14,
  firstOrderOnly = false,
  eligibleMemberships = [],
  metadata = {},
  notify = false,
  emailTitle,
  emailMessage,
} = {}) => {
  const resolvedUser = await normalizeUser(user);
  if (!resolvedUser?._id) return null;

  const code = await uniqueRewardCode(codePrefix);
  const endsAt = addDays(expiryDays);
  const coupon = await Coupon.create({
    code,
    description:
      description ||
      `${SOURCE_LABELS[source] || "Member reward"} for ${resolvedUser.email || resolvedUser._id}`,
    discountType,
    discountValue,
    minOrderValue,
    maxUses: 1,
    perUserLimit: 1,
    maxDiscountAmount,
    startsAt: new Date(),
    endsAt,
    isActive: true,
    isPersonalized: true,
    firstOrderOnly,
    eligibleMemberships,
    issuedFor: source === "vip_tier" ? "vip" : source,
  });

  const userCoupon = await UserCoupon.create({
    user: resolvedUser._id,
    coupon: coupon._id,
    code: coupon.code,
    source,
    sourceRef,
    expiresAt: endsAt,
    metadata,
  });

  if (notify) {
    await maybeEmailReward({
      user: resolvedUser,
      coupon,
      title: emailTitle || `Saga Elite ${SOURCE_LABELS[source] || "reward"} unlocked`,
      message:
        emailMessage ||
        `You unlocked a Saga Elite reward: ${humanDiscount(coupon)} on your next order.`,
    });
  }

  return { coupon, userCoupon };
};

const ensureWelcomeReward = async (user, { notify = false } = {}) => {
  const resolvedUser = await normalizeUser(user);
  if (!resolvedUser?._id) return null;

  const existing = await UserCoupon.findOne({
    user: resolvedUser._id,
    source: "first_order",
  }).populate("coupon");

  if (existing) return existing;

  const previousOrders = await Order.countDocuments({
    user: resolvedUser._id,
    status: { $nin: ["cancelled", "refunded"] },
  });

  if (
    previousOrders > 0 ||
    Number(resolvedUser.orderCount || 0) > 0 ||
    Number(resolvedUser.totalSpent || 0) > 0
  ) {
    return null;
  }

  return createPersonalReward({
    user: resolvedUser,
    source: "first_order",
    codePrefix: "WELCOME",
    discountType: "percent",
    discountValue: 10,
    expiryDays: 21,
    firstOrderOnly: true,
    description: "Welcome reward for first Saga Elite order",
    notify,
    emailTitle: "Your Saga Elite welcome reward",
    emailMessage: "Your account is ready. Start your first order with a private welcome reward.",
  });
};

const issueVipTierReward = async (user, tier, { notify = true } = {}) => {
  const resolvedUser = await normalizeUser(user);
  if (!resolvedUser?._id || !tier || tier === "standard") return null;

  const contextKey = `tier:${tier}`;
  const existing = await UserCoupon.findOne({
    user: resolvedUser._id,
    source: "vip_tier",
    "metadata.contextKey": contextKey,
  });
  if (existing) return existing;

  const valueByTier = {
    elite: 8,
    rare: 10,
    legend: 15,
    vip: 20,
  };

  return createPersonalReward({
    user: resolvedUser,
    source: "vip_tier",
    codePrefix: tier.toUpperCase(),
    discountType: "percent",
    discountValue: valueByTier[tier] || 8,
    expiryDays: 30,
    eligibleMemberships: [tier],
    description: `Private ${tier} membership reward`,
    metadata: { tier, contextKey },
    notify,
    emailTitle: `Your ${tier.toUpperCase()} member reward is unlocked`,
    emailMessage: `Your Saga Elite membership moved to ${tier}. This private code is reserved for your account.`,
  });
};

module.exports = {
  SOURCE_LABELS,
  createPersonalReward,
  ensureWelcomeReward,
  issueVipTierReward,
  humanDiscount,
  uniqueRewardCode,
};
