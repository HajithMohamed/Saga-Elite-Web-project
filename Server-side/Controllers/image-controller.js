const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");
const Image = require("../Models/Image");
const cloudinary = require("../Config/cloudinary-config");
const validator = require("validator");
const uploadToCloudinary = require("../Utils/image-upload");
const Product = require("../Models/Product");
const Drop = require("../Models/Drop");

const uploadImages = catchAsync(async (req, res, next) => {
  const imageData = filterObj(req.body, "refId", "refModel", "type");

  if (!imageData.refId || !imageData.refModel) {
    return next(new AppError("refId and refModel are required", 400));
  }

  // Normalize refModel
  imageData.refModel =
    imageData.refModel.charAt(0).toUpperCase() +
    imageData.refModel.slice(1).toLowerCase();

  const validRefModels = ["Product", "Drop"];
  if (!validRefModels.includes(imageData.refModel)) {
    return next(new AppError("Invalid refModel", 400));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError("No images uploaded", 400));
  }

  /* ==============================
     Validate Reference Exists
  ============================== */

  if (imageData.refModel === "Product") {
    const productExists = await Product.exists({ _id: imageData.refId });
    if (!productExists)
      return next(new AppError("Product not found", 404));
  }

  if (imageData.refModel === "Drop") {
    const dropExists = await Drop.exists({ _id: imageData.refId });
    if (!dropExists)
      return next(new AppError("Drop not found", 404));
  }

  /* ==============================
     Count Existing Images
  ============================== */

  const existingImagesCount = await Image.countDocuments({
    refId: imageData.refId,
    refModel: imageData.refModel,
    isDeleted: false,
  });

  /* ==============================
     Upload To Cloudinary (throttled)
  ============================== */

  const CONCURRENCY = 2;
  const uploadResults = [];

  for (let i = 0; i < req.files.length; i += CONCURRENCY) {
    const batch = req.files.slice(i, i + CONCURRENCY).map((file, batchIdx) => {
      const index = i + batchIdx;
      return uploadToCloudinary(
        file.buffer,
        `saga-elite/${imageData.refModel.toLowerCase()}`,
        file.mimetype
      ).then((result) => ({ result, index }));
    });

    const batchResults = await Promise.allSettled(batch);
    uploadResults.push(...batchResults);
  }

  const uploadedImages = [];
  const failedUploads = [];

  for (const uploadResult of uploadResults) {
    if (uploadResult.status === "fulfilled") {
      const { result, index } = uploadResult.value;

      try {
        const image = await Image.create({
          url: result.secure_url,
          publicId: result.public_id,
          type: imageData.type || "product",
          refId: imageData.refId,
          refModel: imageData.refModel,
          order: existingImagesCount + index,
          isPrimary: existingImagesCount === 0 && index === 0, // auto primary
          metadata: {
            width: result.width,
            height: result.height,
            format: result.format,
            sizeInBytes: result.bytes,
          },
        });

        uploadedImages.push(image);
      } catch (dbError) {
        await cloudinary.uploader.destroy(result.public_id);
        failedUploads.push(`DB save failed for upload ${index}`);
      }
    } else {
      failedUploads.push(
        `Upload failed: ${uploadResult.reason.message}`
      );
    }
  }

  /* ==============================
     Rollback if any failed
  ============================== */

  if (failedUploads.length > 0) {
    for (const image of uploadedImages) {
      await cloudinary.uploader.destroy(image.publicId);
      await Image.findByIdAndDelete(image._id);
    }

    return next(
      new AppError(`Upload failed: ${failedUploads.join(", ")}`, 500)
    );
  }

  res.status(201).json({
    success: true,
    results: uploadedImages.length,
    images: uploadedImages,
  });
});

const getProductImages = catchAsync(async (req, res, next) => {
  const productRefId = req.params.id;

  if (!productRefId) {
    return next(new AppError("Product reference ID is required", 400));
  }

  const product = await Product.findById(productRefId);

  if (!product) {
    return next(new AppError("This product is not found", 404));
  }

  const productImages = await Image.find({
    refId: productRefId,
    refModel: "Product",
    isDeleted: false,
  }).sort({ order: 1 });

  res.status(200).json({
    success: true,
    message: `${product.slug}'s images fetched successfully`,
    results: productImages.length,
    images: productImages,
  });
});

const getDropImages = catchAsync(async (req, res, next) => {
  const dropRefId = req.params.id;

  if (!dropRefId) {
    return next(new AppError("Product reference ID is required", 400));
  }

  const drop = await Drop.findById(dropRefId);

  if (!drop) {
    return next(new AppError("This drop is not found", 404));
  }

  const dropImages = await Image.find({
    refId: dropRefId,
    refModel: "Drop",
    isDeleted: false,
  }).sort({ order: 1 });

  res.status(200).json({
    success: true,
    message: `${drop.slug}'s images fetched successfully`,
    results: dropImages.length,
    images: dropImages,
  });
});

module.exports = { uploadImages, getProductImages,getDropImages};
