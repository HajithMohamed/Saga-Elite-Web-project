const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image");
const Drop = require("../Models/Drop");
const mongoose = require("mongoose");
const cloudinary = require("../Config/cloudinary-config");
const filterObj = require("../Utils/filter-object");
const { broadcastNotification } = require("../Utils/notification-service");

const ADMIN_ROLES = new Set(["admin", "super_admin", "superadmin", "sub_admin"]);
const isAdminUser = (user) => Boolean(user && ADMIN_ROLES.has(user.role));


/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

const getAllProducts = catchAsync(async (req, res, next) => {
    const isAdmin = isAdminUser(req.userInfo);

    // Safety: Strip costPrice for non-admins if present in paginated results
    if (!isAdmin && res.paginatedResults && res.paginatedResults.data) {
        res.paginatedResults.data = res.paginatedResults.data.map(p => {
            const productObj = p.toObject ? p.toObject({ virtuals: true }) : { ...p };
            delete productObj.costPrice;
            return productObj;
        });
    }

    res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        ...res.paginatedResults
    });
});


/*
|--------------------------------------------------------------------------
| Get Single Product (with images)
|--------------------------------------------------------------------------
*/

const getSingleProduct = catchAsync(async (req, res, next) => {
    const productSlug = req.params.slug;

    if (!productSlug) {
        return next(new AppError("Product slug is required", 400));
    }

    const productQuery = mongoose.Types.ObjectId.isValid(productSlug)
        ? { _id: productSlug }
        : { slug: productSlug };

    const product = await Product.findOne(productQuery)
        .populate('images')
        .populate('drop', 'name slug releaseDate endDate');

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const isAdmin = isAdminUser(req.userInfo);
    let productResponse = product.toObject({ virtuals: true });

    if (!isAdmin) {
        delete productResponse.costPrice;
        // Fire-and-forget viewCount increment (only for non-admin reads)
        Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).catch(() => {});
    }

    res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        product: productResponse
    });
});


/*
|--------------------------------------------------------------------------
| Add Product (Only Product Data)
|--------------------------------------------------------------------------
*/

const addProduct = catchAsync(async (req, res, next) => {
    const productData = filterObj(
        req.body,
        "name",
        "artNo",
        "description",
        "brand",
        "category",
        "categoryPath",
        "tags",
        "relatedProductIds",
        "trendScore",
        "isDeal",
        "dealEndsAt",
        "drop",
        "basePrice",
        "originalPrice",
        "salePrice",
        "discountPercent",
        "costPrice",
        "isFeatured",
        "isLimited",
        "isActive",
        "maxPerUser",
        "variants"
    );

    if (Object.keys(productData).length === 0) {
        return next(new AppError("All fields are required", 400));
    }

    // Drop is optional. Products without a drop fall back to "Independent Release".
    if (productData.drop) {
        if (!mongoose.isValidObjectId(productData.drop)) {
            return next(new AppError("Invalid drop id", 400));
        }
        const dropExists = await Drop.exists({ _id: productData.drop });
        if (!dropExists) {
            return next(new AppError("Drop not found", 404));
        }
    } else {
        productData.drop = null;
    }

    const existingProduct = await Product.findOne({ artNo: productData.artNo });

    if (existingProduct) {
        return next(new AppError("Product with this Art No already exists", 400));
    }

    const newlyCreatedProduct = await Product.create(productData);

    if (newlyCreatedProduct.discountPercent > 0 || newlyCreatedProduct.isFeatured) {
        await broadcastNotification({
            type: "offer",
            title: `Special offer: ${newlyCreatedProduct.name}`,
            message: `${newlyCreatedProduct.name} is now available with a special offer. Check it out before it ends!`,
            entityRef: newlyCreatedProduct._id,
            entityType: "Product",
            meta: { productSlug: newlyCreatedProduct.slug, discountPercent: newlyCreatedProduct.discountPercent },
            filter: { isActive: true },
        });
    }

    res.status(201).json({
        success: true,
        message: "New product added successfully",
        product: newlyCreatedProduct
    });
});


/*
|--------------------------------------------------------------------------
| Update Product (find-then-save to trigger hooks for slug/totalStock)
|--------------------------------------------------------------------------
*/

