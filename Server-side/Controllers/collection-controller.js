const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Collection = require("../Models/Collection");
const Product = require("../Models/Product");
const filterObj = require("../Utils/filter-object");

const COLLECTION_FIELDS = [
  "name",
  "description",
  "bannerImageUrl",
  "products",
  "isActive",
  "isFeatured",
  "displayOrder",
];

/*
|--------------------------------------------------------------------------
| Public — list active collections (homepage / collection index)
|--------------------------------------------------------------------------
*/
const listPublicCollections = catchAsync(async (req, res) => {
  const filter = { isActive: true };
  if (String(req.query.featured || "").toLowerCase() === "true") {
    filter.isFeatured = true;
  }

  const collections = await Collection.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .populate("products", "name slug artNo basePrice salePrice discountPercent")
    .lean();

  res.status(200).json({
    success: true,
    data: { collections, count: collections.length },
  });
});

/*
|--------------------------------------------------------------------------
| Public — fetch a single active collection by slug
|--------------------------------------------------------------------------
*/
const getPublicCollectionBySlug = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const collection = await Collection.findOne({ slug, isActive: true })
    .populate({
      path: "products",
      match: { isActive: true },
      select:
        "name slug artNo description basePrice salePrice discountPercent variants totalStock images",
      populate: { path: "images" },
    })
    .lean();

  if (!collection) {
    return next(new AppError("Collection not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { collection },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — list all collections (including inactive)
|--------------------------------------------------------------------------
*/
const listAdminCollections = catchAsync(async (_req, res) => {
  const collections = await Collection.find()
    .sort({ displayOrder: 1, createdAt: -1 })
    .populate("products", "name slug artNo basePrice salePrice")
    .populate("createdBy", "email")
    .lean();

  res.status(200).json({
    success: true,
    data: { collections, count: collections.length },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — create
|--------------------------------------------------------------------------
*/
const createCollection = catchAsync(async (req, res, next) => {
  const data = filterObj(req.body, ...COLLECTION_FIELDS);

  if (!data.name) {
    return next(new AppError("Collection name is required", 400));
  }

  if (Array.isArray(data.products) && data.products.length > 0) {
    const invalid = data.products.find(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalid) {
      return next(new AppError(`Invalid product id: ${invalid}`, 400));
    }
    const count = await Product.countDocuments({
      _id: { $in: data.products },
    });
    if (count !== data.products.length) {
      return next(new AppError("One or more products do not exist", 400));
    }
  }

  data.createdBy = req.userInfo?._id || req.userInfo?.id || null;

  const collection = await Collection.create(data);
  const populated = await Collection.findById(collection._id)
    .populate("products", "name slug artNo basePrice salePrice")
    .lean();

  res.status(201).json({
    success: true,
    message: "Collection created",
    data: { collection: populated },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — update (general fields + product reorder via products array order)
|--------------------------------------------------------------------------
*/
const updateCollection = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid collection id", 400));
  }

  const update = filterObj(req.body, ...COLLECTION_FIELDS);

  if (Array.isArray(update.products) && update.products.length > 0) {
    const invalid = update.products.find(
      (pid) => !mongoose.Types.ObjectId.isValid(pid)
    );
    if (invalid) {
      return next(new AppError(`Invalid product id: ${invalid}`, 400));
    }
  }

  // Trigger pre-save hook for slug regen on name change.
  const collection = await Collection.findById(id);
  if (!collection) {
    return next(new AppError("Collection not found", 404));
  }

  Object.assign(collection, update);
  await collection.save({ validateModifiedOnly: true });

  const populated = await Collection.findById(collection._id)
    .populate("products", "name slug artNo basePrice salePrice")
    .lean();

  res.status(200).json({
    success: true,
    message: "Collection updated",
    data: { collection: populated },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — reorder collections (top-level display order)
|--------------------------------------------------------------------------
*/
const reorderCollections = catchAsync(async (req, res, next) => {
  const { orders } = req.body;
  if (!Array.isArray(orders) || orders.length === 0) {
    return next(new AppError("orders must be a non-empty array", 400));
  }

  const ops = orders
    .filter(
      (entry) =>
        entry &&
        mongoose.Types.ObjectId.isValid(entry.id) &&
        Number.isFinite(Number(entry.displayOrder))
    )
    .map((entry) => ({
      updateOne: {
        filter: { _id: entry.id },
        update: { $set: { displayOrder: Number(entry.displayOrder) } },
      },
    }));

  if (ops.length === 0) {
    return next(new AppError("No valid order entries provided", 400));
  }

  await Collection.bulkWrite(ops);

  res.status(200).json({
    success: true,
    message: "Collections reordered",
    data: { count: ops.length },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — delete
|--------------------------------------------------------------------------
*/
const deleteCollection = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid collection id", 400));
  }

  const collection = await Collection.findByIdAndDelete(id);
  if (!collection) {
    return next(new AppError("Collection not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Collection deleted",
    data: { id },
  });
});

module.exports = {
  listPublicCollections,
  getPublicCollectionBySlug,
  listAdminCollections,
  createCollection,
  updateCollection,
  reorderCollections,
  deleteCollection,
};
