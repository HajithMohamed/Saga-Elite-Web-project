const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Offer = require("../Models/Offer");
const Product = require("../Models/Product");
const filterObj = require("../Utils/filter-object");

const OFFER_FIELDS = [
  "name",
  "badgeText",
  "description",
  "type",
  "discountPercent",
  "products",
  "applicableCategories",
  "startsAt",
  "endsAt",
  "showOnHomepage",
  "displayOrder",
  "isActive",
  "estimatedMarginAfterDiscount",
];

/*
|--------------------------------------------------------------------------
| Public — list live offers (used by storefront)
|--------------------------------------------------------------------------
*/
const listPublicOffers = catchAsync(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };

  if (String(req.query.featured || "").toLowerCase() === "true") {
    filter.showOnHomepage = true;
  }

  const offers = await Offer.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .populate("products", "name slug artNo basePrice salePrice discountPercent")
    .lean();

  res.status(200).json({
    success: true,
    data: { offers, count: offers.length },
  });
});

/*
|--------------------------------------------------------------------------
| Admin — list all offers (active + history). Optional ?status=history|active
|--------------------------------------------------------------------------
*/
const listAdminOffers = catchAsync(async (req, res) => {
  const status = String(req.query.status || "").toLowerCase();
  const now = new Date();
  const filter = {};

  if (status === "active") {
    filter.isActive = true;
    filter.$and = [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ];
  } else if (status === "history") {
    filter.$or = [{ isActive: false }, { endsAt: { $lt: now } }];
  }

  const offers = await Offer.find(filter)
    .sort({ createdAt: -1 })
    .populate(
      "products",
      "name slug artNo basePrice salePrice costPrice discountPercent totalStock"
    )
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
    .populate("products", "name slug artNo basePrice salePrice costPrice discountPercent")
    .lean();

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
    .populate("products", "name slug artNo basePrice salePrice costPrice discountPercent")
    .lean();

  if (!offer) {
    return next(new AppError("Offer not found", 404));
  }

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

  res.status(200).json({
    success: true,
    message: "Offer deleted",
    data: { id },
  });
});

module.exports = {
  listPublicOffers,
  listAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
};
