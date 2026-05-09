const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image");
const Drop = require("../Models/Drop");
const UserActivityLog = require("../Models/UserActivityLog");
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
        // Per-user activity log for personalized recommendations
        UserActivityLog.create({
            userId: req.userInfo?._id || null,
            sessionId: req.sessionID || null,
            productId: product._id,
            action: "view",
            category: product.category || "",
        }).catch(() => {});
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
| Get Recommendations — personalized via UserActivityLog when authenticated
|--------------------------------------------------------------------------
*/
const ACTIVITY_WEIGHTS = { purchase: 5, cart_add: 3, wishlist_add: 2, view: 1 };
const ACTIVITY_WINDOW_DAYS = 60;

const buildTasteProfile = async (userId) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ACTIVITY_WINDOW_DAYS);
  const UserActivityLog = require("../Models/UserActivityLog");
  const logs = await UserActivityLog.find({
    userId,
    createdAt: { $gte: cutoff },
    action: { $in: ["view", "wishlist_add", "cart_add", "purchase"] },
  })
    .select("productId action category")
    .lean();

  if (logs.length === 0) return null;

  const categoryWeights = {};
  const productWeights = {};
  for (const log of logs) {
    const w = ACTIVITY_WEIGHTS[log.action] || 1;
    if (log.category) categoryWeights[log.category] = (categoryWeights[log.category] || 0) + w;
    productWeights[String(log.productId)] = (productWeights[String(log.productId)] || 0) + w;
  }
  const topCategories = Object.entries(categoryWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  const purchasedIds = logs
    .filter((l) => l.action === "purchase")
    .map((l) => String(l.productId));

  return { topCategories, productWeights, purchasedIds };
};

const scoreCandidate = (product, profile, maxSold) => {
  const categoryMatch = profile.topCategories.includes(product.category) ? 1 : 0;
  const popularity = maxSold > 0 ? (product.soldCount || 0) / maxSold : 0;
  const ageDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 1 - ageDays / 90);
  return 0.55 * categoryMatch + 0.25 * popularity + 0.2 * recency;
};

const getRecommendations = catchAsync(async (req, res, next) => {
  const { productId, context = "home" } = req.query;
  const userId = req.userInfo?.id || req.userInfo?._id || null;
  const limit = Math.min(Number(req.query.limit) || 12, 24);

  // Product-context: keep existing same-category logic but mix in personalization
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) return next(new AppError("Product not found", 404));

    const recommendations = await Product.find({
      $or: [
        { _id: { $in: product.relatedProductIds || [] } },
        { category: product.category, _id: { $ne: product._id } },
      ],
      isActive: true,
    })
      .limit(limit)
      .populate("images");

    return res.status(200).json({
      status: "success",
      results: recommendations.length,
      data: { recommendations, mode: "contextual" },
    });
  }

  // Personalized for authenticated users with on-site activity
  if (userId) {
    const profile = await buildTasteProfile(userId);
    if (profile && profile.topCategories.length > 0) {
      const candidatePool = await Product.find({
        isActive: true,
        category: { $in: profile.topCategories },
        _id: { $nin: profile.purchasedIds },
      })
        .limit(80)
        .populate("images")
        .lean();

      if (candidatePool.length > 0) {
        const maxSold = Math.max(...candidatePool.map((p) => p.soldCount || 0), 1);
        candidatePool.forEach((p) => {
          p._score = scoreCandidate(p, profile, maxSold);
        });
        candidatePool.sort((a, b) => b._score - a._score);
        const personalized = candidatePool.slice(0, Math.max(1, limit - 2));

        // Mix in 2 explore picks outside the profile (avoid filter bubble)
        const explorePool = await Product.find({
          isActive: true,
          category: { $nin: profile.topCategories },
          _id: { $nin: [...profile.purchasedIds, ...personalized.map((p) => p._id)] },
        })
          .sort({ soldCount: -1, createdAt: -1 })
          .limit(2)
          .populate("images")
          .lean();

        const mixed = [...personalized, ...explorePool].slice(0, limit);
        return res.status(200).json({
          status: "success",
          results: mixed.length,
          data: { recommendations: mixed, mode: "personalized" },
        });
      }
    }
  }

  // Cold-start / anonymous: trending across all categories
  const trending = await Product.find({ isActive: true })
    .sort({ soldCount: -1, viewCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("images");

  res.status(200).json({
    status: "success",
    results: trending.length,
    data: { recommendations: trending, mode: "trending" },
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
