const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Category = require("../Models/Category");
const slugify = require("slugify");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const buildAdminUserFilter = (query = {}) => {
  const filter = {};
  const { search, status, role, membership } = query;

  if (search && String(search).trim()) {
    const safeSearch = escapeRegex(String(search).trim());
    filter.$or = [
      { email: { $regex: safeSearch, $options: "i" } },
      { username: { $regex: safeSearch, $options: "i" } },
      { phoneNumber: { $regex: safeSearch, $options: "i" } },
      { role: { $regex: safeSearch, $options: "i" } },
      { provider: { $regex: safeSearch, $options: "i" } },
    ];
  }

  let isActiveFilter;
  if (status === "active") {
    isActiveFilter = true;
  } else if (status === "inactive") {
    isActiveFilter = false;
  }

  if (membership === "blocked") {
    if (isActiveFilter === true) {
      filter._id = null;
    } else {
      isActiveFilter = false;
    }
  } else if (membership && membership !== "all") {
    filter.membership = membership;
  }

  if (typeof isActiveFilter === "boolean") {
    filter.isActive = isActiveFilter;
  }

  if (role && role !== "all") {
    if (role === "user" || role === "customer") {
      filter.role = { $in: ["user", "customer"] };
    } else if (role === "superadmin") {
      filter.role = { $in: ["superadmin", "super_admin"] };
    } else {
      filter.role = role;
    }
  }

  return filter;
};

