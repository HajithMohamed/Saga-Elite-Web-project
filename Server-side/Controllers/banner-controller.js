const Banner = require("../Models/Banner");
const catchAsync = require("../Utils/catchAsync");

exports.getActiveBanners = catchAsync(async (req, res, next) => {
  const now = new Date();

  const banners = await Banner.find({
    isActive: true,
    activeFrom: { $lte: now },
    $or: [{ activeTo: { $gte: now } }, { activeTo: null }],
  }).sort({ displayOrder: 1 });

  res.status(200).json({
    status: "success",
    results: banners.length,
    data: { banners },
  });
});

exports.getBannerFeed = catchAsync(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 });
  const payload = banners.map((banner) => ({
    id: banner._id,
    imageUrl: banner.imageUrl,
    headline: banner.headline || banner.title,
    subheadline: banner.title,
    ctaText: banner.ctaText || "Shop Now",
    ctaLink: banner.redirectUrl,
    order: banner.displayOrder || 0,
  }));
  res.status(200).json({ status: "success", data: payload });
});

exports.createBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.create(req.body);

  res.status(201).json({
    status: "success",
    data: { banner },
  });
});

exports.updateBanner = catchAsync(async (req, res, next) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: { banner },
  });
});

exports.deleteBanner = catchAsync(async (req, res, next) => {
  await Banner.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});