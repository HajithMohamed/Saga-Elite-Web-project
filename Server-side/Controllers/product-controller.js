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
const { emitToAll } = require("../Utils/socket-service");

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
        "story",
        "fabric",
        "gsm",
        "fitType",
        "careInstructions",
        "sizeGuide",
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

    // Real-time emit (Fix #3) so listing pages refetch.
    emitToAll("product:created", {
        productId: newlyCreatedProduct._id,
        slug: newlyCreatedProduct.slug,
        name: newlyCreatedProduct.name,
        drop: newlyCreatedProduct.drop,
    });

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
        "story",
        "fabric",
        "gsm",
        "fitType",
        "careInstructions",
        "sizeGuide",
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

    // Real-time emit (Fix #3) so listing/detail pages can react.
    emitToAll("product:deleted", {
        productId: product._id,
        slug: productSlug,
    });

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
const ACTIVITY_WEIGHTS = {
  purchase: 5,
  cart_add: 3,
  wishlist_add: 2,
  dwell: 2, // weight scaled by dwellSeconds inside buildTasteProfile
  search: 1.5,
  view: 1,
};
const ACTIVITY_WINDOW_DAYS = 60;
const STOPWORDS = new Set(["the", "a", "an", "and", "or", "for", "with", "of", "in", "on", "to", "my", "your"]);

const tokenizeQuery = (q) =>
  String(q || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t && t.length > 2 && !STOPWORDS.has(t));

const buildTasteProfile = async (userId) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ACTIVITY_WINDOW_DAYS);
  const UserActivityLog = require("../Models/UserActivityLog");
  const logs = await UserActivityLog.find({
    userId,
    createdAt: { $gte: cutoff },
  })
    .select("productId action category metadata")
    .lean();

  if (logs.length === 0) return null;

  const categoryWeights = {};
  const productWeights = {};
  const keywordCounts = {};

  for (const log of logs) {
    let weight = ACTIVITY_WEIGHTS[log.action] || 0;
    if (log.action === "dwell") {
      // Scale dwell weight by seconds (capped). 30s+ ≈ same as a wishlist_add.
      const seconds = Number(log.metadata?.dwellSeconds || 0);
      weight = Math.min(5, ACTIVITY_WEIGHTS.dwell * (seconds / 30));
    }
    if (log.action === "search") {
      tokenizeQuery(log.metadata?.query).forEach((kw) => {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      });
    }
    if (weight <= 0) continue;
    if (log.category) categoryWeights[log.category] = (categoryWeights[log.category] || 0) + weight;
    if (log.productId) {
      productWeights[String(log.productId)] = (productWeights[String(log.productId)] || 0) + weight;
    }
  }

  const topCategories = Object.entries(categoryWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  const purchasedIds = logs
    .filter((l) => l.action === "purchase" && l.productId)
    .map((l) => String(l.productId));

  return { topCategories, productWeights, purchasedIds, topKeywords };
};

