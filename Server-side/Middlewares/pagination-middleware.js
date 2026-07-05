const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Category = require("../Models/Category");
const slugify = require("slugify");
const { CUSTOMER_ACCOUNT_ROLES } = require("../Utils/admin-roles");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const buildAdminUserFilter = (query = {}) => {
  const filter = { role: { $in: CUSTOMER_ACCOUNT_ROLES } };
  const { search, status, role, membership } = query;

  if (search && String(search).trim()) {
    const safeSearch = escapeRegex(String(search).trim());
    filter.$or = [
      { email: { $regex: safeSearch, $options: "i" } },
      { username: { $regex: safeSearch, $options: "i" } },
      { phoneNumber: { $regex: safeSearch, $options: "i" } },
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

  if (role) {
    const normalizedRole = String(role).toLowerCase();
    if (normalizedRole !== "all" && CUSTOMER_ACCOUNT_ROLES.includes(normalizedRole)) {
      filter.role = normalizedRole;
    } else if (normalizedRole !== "all") {
      filter._id = null;
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

const splitCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const exactRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

const uniqueRegexes = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(exactRegex);
};

const findCategoryDocuments = async (value) => {
  const raw = String(value || "").trim();
  if (!raw) return [];

  if (mongoose.isValidObjectId(raw)) {
    const category = await Category.findById(raw)
      .select("_id slug name parentCategory")
      .lean();
    return category ? [category] : [];
  }

  const normalized = slugify(raw, { lower: true, strict: true });
  return Category.find({
    $or: [
      { slug: normalized },
      { name: { $regex: `^${escapeRegex(raw)}$`, $options: "i" } },
    ],
  })
    .select("_id slug name parentCategory")
    .lean();
};

const collectCategoriesWithDescendants = async (seedCategories = []) => {
  const byId = new Map();
  let frontier = seedCategories.filter(Boolean);

  while (frontier.length > 0) {
    const nextIds = [];
    frontier.forEach((category) => {
      const id = String(category._id);
      if (!byId.has(id)) {
        byId.set(id, category);
        nextIds.push(category._id);
      }
    });

    if (nextIds.length === 0) break;

    // eslint-disable-next-line no-await-in-loop
    frontier = await Category.find({ parentCategory: { $in: nextIds } })
      .select("_id slug name parentCategory")
      .lean();
  }

  return [...byId.values()];
};

const buildCategoryClauses = (rawValue, categories = []) => {
  const raw = String(rawValue || "").trim();
  const rawSlug = slugify(raw, { lower: true, strict: true });
  const values = new Set([raw, raw.toLowerCase(), rawSlug].filter(Boolean));
  const slugs = new Set([rawSlug].filter(Boolean));

  categories.forEach((category) => {
    if (category.name) values.add(category.name);
    if (category.slug) {
      values.add(category.slug);
      slugs.add(category.slug);
    }
  });

  const valueRegexes = uniqueRegexes([...values]);
  const pathRegexes = [...slugs].map(
    (slug) => new RegExp(`(^|/)${escapeRegex(slug)}(/|$)`, "i")
  );
  const ids = categories.map((category) => category._id).filter(Boolean);

  const clauses = [];
  if (ids.length > 0) clauses.push({ categoryId: { $in: ids } });
  if (valueRegexes.length > 0) {
    clauses.push({ category: { $in: valueRegexes } });
    clauses.push({ subCategory: { $in: valueRegexes } });
  }
  if (pathRegexes.length > 0) clauses.push({ categoryPath: { $in: pathRegexes } });

  return clauses;
};

const buildCategoryFilter = async ({ category, subCategory, categoryPath }) => {
  const andClauses = [];

  const normalizedPath = normalizeCategoryPath(categoryPath);
  if (normalizedPath) {
    andClauses.push({
      categoryPath: new RegExp(`^${escapeRegex(normalizedPath)}(?:/|$)`, "i"),
    });
  }

  if (category) {
    const seedCategories = await findCategoryDocuments(category);
    const categories = seedCategories.length
      ? await collectCategoriesWithDescendants(seedCategories)
      : [];
    const clauses = buildCategoryClauses(category, categories);
    if (clauses.length > 0) andClauses.push({ $or: clauses });
  }

  if (subCategory) {
    const seedCategories = await findCategoryDocuments(subCategory);
    const categories = seedCategories.length
      ? await collectCategoriesWithDescendants(seedCategories)
      : [];
    const clauses = buildCategoryClauses(subCategory, categories);
    if (clauses.length > 0) andClauses.push({ $or: clauses });
  }

  if (andClauses.length === 0) return null;
  return andClauses.length === 1 ? andClauses[0] : { $and: andClauses };
};

const addAndCondition = (matchStage, condition) => {
  if (!condition) return;
  if (!matchStage.$and) matchStage.$and = [];
  matchStage.$and.push(condition);
};

const listingPriceExpression = {
  $multiply: [
    { $ifNull: ["$basePrice", 0] },
    {
      $subtract: [
        1,
        {
          $divide: [
            { $ifNull: ["$discountPercent", 0] },
            100,
          ],
        },
      ],
    },
  ],
};

const paginatedResult = (Model) =>
  catchAsync(async (req, res, next) => {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const limit = parsePositiveInt(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;

    const {
      size,
      sizes,
      brand,
      brands,
      category,
      subCategory,
      categoryPath,
      color,
      colors,
      minPrice,
      min,
      maxPrice,
      max,
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

    const sizeValues = splitCsv(sizes || size);
    const colorValues = splitCsv(colors || color);
    const brandValues = splitCsv(brands || brand);
    const priceMinValue = minPrice ?? min;
    const priceMaxValue = maxPrice ?? max;

    /* ========= Brand / Category ========= */
    if (brandValues.length > 0) {
      matchStage.brand = { $in: uniqueRegexes(brandValues) };
    }

    const categoryFilter = await buildCategoryFilter({ category, subCategory, categoryPath });
    addAndCondition(matchStage, categoryFilter);

    /* ========= Variant Size / Color Filter ========= */
    if (sizeValues.length > 0 || colorValues.length > 0) {
      const variantMatch = {};
      if (sizeValues.length > 0) variantMatch.size = { $in: uniqueRegexes(sizeValues) };
      if (colorValues.length > 0) variantMatch.color = { $in: uniqueRegexes(colorValues) };
      matchStage.variants = { $elemMatch: variantMatch };
    }

    /* ========= Price Filter ========= */
    let priceFilter = null;
    if (priceMinValue || priceMaxValue) {
      if (priceMinValue && isNaN(Number(priceMinValue))) {
        return next(new AppError("minPrice must be a number", 400));
      }
      if (priceMaxValue && isNaN(Number(priceMaxValue))) {
        return next(new AppError("maxPrice must be a number", 400));
      }
      priceFilter = {};
      if (priceMinValue) priceFilter.$gte = Number(priceMinValue);
      if (priceMaxValue) priceFilter.$lte = Number(priceMaxValue);
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
      addAndCondition(matchStage, {
        $or: [
        { artNo: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { tags: { $regex: safeSearch, $options: "i" } },
        ],
      });
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
    const basePipeline = [];
    if (priceFilter) {
      basePipeline.push({ $addFields: { _listingPrice: listingPriceExpression } });
    }
    basePipeline.push({ $match: matchStage });
    if (priceFilter) {
      basePipeline.push({ $match: { _listingPrice: priceFilter } });
    }
    basePipeline.push(
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
    );

    /* ========= Status Filter (post-lookup) ========= */
    if (status === "active") {
      const now = new Date();
      basePipeline.push({
        $match: {
          "drop.endDate": { $gt: now },
          "drop.releaseDate": { $lte: now },
        },
      });
    } else if (status === "archive") {
      const now = new Date();
      basePipeline.push({
        $match: {
          $or: [
            { "drop.endDate": { $lte: now } },
            { drop: { $exists: false } },
          ],
        },
      });
    }

    const pipeline = [
      ...basePipeline,
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit }
    ];

    const data = await Model.aggregate(pipeline); // FIX 5: Removed duplicate `const data` declaration

    /* ========= Total Count ========= */
    const countPipeline = [...basePipeline, { $count: "total" }];
    const countResult = await Model.aggregate(countPipeline);
    const totalDocuments = countResult.length > 0 ? countResult[0].total : 0;

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
