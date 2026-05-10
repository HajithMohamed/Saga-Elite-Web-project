const catchAsync = require("../Utils/catchAsync");
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const User = require("../Models/User");
const Drop = require("../Models/Drop");
const Coupon = require("../Models/Coupon");

const SUPER_ADMIN_ROLES = new Set(["super_admin", "superadmin"]);
const PER_BUCKET_LIMIT = 5;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const can = (req, permission) => {
  const role = req.userInfo?.role;
  if (SUPER_ADMIN_ROLES.has(role)) return true;
  return !!req.userInfo?.permissions?.[permission];
};

const searchProducts = async (regex) => {
  const docs = await Product.find({
    $or: [{ name: regex }, { artNo: regex }, { brand: regex }],
  })
    .select("name artNo brand slug totalStock")
    .limit(PER_BUCKET_LIMIT)
    .lean();

  return docs.map((p) => ({
    _id: String(p._id),
    label: p.name,
    sublabel: `${p.artNo} · ${p.brand} · ${p.totalStock} in stock`,
    href: `/admin/product?focus=${encodeURIComponent(String(p._id))}`,
  }));
};

const searchOrders = async (regex, query) => {
  const orQueries = [{ slug: regex }, { guestEmail: regex }];

  const docs = await Order.find({ $or: orQueries })
    .select("slug guestEmail totalAmount status user createdAt")
    .populate({ path: "user", select: "email username" })
    .sort({ createdAt: -1 })
    .limit(PER_BUCKET_LIMIT)
    .lean();

  // Also try a direct ObjectId hit if the query looks like one.
  return docs.map((o) => {
    const customer = o.user?.email || o.guestEmail || "guest";
    return {
      _id: String(o._id),
      label: o.slug || String(o._id).slice(-8),
      sublabel: `${customer} · ${o.status} · LKR ${Number(o.totalAmount || 0).toLocaleString()}`,
      href: `/admin/order?focus=${encodeURIComponent(o.slug || String(o._id))}`,
    };
  });
};

const searchCustomers = async (regex) => {
  const docs = await User.find({
    role: { $in: ["user", "customer"] },
    $or: [{ email: regex }, { username: regex }, { phoneNumber: regex }],
  })
    .select("email username phoneNumber membership")
    .limit(PER_BUCKET_LIMIT)
    .lean();

  return docs.map((u) => ({
    _id: String(u._id),
    label: u.username || u.email,
    sublabel: `${u.email}${u.phoneNumber ? ` · ${u.phoneNumber}` : ""}`,
    href: `/admin/users?focus=${encodeURIComponent(String(u._id))}`,
  }));
};

const searchDrops = async (regex) => {
  const docs = await Drop.find({
    $or: [{ name: regex }, { slug: regex }, { description: regex }],
  })
    .select("name slug releaseDate isPublished")
    .sort({ releaseDate: -1 })
    .limit(PER_BUCKET_LIMIT)
    .lean();

  return docs.map((d) => ({
    _id: String(d._id),
    label: d.name,
    sublabel: `${d.isPublished ? "live" : "draft"}${d.releaseDate ? ` · releases ${new Date(d.releaseDate).toISOString().slice(0, 10)}` : ""}`,
    href: `/admin/drop?focus=${encodeURIComponent(d.slug || String(d._id))}`,
  }));
};

const searchCoupons = async (regex) => {
  const docs = await Coupon.find({
    $or: [{ code: regex }, { description: regex }],
  })
    .select("code description discountType discountValue isActive")
    .limit(PER_BUCKET_LIMIT)
    .lean();

  return docs.map((c) => ({
    _id: String(c._id),
    label: c.code,
    sublabel: `${c.discountType === "percent" ? `${c.discountValue}% off` : `LKR ${c.discountValue} off`} · ${c.isActive ? "active" : "inactive"}`,
    href: `/admin/coupons?focus=${encodeURIComponent(c.code)}`,
  }));
};

const globalSearch = catchAsync(async (req, res) => {
  const raw = String(req.query.q || "").trim();
  const empty = {
    success: true,
    query: raw,
    data: { products: [], orders: [], customers: [], drops: [], coupons: [] },
  };

  if (raw.length < MIN_QUERY_LENGTH) {
    return res.status(200).json(empty);
  }
  const query = raw.slice(0, MAX_QUERY_LENGTH);
  const regex = new RegExp(escapeRegex(query), "i");

  const tasks = {
    products: can(req, "products") ? searchProducts(regex) : Promise.resolve([]),
    orders: can(req, "orders") ? searchOrders(regex, query) : Promise.resolve([]),
    customers: can(req, "users") ? searchCustomers(regex) : Promise.resolve([]),
    drops: can(req, "drops") ? searchDrops(regex) : Promise.resolve([]),
    coupons: can(req, "sendCampaigns") ? searchCoupons(regex) : Promise.resolve([]),
  };

  const [products, orders, customers, drops, coupons] = await Promise.all([
    tasks.products,
    tasks.orders,
    tasks.customers,
    tasks.drops,
    tasks.coupons,
  ]);

  res.status(200).json({
    success: true,
    query,
    data: { products, orders, customers, drops, coupons },
  });
});

module.exports = { globalSearch };
