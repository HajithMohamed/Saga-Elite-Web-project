const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");
const Image = require("../Models/Image");
const mongoose = require("mongoose");
const cloudinary = require("../Config/cloudinary-config");
const uploadToCloudinary = require("../Utils/image-upload");
const Product = require("../Models/Product");
const Drop = require("../Models/Drop");
const winston = require("winston");

const MAX_IMAGES_PER_ENTITY = 10;

// Configure Winston logger for image actions
const actionLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/image-actions.log" }),
  ],
});

// Add console logging in non-production
if (process.env.NODE_ENV !== "production") {
  actionLogger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

const uploadImages = catchAsync(async (req, res, next) => {
  const imageData = filterObj(req.body, "refId", "refModel", "type");

  // Log upload attempt
  actionLogger.info({
    action: "upload_images_attempt",
    userId: req.user ? req.user._id : null,
    refModel: imageData.refModel,
    refId: imageData.refId || null,
    type: imageData.type || null,
    numFiles: req.files ? req.files.length : 0,
  });

  if (!imageData.refModel) {
    return next(new AppError("refModel is required", 400));
  }

  // Normalize refModel
  imageData.refModel =
    imageData.refModel.charAt(0).toUpperCase() +
    imageData.refModel.slice(1).toLowerCase();

  const validRefModels = ["Product", "Drop", "System", "Review"];
  if (!validRefModels.includes(imageData.refModel)) {
    return next(new AppError("Invalid refModel", 400));
  }

  // System images don't require refId
  if (imageData.refModel !== "System" && !imageData.refId) {
    return next(new AppError("refId is required for non-System images", 400));
  }

  // Validate ObjectId for non-System
  if (imageData.refModel !== "System" && !mongoose.Types.ObjectId.isValid(imageData.refId)) {
    return next(new AppError("Invalid refId", 400));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError("No images uploaded", 400));
  }

  // Validate type for System images
  if (imageData.refModel === "System") {
    const validSystemTypes = ["hero", "ad", "logo"];

    if (!imageData.type || !validSystemTypes.includes(imageData.type)) {
      return next(
        new AppError("System images require type: hero, ad, or logo", 400)
      );
    }
  }

  /* ==============================
     Validate Reference Exists
  ============================== */

  if (imageData.refModel === "Product") {
    const productExists = await Product.exists({ _id: imageData.refId });
    if (!productExists) return next(new AppError("Product not found", 404));
  }

  if (imageData.refModel === "Drop") {
    const dropExists = await Drop.exists({ _id: imageData.refId });
    if (!dropExists) return next(new AppError("Drop not found", 404));
  }

  /* ==============================
     Count Existing Images & Enforce Limit
  ============================== */

  const countQuery = { refModel: imageData.refModel, isDeleted: false };

  if (imageData.refModel === "System") {
    countQuery.type = imageData.type;
  } else {
    countQuery.refId = imageData.refId;
  }

  const existingImagesCount = await Image.countDocuments(countQuery);

  if (existingImagesCount + req.files.length > MAX_IMAGES_PER_ENTITY) {
    return next(
      new AppError(
        `Image limit exceeded. Max ${MAX_IMAGES_PER_ENTITY} images allowed per entity. Currently ${existingImagesCount}, trying to add ${req.files.length}.`,
        400
      )
    );
  }

  /* ==============================
     Upload To Cloudinary (throttled)
  ============================== */

  let cloudinaryFolder;
  if (imageData.refModel === "System") {
    cloudinaryFolder = `saga-elite/system/${imageData.type}`;
  } else {
    cloudinaryFolder = `saga-elite/${imageData.refModel.toLowerCase()}`;
  }

  const CONCURRENCY = 2;
  const uploadResults = [];

  for (let i = 0; i < req.files.length; i += CONCURRENCY) {
    const batch = req.files.slice(i, i + CONCURRENCY).map((file, batchIdx) => {
      const index = i + batchIdx;
      return uploadToCloudinary(
        file.buffer,
        cloudinaryFolder,
        file.mimetype,
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
        const imageDoc = {
          url: result.secure_url,
          publicId: result.public_id,
          type: imageData.type || "product",
          refModel: imageData.refModel,
          order: existingImagesCount + index,
          isPrimary: existingImagesCount === 0 && index === 0,
          metadata: {
            width: result.width,
            height: result.height,
            format: result.format,
            sizeInBytes: result.bytes,
          },
        };

        if (imageData.refModel !== "System") {
          imageDoc.refId = imageData.refId;
        }

        const image = await Image.create(imageDoc);
        uploadedImages.push(image);

        // Log successful upload with URL for debugging
        actionLogger.info({
          action: "image_upload_success",
          userId: req.user ? req.user._id : null,
          refModel: imageData.refModel,
          refId: imageData.refId || null,
          publicId: result.public_id,
          url: result.secure_url,
          order: imageDoc.order,
        });
      } catch (dbError) {
        await cloudinary.uploader.destroy(result.public_id);
        failedUploads.push(`DB save failed for upload ${index}`);
      }
    } else {
      failedUploads.push(`Upload failed: ${uploadResult.reason.message}`);
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

    actionLogger.error({
      action: "upload_images",
      userId: req.user ? req.user._id : null,
      refModel: imageData.refModel,
      refId: imageData.refId || null,
      type: imageData.type || null,
      numImagesAttempted: req.files.length,
      numFailed: failedUploads.length,
      errors: failedUploads,
    });

    return next(
      new AppError(`Upload failed: ${failedUploads.join(", ")}`, 500),
    );
  }

  actionLogger.info({
    action: "upload_images",
    userId: req.user ? req.user._id : null,
    refModel: imageData.refModel,
    refId: imageData.refId || null,
    type: imageData.type || null,
    numImagesUploaded: uploadedImages.length,
  });

  res.status(201).json({
    success: true,
    results: uploadedImages.length,
    images: uploadedImages,
  });
});

const getProductImages = catchAsync(async (req, res, next) => {
  const productRefId = req.params.id;

  if (!productRefId || !mongoose.Types.ObjectId.isValid(productRefId)) {
    return next(new AppError("Valid product reference ID is required", 400));
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

  if (!dropRefId || !mongoose.Types.ObjectId.isValid(dropRefId)) {
    return next(new AppError("Valid drop reference ID is required", 400));
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

const getHeroImages = catchAsync(async (req, res, next) => {
  const heroImages = await Image.find({
    refModel: "System",
    type: "hero",
    isDeleted: false,
  }).sort({ order: 1 });

  if (!heroImages.length) {
    return next(new AppError("No hero images found", 404));
  }

  res.status(200).json({
    success: true,
    results: heroImages.length,
    images: heroImages,
  });
});

const getAdImages = catchAsync(async (req, res, next) => {
  const adImages = await Image.find({
    refModel: "System",
    type: "ad",
    isDeleted: false,
  }).sort({ order: 1 });

  if (!adImages.length) {
    return next(new AppError("No ad images found", 404));
  }

  res.status(200).json({
    success: true,
    results: adImages.length,
    images: adImages,
  });
});

const getLogoImages = catchAsync(async (req, res, next) => {
  const logoImages = await Image.find({
    refModel: "System",
    type: "logo",
    isDeleted: false,
  }).sort({ order: 1 });

  if (!logoImages.length) {
    return next(new AppError("No logo images found", 404));
  }

  res.status(200).json({
    success: true,
    results: logoImages.length,
    images: logoImages,
  });
});

const getReviewImages = catchAsync(async (req, res, next) => {
  const reviewRefId = req.params.id;

  if (!reviewRefId || !mongoose.Types.ObjectId.isValid(reviewRefId)) {
    return next(new AppError("Valid review reference ID is required", 400));
  }

  const reviewImages = await Image.find({
    refId: reviewRefId,
    refModel: "Review",
    isDeleted: false,
  }).sort({ order: 1 });

  res.status(200).json({
    success: true,
    results: reviewImages.length,
    images: reviewImages,
  });
});

/* ==============================
   Set Primary Image
============================== */
const setPrimaryImage = catchAsync(async (req, res, next) => {
  const imageId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return next(new AppError("Invalid image ID", 400));
  }

  const image = await Image.findOne({ _id: imageId, isDeleted: false });
  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  const siblingQuery = { refModel: image.refModel, isDeleted: false };
  if (image.refId) {
    siblingQuery.refId = image.refId;
  } else {
    siblingQuery.type = image.type;
  }

  await Image.bulkWrite([
    {
      updateMany: {
        filter: { ...siblingQuery, isPrimary: true },
        update: { $set: { isPrimary: false } },
      },
    },
    {
      updateOne: {
        filter: { _id: image._id },
        update: { $set: { isPrimary: true } },
      },
    },
  ]);

  const updatedImage = await Image.findById(image._id);

  actionLogger.info({
    action: "set_primary_image",
    userId: req.user ? req.user._id : null,
    imageId: image._id,
    refModel: image.refModel,
    refId: image.refId || null,
    type: image.type || null,
  });

  res.status(200).json({
    success: true,
    message: "Primary image updated successfully",
    image: updatedImage,
  });
});

/* ==============================
   Soft-Delete Image
============================== */
const deleteImage = catchAsync(async (req, res, next) => {
  const imageId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return next(new AppError("Invalid image ID", 400));
  }

  const image = await Image.findById(imageId);
  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  if (image.isDeleted) {
    return next(new AppError("Image already deleted", 404));
  }

  actionLogger.info({
    action: "delete_image",
    userId: req.user ? req.user._id : null,
    imageId: image._id,
    refModel: image.refModel,
    refId: image.refId || null,
    type: image.type || null,
    wasPrimary: image.isPrimary,
  });

  const wasPrimary = image.isPrimary;

  image.isDeleted = true;
  image.isPrimary = false;
  await image.save();

  await cloudinary.uploader.destroy(image.publicId);

  if (wasPrimary) {
    const siblingQuery = { refModel: image.refModel, isDeleted: false };
    if (image.refId) {
      siblingQuery.refId = image.refId;
    } else {
      siblingQuery.type = image.type;
    }

    const nextImage = await Image.findOne(siblingQuery).sort({ order: 1 });
    if (nextImage) {
      nextImage.isPrimary = true;
      await nextImage.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

/* ==============================
   Reorder Images
============================== */
const reorderImages = catchAsync(async (req, res, next) => {
  const { imageOrders } = req.body;

  if (!Array.isArray(imageOrders) || imageOrders.length === 0) {
    return next(
      new AppError(
        "imageOrders array is required (e.g. [{ imageId, order }])",
        400,
      ),
    );
  }

  for (const entry of imageOrders) {
    if (!entry.imageId || !mongoose.Types.ObjectId.isValid(entry.imageId) || typeof entry.order !== "number") {
      return next(
        new AppError("Each entry must have a valid imageId and order (number)", 400),
      );
    }
  }

  const imageIds = imageOrders.map((e) => e.imageId);
  const images = await Image.find({
    _id: { $in: imageIds },
    isDeleted: false,
  });

  if (images.length !== imageOrders.length) {
    return next(
      new AppError("One or more image IDs are invalid or deleted", 400),
    );
  }

  const refModels = [...new Set(images.map((img) => img.refModel))];
  if (refModels.length > 1) {
    return next(
      new AppError("All images must belong to the same refModel", 400),
    );
  }

  const refIds = [...new Set(images.map((img) => String(img.refId || "")))];
  if (refIds.length > 1) {
    return next(
      new AppError("All images must belong to the same entity", 400),
    );
  }

  const bulkOps = imageOrders.map((entry) => ({
    updateOne: {
      filter: { _id: entry.imageId },
      update: { $set: { order: entry.order } },
    },
  }));

  await Image.bulkWrite(bulkOps);

  const sampleImage = images[0];
  actionLogger.info({
    action: "reorder_images",
    userId: req.user ? req.user._id : null,
    refModel: sampleImage.refModel,
    refId: sampleImage.refId || null,
    type: sampleImage.type || null,
    affectedImageIds: imageIds,
    numImagesReordered: imageOrders.length,
  });

  res.status(200).json({
    success: true,
    message: "Image order updated successfully",
  });
});

/* ==============================
   Bulk Delete Images
============================== */
const deleteAllImages = catchAsync(async (req, res, next) => {
  const { refModel, refId, type } = req.body;

  if (!refModel) {
    return next(new AppError("refModel is required in request body", 400));
  }

  const normalizedRefModel = refModel.charAt(0).toUpperCase() + refModel.slice(1).toLowerCase();
  const validRefModels = ["Product", "Drop", "System"];
  if (!validRefModels.includes(normalizedRefModel)) {
    return next(new AppError("Invalid refModel", 400));
  }

  const query = { refModel: normalizedRefModel };
  if (normalizedRefModel === "System") {
    if (!type) {
      return next(new AppError("type is required in request body for System images", 400));
    }
    query.type = type;
  } else {
    if (!refId || !mongoose.Types.ObjectId.isValid(refId)) {
      return next(new AppError("Valid refId is required for non-System images", 400));
    }
    query.refId = refId;
  }

  const imagesToDelete = await Image.find(query);
  if (imagesToDelete.length === 0) {
    return next(new AppError("No images found to delete", 404));
  }

  await Image.deleteMany(query);

  const cloudinaryDeletes = imagesToDelete.map(img => cloudinary.uploader.destroy(img.publicId));
  await Promise.allSettled(cloudinaryDeletes);

  actionLogger.info({
    action: "delete_all_images",
    userId: req.user ? req.user._id : null,
    refModel: normalizedRefModel,
    refId: refId || null,
    type: type || null,
    numImagesDeleted: imagesToDelete.length,
    deletedImageIds: imagesToDelete.map(img => img._id),
  });

  res.status(200).json({
    success: true,
    message: `${imagesToDelete.length} images deleted successfully`,
    deletedCount: imagesToDelete.length,
  });
});

module.exports = {
  uploadImages,
  getProductImages,
  getDropImages,
  getHeroImages,
  getAdImages,
  getLogoImages,
  getReviewImages,
  setPrimaryImage,
  deleteImage,
  reorderImages,
  deleteAllImages,
};