const scoreCandidate = (product, profile, maxSold) => {
  const categoryMatch = profile.topCategories.includes(product.category) ? 1 : 0;
  const popularity = maxSold > 0 ? (product.soldCount || 0) / maxSold : 0;
  const ageDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 1 - ageDays / 90);
  // Keyword bonus: 0..1, fraction of user's top keywords found in product name/tags
  let keywordBonus = 0;
  if (profile.topKeywords?.length) {
    const haystack = `${product.name || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
    const hits = profile.topKeywords.filter((kw) => haystack.includes(kw)).length;
    keywordBonus = hits / profile.topKeywords.length;
  }
  return 0.4 * categoryMatch + 0.2 * popularity + 0.15 * recency + 0.25 * keywordBonus;
};

const getRecommendations = catchAsync(async (req, res, next) => {
  const { productId, context = "home" } = req.query;
  const userId = req.userInfo?.id || req.userInfo?._id || null;
  const limit = Math.min(Number(req.query.limit) || 12, 24);

  // Recently viewed — last N distinct products this user looked at
  if (context === "recently-viewed") {
    if (!userId) {
      return res.status(200).json({ status: "success", results: 0, data: { recommendations: [], mode: "recently-viewed" } });
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ACTIVITY_WINDOW_DAYS);
    const viewed = await UserActivityLog.find({
      userId,
      action: "view",
      productId: { $ne: null },
      createdAt: { $gte: cutoff },
    })
      .sort({ createdAt: -1 })
      .limit(80)
      .select("productId createdAt")
      .lean();

    const seen = new Set();
    const orderedIds = [];
    for (const row of viewed) {
      const key = String(row.productId);
      if (seen.has(key)) continue;
      seen.add(key);
      orderedIds.push(row.productId);
      if (orderedIds.length >= limit) break;
    }
    if (orderedIds.length === 0) {
      return res.status(200).json({ status: "success", results: 0, data: { recommendations: [], mode: "recently-viewed" } });
    }
    const products = await Product.find({ _id: { $in: orderedIds }, isActive: true }).populate("images").lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const ordered = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
    return res.status(200).json({
      status: "success",
      results: ordered.length,
      data: { recommendations: ordered, mode: "recently-viewed" },
    });
  }

  // Trending in user's top category
  if (context === "trending-style") {
    if (!userId) {
      return res.status(200).json({ status: "success", results: 0, data: { recommendations: [], mode: "trending-style" } });
    }
    const profile = await buildTasteProfile(userId);
    if (!profile || profile.topCategories.length === 0) {
      return res.status(200).json({ status: "success", results: 0, data: { recommendations: [], mode: "trending-style" } });
    }
    const products = await Product.find({
      isActive: true,
      category: profile.topCategories[0],
      _id: { $nin: profile.purchasedIds },
    })
      .sort({ soldCount: -1, viewCount: -1, createdAt: -1 })
      .limit(limit)
      .populate("images")
      .lean();
    return res.status(200).json({
      status: "success",
      results: products.length,
      data: { recommendations: products, mode: "trending-style", category: profile.topCategories[0] },
    });
  }

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

  // Log the search as a personalization signal (fire-and-forget)
  UserActivityLog.create({
    userId: req.userInfo?._id || req.userInfo?.id || null,
    sessionId: req.sessionID || null,
    action: "search",
    metadata: { query: String(q).slice(0, 200), resultCount: total },
  }).catch(() => {});

  res.status(200).json({
    status: "success",
    results: products.length,
    total,
    data: { products },
  });
});

/* Dwell-time beacon — fire-and-forget personalization signal */
const recordDwell = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError("Invalid product id", 400));
  }
  const seconds = Number(req.body?.seconds);
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > 600) {
    // Quietly accept — beacons can't get useful errors back
    return res.status(204).end();
  }
  const product = await Product.findById(productId).select("category").lean();
  if (!product) return res.status(204).end();

  UserActivityLog.create({
    userId: req.userInfo?._id || req.userInfo?.id || null,
    sessionId: req.sessionID || null,
    productId,
    action: "dwell",
    category: product.category || "",
    metadata: { dwellSeconds: Math.round(seconds) },
  }).catch(() => {});

  res.status(204).end();
});

// Bulk activate/deactivate/delete. Body is pre-validated by validateBulkProductAction.
// All-or-nothing semantics — Mongo updateMany / deleteMany either succeeds for the
// matched set or fails outright, so `failed` is always [] here.
const bulkUpdateProducts = catchAsync(async (req, res) => {
  const { ids, action } = req.body;
  let result;
  let verb;

  if (action === "activate" || action === "deactivate") {
    const isActive = action === "activate";
    result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );
    verb = isActive ? "activated" : "deactivated";
  } else {
    result = await Product.deleteMany({ _id: { $in: ids } });
    verb = "deleted";
  }

  const matched = result.matchedCount ?? result.deletedCount ?? 0;
  const succeededCount =
    action === "delete" ? result.deletedCount || 0 : result.modifiedCount || 0;

  req.adminAction = `Bulk ${verb} (${succeededCount} product${succeededCount === 1 ? "" : "s"})`;
  req.adminDetails = {
    total: ids.length,
    succeededCount,
    failedCount: ids.length - succeededCount,
    ids,
    matched,
  };

  res.status(200).json({
    success: true,
    total: ids.length,
    succeeded: ids.slice(0, succeededCount),
    failed: ids.slice(succeededCount).map((id) => ({
      id,
      reason: "not found or already in target state",
    })),
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
    recordDwell,
    bulkUpdateProducts,
};
