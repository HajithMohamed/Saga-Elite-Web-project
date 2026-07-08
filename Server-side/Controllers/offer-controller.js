const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Offer = require("../Models/Offer");
const Product = require("../Models/Product");
const Customer = require("../Models/Customer");
const filterObj = require("../Utils/filter-object");
const { emitToAll } = require("../Utils/socket-service");
const {
  DEFAULT_FLASH_DEAL_CLASSIFICATION_DISCOUNTS,
  getFlashDealCustomerClassification,
  getFlashDealDiscountForCustomer,
  normalizeDiscountMap,
} = require("../Utils/reward-service");

const PRODUCT_IMAGE_POPULATE = {
  path: "images",
  select: "url altText colorTag order isPrimary",
  options: { sort: { isPrimary: -1, order: 1, createdAt: 1 } },
};

const PUBLIC_PRODUCT_SELECT =
  "name slug artNo brand category subCategory categoryPath basePrice originalPrice salePrice discountPercent variants totalStock isLimited soldCount wishCount createdAt";

const ADMIN_PRODUCT_SELECT =
  "name slug artNo basePrice salePrice costPrice discountPercent totalStock";

const OFFER_FIELDS = [
  "name",
  "badgeText",
  "description",
  "type",
  "discountPercent",
  "discountAmount",
  "minCartValue",
  "triggerProduct",
  "rewardProduct",
  "rewardQuantity",
  "triggerQuantity",
  "products",
  "applicableCategories",
  "excludedProducts",
  "excludedCategories",
  "maxApplicationsPerUser",
  "maxApplicationsTotal",
  "bannerImage",
  "themeColor",
  "campaignLandingPage",
  "startsAt",
  "endsAt",
  "showOnHomepage",
  "displayOrder",
  "isActive",
  "appliesToLeastSellingItems",
  "estimatedMarginAfterDiscount",
  "customerClassificationDiscounts",
];

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCategorySlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildCategoryConditions = (categories = []) =>
  categories
    .map((category) => String(category || "").trim())
    .filter(Boolean)
    .flatMap((category) => {
      const escapedCategory = escapeRegex(category);
      const categorySlug = normalizeCategorySlug(category);
      const conditions = [
        { category: new RegExp(`^${escapedCategory}$`, "i") },
      ];

      if (categorySlug) {
        conditions.push({
          categoryPath: new RegExp(`^${escapeRegex(categorySlug)}(?:/|$)`, "i"),
        });
      }

      return conditions;
    });