const updateProduct = catchAsync(async (req, res, next) => {
    const productSlug = req.params.slug;

    if (!productSlug) {
        return next(new AppError("Product slug is required", 400));
    }

    const allowedFields = [
        "name",
        "description",
        "brand",
        "category",
        "categoryPath",
        "tags",
        "relatedProductIds",
        "trendScore",
        "isDeal",
        "dealEndsAt",
        "drop",
        "basePrice",
        "originalPrice",
        "salePrice",
        "discountPercent",
        "costPrice",
        "isFeatured",
        "isActive",
        "maxPerUser",
        "isLimited",
        "variants"
    ];

    const productData = filterObj(req.body, ...allowedFields);

    if (Object.keys(productData).length === 0) {
        return next(new AppError("At least one field is required to update", 400));
    }

    // Validate Drop only if being attached. Allow detaching to standalone via "" / null.
    if (Object.prototype.hasOwnProperty.call(productData, "drop")) {
        if (productData.drop) {
            if (!mongoose.isValidObjectId(productData.drop)) {
                return next(new AppError("Invalid drop id", 400));
            }
            const dropExists = await Drop.exists({ _id: productData.drop });
            if (!dropExists) {
                return next(new AppError("Drop not found", 404));
            }
        } else {
            productData.drop = null;
        }
    }

    const product = await Product.findOne({ slug: productSlug });

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const shouldNotifyOffer =
        (typeof productData.discountPercent !== "undefined" && product.discountPercent === 0 && productData.discountPercent > 0) ||
        (typeof productData.isFeatured !== "undefined" && !product.isFeatured && productData.isFeatured === true);

    // Apply updates to the document
    Object.assign(product, productData);

    // save() triggers pre-save hooks (slug regen, totalStock recalc)
    await product.save({ validateModifiedOnly: true });

    if (shouldNotifyOffer) {
        const headline = productData.discountPercent > 0
            ? `Special offer: ${product.name}`
            : `Featured now: ${product.name}`;

        const details = product.discountPercent > 0
            ? `${product.name} now has a ${product.discountPercent}% discount.`
            : `${product.name} is now featured in the collection.`;

        await broadcastNotification({
            type: "offer",
            title: headline,
            message: details,
            entityRef: product._id,
            entityType: "Product",
            meta: { productSlug: product.slug, discountPercent: product.discountPercent },
            filter: { isActive: true },
        });
    }

    const io = req.app.get("io");
    if (io) {
        io.emit("product:updated", {
            productId: product._id,
            slug: product.slug,
            price: product.basePrice,
            discount: product.discountPercent,
            basePrice: product.basePrice,
            discountPercent: product.discountPercent,
            variants: product.variants,
            drop: product.drop,
        });
    }

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
    });
});


/*
|--------------------------------------------------------------------------
| Get Admin Analytics 
|--------------------------------------------------------------------------
*/

const getAdminAnalytics = catchAsync(async (req, res, next) => {
    // Fetch Best Sellers (Top 5 Checkout)
    const bestSellers = await Product.find({ soldCount: { $gt: 0 } })
        .sort({ soldCount: -1 })
        .limit(5)
        .select("name soldCount brand category artNo slug");

    // Fetch Most Wished (Top 5 Wishlisted)
    const mostWished = await Product.find({ wishCount: { $gt: 0 } })
        .sort({ wishCount: -1 })
        .limit(5)
        .select("name wishCount soldCount brand category artNo slug");

    res.status(200).json({
        success: true,
        message: "Analytics fetched successfully",
        analytics: {
            bestSellers,
            mostWished
        }
    });
});


/*
|--------------------------------------------------------------------------
| Get Aging Products (HTTP twin of aging-stock-job.js)
|--------------------------------------------------------------------------
*/

const getAgingProducts = catchAsync(async (req, res) => {
    const countOnly = String(req.query.countOnly || "").toLowerCase() === "true";
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const agingProducts = await Product.find({
        isActive: true,
        $or: [
            { lastSoldAt: { $lte: ninetyDaysAgo } },
            { lastSoldAt: null, createdAt: { $lte: ninetyDaysAgo } },
        ],
    })
        .select("name slug artNo basePrice salePrice costPrice totalStock variants soldCount lastSoldAt createdAt drop")
        .populate("drop", "name slug")
        .lean();

    const productsWithStock = agingProducts.filter((p) => {
        if (typeof p.totalStock === "number" && p.totalStock > 0) return true;
        if (!Array.isArray(p.variants)) return false;
        return p.variants.some((v) => (v?.stock || 0) > 0);
    });

    if (countOnly) {
        return res.status(200).json({
            success: true,
            data: { count: productsWithStock.length },
        });
    }

    const enriched = productsWithStock.map((p) => {
        const referenceDate = p.lastSoldAt || p.createdAt;
        const daysUnsold = referenceDate
            ? Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24))
            : null;
        return {
            ...p,
            daysUnsold,
            dropName: p.drop?.name || "Independent Release",
        };
    });

    res.status(200).json({
        success: true,
        data: {
            count: enriched.length,
            products: enriched,
        },
    });
});


