const Testimonial = require("../Models/Testimonial");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");

const FIELDS = [
  "name",
  "handle",
  "avatar",
  "rating",
  "text",
  "verified",
  "isActive",
  "displayOrder",
];

// Public — active testimonials for the storefront carousel.
exports.getActiveTestimonials = catchAsync(async (_req, res) => {
  const testimonials = await Testimonial.find({ isActive: true }).sort({
    displayOrder: 1,
    createdAt: -1,
  });
  res
    .status(200)
    .json({ success: true, results: testimonials.length, data: testimonials });
});

// Admin — every testimonial (active or not).
exports.listTestimonials = catchAsync(async (_req, res) => {
  const testimonials = await Testimonial.find({}).sort({
    displayOrder: 1,
    createdAt: -1,
  });
  res
    .status(200)
    .json({ success: true, results: testimonials.length, data: testimonials });
});

exports.createTestimonial = catchAsync(async (req, res, next) => {
  const payload = filterObj(req.body, ...FIELDS);
  if (!payload.name || !payload.text) {
    return next(new AppError("Name and text are required", 400));
  }
  payload.createdBy = req.userInfo?._id || null;
  const testimonial = await Testimonial.create(payload);
  res.status(201).json({ success: true, data: testimonial });
});

exports.updateTestimonial = catchAsync(async (req, res, next) => {
  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    filterObj(req.body, ...FIELDS),
    { new: true, runValidators: true }
  );
  if (!testimonial) return next(new AppError("Testimonial not found", 404));
  res.status(200).json({ success: true, data: testimonial });
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
  const deleted = await Testimonial.findByIdAndDelete(req.params.id);
  if (!deleted) return next(new AppError("Testimonial not found", 404));
  res.status(200).json({ success: true, message: "Testimonial deleted" });
});