const mergeOfferProducts = (offer, categoryProducts = []) => {
  const seen = new Set();
  const products = [];

  [...(offer.products || []), ...categoryProducts].forEach((product) => {
    const key = String(product?._id || product?.id || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    products.push(product);
  });

  return { ...offer, products };
};

const getStockedActiveProductFilter = () => ({
  isActive: true,
  $or: [{ totalStock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }],
});

const getLeastSellingProductIds = async () => {
  const stockFilter = getStockedActiveProductFilter();

  const products = await Product.find(stockFilter)
    .sort({ soldCount: 1, createdAt: -1 })
    .limit(3)
    .select("_id")
    .lean();

  return products.map((product) => product._id);
};

const isFlashDealsOffer = (offer = {}) =>
  offer.type === "flash" ||
  Boolean(offer.appliesToLeastSellingItems) ||
  String(offer.name || "").trim().toLowerCase() === "flash deals";

const formatCampaignType = (type = "") =>
  String(type || "Offer")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizePublicOffer = (offer, { customer = null, user = null } = {}) => {
  const isFlashDeal = isFlashDealsOffer(offer);
  const context = { customer, user };
  const classification = isFlashDeal
    ? getFlashDealCustomerClassification(context)
    : null;
  const classificationDiscounts = normalizeDiscountMap(
    offer.customerClassificationDiscounts,
    offer.discountPercent
  );
  const discountPercent = isFlashDeal
    ? getFlashDealDiscountForCustomer(context, classificationDiscounts)
    : Number(offer.discountPercent || 0);

  return {
    ...offer,
    title: offer.title || offer.name,
    campaignType: isFlashDeal ? "Flash Deals" : formatCampaignType(offer.type),
    categories: offer.applicableCategories || [],
    endDate: offer.endsAt || null,
    discountPercent,
    discountPercentage: discountPercent,
    ...(isFlashDeal
      ? {
          customerClassification: classification,
          customerClassificationDiscounts: classificationDiscounts,
          customerSegment: classification,
          customerSegmentDiscounts: classificationDiscounts,
          leastSellingDeal: true,
        }
      : {}),
  };
};

const hasClassificationDiscounts = (value) => {
  if (!value) return false;
  if (value instanceof Map) return value.size > 0;
  return typeof value === "object" && Object.keys(value).length > 0;
};

const shouldUseClassificationDiscounts = (payload = {}, existingOffer = null) =>
  payload.type === "flash" ||
  existingOffer?.type === "flash" ||
  hasClassificationDiscounts(payload.customerClassificationDiscounts) ||
  hasClassificationDiscounts(existingOffer?.customerClassificationDiscounts);

const prepareOfferPayload = async (payload, existingOffer = null) => {
  if (payload.appliesToLeastSellingItems === true) {
    const leastSellingProductIds = await getLeastSellingProductIds();
    if (leastSellingProductIds.length === 0) {
      throw new AppError("No active stocked least-selling products found", 400);
    }
    payload.products = leastSellingProductIds;
    payload.applicableCategories = [];
  }

  if (shouldUseClassificationDiscounts(payload, existingOffer)) {
    const fallbackDiscount =
      payload.discountPercent ??
      existingOffer?.discountPercent ??
      DEFAULT_FLASH_DEAL_CLASSIFICATION_DISCOUNTS.guest;
    payload.customerClassificationDiscounts = normalizeDiscountMap(
      payload.customerClassificationDiscounts ||
        existingOffer?.customerClassificationDiscounts,
      fallbackDiscount
    );

    if (
      typeof payload.discountPercent === "undefined" ||
      payload.discountPercent === null
    ) {
      payload.discountPercent =
        payload.customerClassificationDiscounts.registered ??
        payload.customerClassificationDiscounts.guest ??
        DEFAULT_FLASH_DEAL_CLASSIFICATION_DISCOUNTS.guest;
    }
  }

  return payload;
};

const hydrateCategoryProducts = async (offers, req) => {
  const productLimit = Math.min(
    Math.max(Number(req.query.productLimit) || 48, 1),
    100
  );

  return Promise.all(
    offers.map(async (offer) => {
      const categoryConditions = buildCategoryConditions(
        offer.applicableCategories
      );

      if (categoryConditions.length === 0) {
        return mergeOfferProducts(offer);
      }

      const categoryProducts = await Product.find({
        isActive: true,
        $or: categoryConditions,
      })
        .sort({ arrivedAt: -1, createdAt: -1 })
        .limit(productLimit)
        .select(PUBLIC_PRODUCT_SELECT)
        .populate(PRODUCT_IMAGE_POPULATE)
        .lean({ virtuals: true });

      return mergeOfferProducts(offer, categoryProducts);
    })
  );
};

const emitOfferRefresh = (action, offerId) => {
  emitToAll("offer:refresh", {
    action,
    offerId: offerId ? String(offerId) : null,
  });
};

/*
|--------------------------------------------------------------------------
| Public — list live offers (used by storefront)
|--------------------------------------------------------------------------
*/
const listPublicOffers = catchAsync(async (req, res) => {
  const now = new Date();
  const featuredOnly = String(req.query.featured || "").toLowerCase() === "true";
  const filter = {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };

  if (featuredOnly) {
    filter.showOnHomepage = true;
  }

  const offers = await Offer.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .populate({
      path: "products",
      match: { isActive: true },
      select: PUBLIC_PRODUCT_SELECT,
      populate: PRODUCT_IMAGE_POPULATE,
    })
    .lean({ virtuals: true });

  let hydratedOffers = await hydrateCategoryProducts(offers, req);
  hydratedOffers = hydratedOffers.map((offer) =>
    normalizePublicOffer(offer, { customer: req.customer, user: req.userInfo })
  );

  if (featuredOnly) {
    hydratedOffers = hydratedOffers.slice(0, 1);
  }

  res.status(200).json({
    success: true,
    data: { offers: hydratedOffers, count: hydratedOffers.length },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — list all offers (active + history). Optional ?status=history|active
|--------------------------------------------------------------------------
*/
const listCustomerClassifications = catchAsync(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      classifications: Customer.CLASSIFICATIONS,
      defaultDiscounts: DEFAULT_FLASH_DEAL_CLASSIFICATION_DISCOUNTS,
    },
  });
});

const listAdminOffers = catchAsync(async (req, res) => {
  const status = String(req.query.status || "").toLowerCase();
  const now = new Date();
  const filter = {};

  if (status === "active") {
    filter.isActive = true;
    filter.$and = [
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ];
  } else if (status === "history") {
    filter.$or = [{ isActive: false }, { endsAt: { $lt: now } }];
  }

  const offers = await Offer.find(filter)
    .sort({ createdAt: -1 })
    .populate("products", ADMIN_PRODUCT_SELECT)
    .populate("createdBy", "email")
    .lean();

  res.status(200).json({
    success: true,
    data: { offers, count: offers.length },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — create offer
|--------------------------------------------------------------------------
*/
const createOffer = catchAsync(async (req, res, next) => {
  const offerData = filterObj(req.body, ...OFFER_FIELDS);

  if (!offerData.name) {
    return next(new AppError("Offer name is required", 400));
  }
  if (!offerData.type) {
    return next(new AppError("Offer type is required", 400));
  }
  if (typeof offerData.showOnHomepage === "undefined") {
    offerData.showOnHomepage = true;
  }

  await prepareOfferPayload(offerData);

  // Validate product references if any
  if (Array.isArray(offerData.products) && offerData.products.length > 0) {
    const invalid = offerData.products.find(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalid) {
      return next(new AppError(`Invalid product id: ${invalid}`, 400));
    }
    const count = await Product.countDocuments({
      _id: { $in: offerData.products },
    });
    if (count !== offerData.products.length) {
      return next(new AppError("One or more products do not exist", 400));
    }
  }

  offerData.createdBy = req.userInfo?._id || req.userInfo?.id || null;

  const offer = await Offer.create(offerData);
  const populated = await Offer.findById(offer._id)
    .populate("products", ADMIN_PRODUCT_SELECT)
    .lean();

  emitOfferRefresh("created", offer._id);

  res.status(201).json({
    success: true,
    message: "Offer created successfully",
    data: { offer: populated },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — update offer
|--------------------------------------------------------------------------
*/
const updateOffer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid offer id", 400));
  }

  const update = filterObj(req.body, ...OFFER_FIELDS);
  const existingOffer = await Offer.findById(id)
    .select("type discountPercent customerClassificationDiscounts")
    .lean();

  if (!existingOffer) {
    return next(new AppError("Offer not found", 404));
  }

  await prepareOfferPayload(update, existingOffer);

  if (Array.isArray(update.products) && update.products.length > 0) {
    const invalid = update.products.find(
      (pid) => !mongoose.Types.ObjectId.isValid(pid)
    );
    if (invalid) {
      return next(new AppError(`Invalid product id: ${invalid}`, 400));
    }
  }

  const offer = await Offer.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .populate("products", ADMIN_PRODUCT_SELECT)
    .lean();

  emitOfferRefresh("updated", offer._id);

  res.status(200).json({
    success: true,
    message: "Offer updated",
    data: { offer },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — delete offer
|--------------------------------------------------------------------------
*/
const deleteOffer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid offer id", 400));
  }

  const offer = await Offer.findById(id);
  if (!offer) {
    return next(new AppError("Offer not found", 404));
  }

  if (offer.isSystemGenerated) {
    return next(
      new AppError(
        "System-generated offers cannot be deleted (deactivate instead)",
        409
      )
    );
  }

  await offer.deleteOne();

  emitOfferRefresh("deleted", id);

  res.status(200).json({
    success: true,
    message: "Offer deleted",
    data: { id },
  });
});

module.exports = {
  listPublicOffers,
  listCustomerClassifications,
  listAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
};