/*
|--------------------------------------------------------------------------
| Get Product Analytics (per-product counters for the admin editor)
|--------------------------------------------------------------------------
*/

const getProductAnalytics = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const productQuery = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { slug: id };

    const product = await Product.findOne(productQuery)
        .select("name slug viewCount cartAddCount wishCount soldCount totalStock lastSoldAt")
        .lean();

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const conversionRate = product.viewCount > 0
        ? Number(((product.soldCount || 0) / product.viewCount).toFixed(4))
        : 0;

    res.status(200).json({
        success: true,
        data: {
            productId: product._id,
            slug: product.slug,
            name: product.name,
            viewCount: product.viewCount || 0,
            cartAddCount: product.cartAddCount || 0,
            wishCount: product.wishCount || 0,
            soldCount: product.soldCount || 0,
            totalStock: product.totalStock || 0,
            lastSoldAt: product.lastSoldAt,
            conversionRate,
        },
    });
});

const getLandingProducts = catchAsync(async (req, res) => {
    const { category, tag, isDeal, hasDeal, limit = 8 } = req.query;
    const filter = { isActive: true };

    if (category) {
        filter.category = new RegExp(`^${String(category)}$`, "i");
    }
    if (tag) {
        filter.tags = { $in: [String(tag)] };
    }
    if (typeof isDeal !== "undefined") {
        filter.isDeal = String(isDeal) === "true";
    }
    if (typeof hasDeal !== "undefined") {
        filter.isDeal = String(hasDeal) === "true";
    }

    const products = await Product.find(filter)
        .sort({ arrivedAt: -1, createdAt: -1 })
        .limit(Math.max(1, Number(limit) || 8))
        .populate("images")
        .populate("relatedProductIds", "name slug category basePrice salePrice");

    res.status(200).json({
        success: true,
        results: products.length,
        data: products,
    });
});


/*
|--------------------------------------------------------------------------
| Delete Product (with image cleanup & transaction)
|--------------------------------------------------------------------------
*/


const deleteProduct = catchAsync(async (req, res, next) => {
    const productSlug = req.params.slug;

    if (!productSlug) {
        return next(new AppError("Product slug is required", 400));
    }

    const product = await Product.findOne({ slug: productSlug });

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const productImages = await Image.find({
        refId: product._id,
        refModel: "Product"
    });

    // Use transaction for atomicity
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await Image.deleteMany({
                refId: product._id,
                refModel: "Product"
            }).session(session);

            await Product.deleteOne({ _id: product._id }).session(session);
        });
    } finally {
        session.endSession();
    }

    // Cloudinary cleanup (best-effort, after DB commit)
    if (productImages.length > 0) {
        const cloudinaryDeletes = productImages.map((image) =>
            cloudinary.uploader.destroy(image.publicId)
        );
        await Promise.allSettled(cloudinaryDeletes);
    }

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        deletedProductSlug: productSlug,
        deletedImagesCount: productImages.length
    });
});

/*
|--------------------------------------------------------------------------
| Get Recommendations
|--------------------------------------------------------------------------
*/
const getRecommendations = catchAsync(async (req, res, next) => {
  const { productId, userId } = req.query;
  let recommendations = [];

  if (productId) {
    // Contextual: find products in the same category or via relatedProductIds
    const product = await Product.findById(productId);
    if (!product) return next(new AppError("Product not found", 404));

    // Combine related products and same category
    recommendations = await Product.find({
      $or: [
        { _id: { $in: product.relatedProductIds } },
        { category: product.category, _id: { $ne: product._id } }
      ],
      isActive: true
    }).limit(10).populate("images");

  } else {
    // Fallback: Trending / Bestsellers
    recommendations = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(10)
      .populate("images");
  }

  res.status(200).json({
    status: "success",
    results: recommendations.length,
    data: { recommendations },
  });
});

/*
|--------------------------------------------------------------------------
| Instant / Full Search
|--------------------------------------------------------------------------
*/
const searchProducts = catchAsync(async (req, res, next) => {
  const { q, limit = 10, page = 1 } = req.query;
  if (!q) return next(new AppError("Search query is required", 400));

  const skip = (page - 1) * limit;

  // MongoDB text search
  const products = await Product.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate("images");

  const total = await Product.countDocuments({ $text: { $search: q }, isActive: true });

  res.status(200).json({
    status: "success",
    results: products.length,
    total,
    data: { products },
  });
});

module.exports = {
    getAllProducts,
    getLandingProducts,
    getSingleProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    getAdminAnalytics,
    getAgingProducts,
    getProductAnalytics,
    getRecommendations,
    searchProducts,
};
