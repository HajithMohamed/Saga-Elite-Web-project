const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Category = require("../Models/Category");
const slugify = require("slugify");

const normalizeSortValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeCategorySlugBase = (value) =>
  slugify(String(value || "").trim(), { lower: true, strict: true });

const buildScopedCategorySlug = async ({ name, slug, parentCategory }) => {
  const baseSlug = normalizeCategorySlugBase(slug || name);
  if (!parentCategory) return baseSlug;

  const parentId = typeof parentCategory === "object" ? parentCategory?._id || parentCategory : parentCategory;
  if (!parentId) return baseSlug;

  const parent = await Category.findById(parentId).select("slug").lean();
  return parent?.slug ? `${parent.slug}-${baseSlug}` : baseSlug;
};

const refreshDescendantSlugs = async (parentCategoryId, parentSlug) => {
  const children = await Category.find({ parentCategory: parentCategoryId }).select("_id name slug").lean();

  for (const child of children) {
    const childSlug = parentSlug ? `${parentSlug}-${normalizeCategorySlugBase(child.name)}` : normalizeCategorySlugBase(child.name);
    if (child.slug !== childSlug) {
      // eslint-disable-next-line no-await-in-loop
      await Category.updateOne({ _id: child._id }, { slug: childSlug });
    }
    // eslint-disable-next-line no-await-in-loop
    await refreshDescendantSlugs(child._id, childSlug);
  }
};

const sortCategoryNodes = (categories = []) =>
  [...categories]
    .sort(
      (a, b) =>
        normalizeSortValue(a.sortOrder) - normalizeSortValue(b.sortOrder) ||
        String(a.name || "").localeCompare(String(b.name || ""))
    )
    .map((category) => ({
      ...category,
      children: sortCategoryNodes(category.children || []),
    }));

const buildCategoryTree = (categories = []) => {
  const nodes = categories.map((category) => ({ ...category, children: [] }));
  const byId = new Map(nodes.map((category) => [String(category._id), category]));
  const roots = [];

  nodes.forEach((category) => {
    const parentId = category.parentCategory ? String(category.parentCategory) : null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(category);
    } else {
      roots.push(category);
    }
  });

  return sortCategoryNodes(roots);
};

const fetchCategorySubtree = async (parentId = null) => {
  const categories = await Category.find({ parentCategory: parentId, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const nextLevel = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      children: await fetchCategorySubtree(category._id),
    }))
  );

  return nextLevel;
};

const getMenu = catchAsync(async (req, res, next) => {
  const menu = await fetchCategorySubtree();

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

  const children = await fetchCategorySubtree(category._id);

  res.status(200).json({ success: true, data: { category: { ...category, children } } });
});

const getAll = catchAsync(async (req, res, next) => {
  const cats = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  res.status(200).json({ success: true, results: cats.length, data: cats });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name, parentCategory, slug, isFeatured, showOnHome, isActive, sortOrder, imageRef, meta } = req.body;
  if (!name) return next(new AppError("Category name is required", 400));

  const finalSlug = await buildScopedCategorySlug({ name, slug, parentCategory });

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
  const nextName = updates.name ? String(updates.name).trim() : category.name;
  const nextParentCategory = Object.prototype.hasOwnProperty.call(updates, "parentCategory")
    ? updates.parentCategory || null
    : category.parentCategory;
  const nextSlug = await buildScopedCategorySlug({
    name: nextName,
    slug: updates.slug || nextName,
    parentCategory: nextParentCategory,
  });

  if (nextSlug !== category.slug) {
    const duplicate = await Category.findOne({ slug: nextSlug, _id: { $ne: category._id } });
    if (duplicate) return next(new AppError("Category slug already exists", 400));
    updates.slug = nextSlug;
  }

  Object.assign(category, updates);
  await category.save();

  await refreshDescendantSlugs(category._id, category.slug);

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

