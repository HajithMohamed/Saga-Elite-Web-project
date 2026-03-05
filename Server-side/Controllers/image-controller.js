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
  console.log("req.body:", req.body);
  console.log("req.files:", req.files);

  // multer.any() stores all files in req.files regardless of field name
  // if you expect a specific key (e.g. 'images'), make sure the client uses it
  const imageData = filterObj(req.body, "refId", "refModel", "type");

  // normalize refModel casing so 'drop' or 'Drop' both work
  if (imageData.refModel) {
    imageData.refModel =
      imageData.refModel.charAt(0).toUpperCase() +
      imageData.refModel.slice(1).toLowerCase();
  }

  if (!imageData.refId || !imageData.refModel) {
    return next(new AppError("refId and refModel are required", 400));
  }

  // Validate refModel enum
  const validRefModels = ["Product", "Drop"];
  if (!validRefModels.includes(imageData.refModel)) {
    return next(new AppError("Invalid refModel", 400));
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError("No images uploaded", 400));
  }

  const existingImagesCount = await Image.countDocuments({
    refId: imageData.refId,
    refModel: imageData.refModel,
    isDeleted: false,
  });

  // Prepare upload promises — use base64 upload to avoid stream ECONNRESET
  const uploadPromises = req.files.map((file, i) =>
    uploadToCloudinary(
      file.buffer,
      `saga-elite/${imageData.refModel.toLowerCase()}`,
      file.mimetype,
    ).then((result) => ({ result, index: i })),
  );

  const uploadResults = await Promise.allSettled(uploadPromises);

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
          metadata: {
            width: result.width,
            height: result.height,
            format: result.format,
            sizeInBytes: result.bytes,
          },
        });
        uploadedImages.push(image);
      } catch (dbError) {
        // If DB save fails, delete from Cloudinary
        await cloudinary.uploader.destroy(result.public_id);
        failedUploads.push(`DB save failed for upload ${index}`);
      }
    } else {
      failedUploads.push(`Upload failed: ${uploadResult.reason.message}`);
    }
  }

  if (failedUploads.length > 0) {
    // Rollback successful uploads
    for (const image of uploadedImages) {
      await cloudinary.uploader.destroy(image.publicId);
      await Image.findByIdAndDelete(image._id);
    }
    return next(
      new AppError(`Upload failed: ${failedUploads.join(", ")}`, 500),
    );
  }

  res.status(201).json({
    status: "success",
    results: uploadedImages.length,
    data: uploadedImages,
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
