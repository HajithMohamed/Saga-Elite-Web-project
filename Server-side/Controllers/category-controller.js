const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Category = require("../Models/Category");
const slugify = require("slugify");

const getMenu = catchAsync(async (req, res, next) => {
  // Return top-level categories with their immediate children (two-level menu)
  const parents = await Category.find({ parentCategory: null, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const parentIds = parents.map((p) => p._id);
  const children = await Category.find({ parentCategory: { $in: parentIds }, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const childrenByParent = children.reduce((acc, ch) => {
    const pid = String(ch.parentCategory);
    acc[pid] = acc[pid] || [];
    acc[pid].push(ch);
    return acc;
  }, {});

  const menu = parents.map((p) => ({ ...p, children: childrenByParent[String(p._id)] || [] }));

  res.status(200).json({ success: true, results: menu.length, data: menu });
});

const getFeatured = catchAsync(async (req, res, next) => {
  const featured = await Category.find({ isFeatured: true, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  res.status(200).json({ success: true, results: featured.length, data: featured });
});

const getBySlug = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  if (!slug) return next(new AppError("Category slug is required", 400));

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return next(new AppError("Category not found", 404));

  const children = await Category.find({ parentCategory: category._id, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  res.status(200).json({ success: true, data: { category: { ...category, children } } });
});

const getAll = catchAsync(async (req, res, next) => {
  const cats = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  res.status(200).json({ success: true, results: cats.length, data: cats });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name, parentCategory, slug, isFeatured, showOnHome, isActive, sortOrder, imageRef, meta } = req.body;
  if (!name) return next(new AppError("Category name is required", 400));

  const finalSlug = slug && String(slug).trim().length > 0 ? slugify(String(slug), { lower: true, strict: true }) : slugify(String(name), { lower: true, strict: true });

  const exists = await Category.findOne({ slug: finalSlug });
  if (exists) return next(new AppError("Category slug already exists", 400));

  const created = await Category.create({
    name: String(name).trim(),
    slug: finalSlug,
    parentCategory: parentCategory || null,
    isFeatured: !!isFeatured,
    showOnHome: !!showOnHome,
    isActive: typeof isActive === "undefined" ? true : !!isActive,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    imageRef: imageRef || null,
    meta: meta || {},
  });

  res.status(201).json({ success: true, data: created });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new AppError("Category id is required", 400));

  const category = await Category.findById(id);
  if (!category) return next(new AppError("Category not found", 404));

  const updates = req.body || {};
  if (updates.slug) updates.slug = slugify(String(updates.slug), { lower: true, strict: true });

  Object.assign(category, updates);
  await category.save();

  res.status(200).json({ success: true, data: category });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new AppError("Category id is required", 400));

  const child = await Category.findOne({ parentCategory: id });
  if (child) return next(new AppError("Cannot delete category that has subcategories", 400));

  await Category.deleteOne({ _id: id });
  res.status(200).json({ success: true, message: "Category deleted" });
});

module.exports = {
  getMenu,
  getFeatured,
  getBySlug,
  getAll,
  createCategory,
  updateCategory,
  deleteCategory,
};