const getAdminUserSort = (sort) => {
  switch (sort) {
    case "spent_desc":
      return { totalSpent: -1, createdAt: -1 };
    case "orders_desc":
      return { orderCount: -1, createdAt: -1 };
    case "last_active":
      return { lastOrderAt: -1, createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

const buildPaginatedResults = ({ data, totalDocuments, page, limit }) => {
  const results = {
    total: totalDocuments,
    page,
    limit,
    results: data.length,
    totalPages: Math.max(1, Math.ceil(totalDocuments / limit)),
    data,
  };

  const skip = (page - 1) * limit;

  if (skip + limit < totalDocuments) {
    results.next = { page: page + 1, limit };
  }

  if (skip > 0) {
    results.previous = { page: page - 1, limit };
  }

  return results;
};

const normalizeCategoryPath = (value) => {
  const segments = String(value || "")
    .split(/\/|>|\|/)
    .map((segment) => slugify(String(segment || "").trim(), { lower: true, strict: true }))
    .filter(Boolean);

  return segments.length ? segments.join("/") : "";
};

const resolveCategoryValues = async (value) => {
  const raw = String(value || "").trim();
  if (!raw) return [];

  const normalized = raw.toLowerCase();
  const categories = await Category.find({
    $or: [
      { slug: normalized },
      { name: { $regex: `^${escapeRegex(raw)}$`, $options: "i" } },
    ],
  })
    .select("slug name")
    .lean();

  const values = new Set([raw, normalized]);
  categories.forEach((category) => {
    if (category.slug) values.add(category.slug);
    if (category.name) values.add(category.name);
  });

  return [...values].filter(Boolean);
};

const paginatedResult = (Model) =>
  catchAsync(async (req, res, next) => {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;

    const {
      size,
      brand,
      category,
      subCategory,
      categoryPath,
      color,
      minPrice,
      maxPrice,
      maxStock,
      search,
      sort,
      isActive,
      drop,
      status, // drop status: active or archive
    } = req.query;

    const matchStage = {};

    if (isActive === "false") {
      matchStage.isActive = false;
    } else if (isActive === "all") {
      // no filter for active state
    } else {
      matchStage.isActive = true;
    }

    if (drop) {
      try {
        matchStage.drop = new mongoose.Types.ObjectId(drop); // FIX 1: added `new` keyword
      } catch (error) {
        return next(new AppError("Invalid drop id", 400));
      }
    }

    /* ========= Variant Size Filter ========= */
    if (size) {
      matchStage.variants = {
        $elemMatch: { size: { $in: size.split(",") } },
      };
    }

    /* ========= Brand / Category ========= */
    if (brand) matchStage.brand = brand;
    if (category) {
      const categoryValues = await resolveCategoryValues(category);
      if (categoryValues.length > 0) {
        matchStage.category = { $in: categoryValues };
      }
    }
    if (subCategory) {
      const subCategoryValues = await resolveCategoryValues(subCategory);
      if (subCategoryValues.length > 0) {
        matchStage.subCategory = { $in: subCategoryValues };
      }
    }
    if (categoryPath) {
      const normalizedPath = normalizeCategoryPath(categoryPath);
      if (normalizedPath) {
        matchStage.categoryPath = new RegExp(`^${escapeRegex(normalizedPath)}(?:/|$)`, "i");
      }
    }

    /* ========= Variant Color Filter ========= */
    // FIX 2: Merged size and color into a single $elemMatch to avoid overwriting
    if (color) {
      if (size) {
        matchStage.variants = {
          $elemMatch: { size: { $in: size.split(",") }, color },
        };
      } else {
        matchStage.variants = {
          $elemMatch: { color },
        };
      }
    }

    /* ========= Price Filter ========= */
    if (minPrice || maxPrice) {
      if (minPrice && isNaN(Number(minPrice))) {
        return next(new AppError("minPrice must be a number", 400));
      }
      if (maxPrice && isNaN(Number(maxPrice))) {
        return next(new AppError("maxPrice must be a number", 400));
      }
      matchStage.basePrice = {};
      if (minPrice) matchStage.basePrice.$gte = Number(minPrice);
      if (maxPrice) matchStage.basePrice.$lte = Number(maxPrice);
    }

    /* ========= Stock Ceiling Filter ========= */
    if (typeof maxStock !== "undefined" && maxStock !== "") {
      const parsedMaxStock = Number(maxStock);
      if (Number.isNaN(parsedMaxStock)) {
        return next(new AppError("maxStock must be a number", 400));
      }
      matchStage.totalStock = { $lte: parsedMaxStock };
    }

    /* ========= Search ========= */
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchStage.$or = [
        { artNo: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
        { name: { $regex: safeSearch, $options: "i" } },
      ];
    }

    /* ========= Sorting ========= */
    let sortStage = { createdAt: -1 };

    if (sort) {
      const field = sort.startsWith("-") ? sort.slice(1) : sort;
      sortStage = {
        [field]: sort.startsWith("-") ? -1 : 1,
      };
    }

    /* ========= Aggregation Pipeline ========= */
    // FIX 3: Changed `const data = await Model.aggregate([...];` to a proper `pipeline` array
    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "images",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$refId", "$$productId"] },
                    { $eq: ["$refModel", "Product"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            { $sort: { order: 1 } },
          ],
          as: "images",
        },
      },
      {
        $lookup: {
          from: "drops",
          localField: "drop",
          foreignField: "_id",
          as: "drop",
        },
      },
      {
        $unwind: {
          path: "$drop",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]; // FIX 4: Closed the array with `]` and `;` instead of `];` inside an incomplete expression

    /* ========= Status Filter (post-lookup) ========= */
    if (status === "active") {
      const now = new Date();
      pipeline.push({
        $match: {
          "drop.endDate": { $gt: now },
          "drop.releaseDate": { $lte: now },
        },
      });
    } else if (status === "archive") {
      const now = new Date();
      pipeline.push({
        $match: {
          $or: [
            { "drop.endDate": { $lte: now } },
            { drop: { $exists: false } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit }
    );

    const data = await Model.aggregate(pipeline); // FIX 5: Removed duplicate `const data` declaration

    /* ========= Total Count ========= */
    // FIX 6: For status-filtered results, run a separate count pipeline instead of using data.length
    let totalDocuments;
    if (status) {
      const countPipeline = [...pipeline];
      // Remove sort/skip/limit to get the true total
      countPipeline.splice(-3, 3);
      countPipeline.push({ $count: "total" });
      const countResult = await Model.aggregate(countPipeline);
      totalDocuments = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      totalDocuments = await Model.countDocuments(matchStage);
    }

    res.paginatedResults = buildPaginatedResults({
      data,
      totalDocuments,
      page,
      limit,
    });
    next();
  });

paginatedResult.adminUsers = (Model) =>
  catchAsync(async (req, res, next) => {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;
    const filter = buildAdminUserFilter(req.query);
    const sort = getAdminUserSort(req.query.sort);

    const [data, totalDocuments] = await Promise.all([
      Model.find(filter)
        .select(
          "email role provider profilePicture isVerified isActive membership tags adminNotes totalSpent orderCount lastOrderAt savedPaymentMethod cart wishlist addresses createdAt updatedAt"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(filter),
    ]);

    res.paginatedResults = buildPaginatedResults({
      data,
      totalDocuments,
      page,
      limit,
    });
    next();
  });

module.exports = paginatedResult;
