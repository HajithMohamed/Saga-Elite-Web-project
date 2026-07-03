const catchAsync = require("../Utils/catchAsync");
const User = require("../Models/User");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const Review = require("../Models/Review");

// Non-customer roles excluded from the public "happy customers" count.
const ADMIN_ROLE_VALUES = ["admin", "superadmin", "super_admin", "sub_admin"];

/*
|--------------------------------------------------------------------------
| Public store statistics (homepage)
|--------------------------------------------------------------------------
| Read-only aggregate counts so the storefront shows *real* numbers — no
| fabricated stats. Each value is returned as-is; the frontend hides any
| card whose metric is falsy/low, so we never need to pad the response.
*/
exports.getPublicStats = catchAsync(async (_req, res) => {
  const [happyCustomers, totalOrders, totalProducts, ratingAgg] = await Promise.all([
    User.countDocuments({ role: { $nin: ADMIN_ROLE_VALUES } }),
    Order.countDocuments({ status: "delivered" }),
    Product.countDocuments({ isActive: true }),
    Review.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
    ]),
  ]);

  const ratingRow = ratingAgg[0] || { avg: 0, total: 0 };
  const averageRating =
    ratingRow.total > 0 ? Math.round(ratingRow.avg * 10) / 10 : 0;

  res.status(200).json({
    success: true,
    data: {
      happyCustomers,
      totalOrders,
      totalProducts,
      averageRating,
      reviewCount: ratingRow.total,
    },
  });
});
