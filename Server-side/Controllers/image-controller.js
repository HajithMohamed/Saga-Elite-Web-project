const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");
const Image = require("../Models/Image");
const cloudinary = require("../Config/cloudinary-config")
const validator = require("validator");


const uploadImages = catchAsync(async (req, res, next) => {

    const imageData = filterObj(req.body, "refId", "refModel", "type");

    if (!imageData.refId || !imageData.refModel) {
        return next(new AppError("refId and refModel are required", 400));
    }

    // Validate refModel enum
    const validRefModels = ['Product', 'Drop'];
    if (!validRefModels.includes(imageData.refModel)) {
        return next(new AppError("Invalid refModel", 400));
    }

    if (!req.files || req.files.length === 0) {
        return next(new AppError("No images uploaded", 400));
    }

    const existingImagesCount = await Image.countDocuments({
        refId: imageData.refId,
        refModel: imageData.refModel,
        isDeleted: false
    });

    // Prepare upload promises
    const uploadPromises = req.files.map((file, i) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `saga-elite/${imageData.refModel.toLowerCase()}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve({ result, index: i });
                }
            );
            stream.end(file.buffer);
        });
    });

    const uploadResults = await Promise.allSettled(uploadPromises);

    const uploadedImages = [];
    const failedUploads = [];

    for (const uploadResult of uploadResults) {
        if (uploadResult.status === 'fulfilled') {
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
                        sizeInBytes: result.bytes
                    }
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
        return next(new AppError(`Upload failed: ${failedUploads.join(', ')}`, 500));
    }

    res.status(201).json({
        status: "success",
        results: uploadedImages.length,
        data: uploadedImages,
    });
});

module.exports = {uploadImages}