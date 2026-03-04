const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Image = require("../Models/Image");
const cloudinary = require("../Config/cloudinary-config")
const filterObj = require("../Utils/filter-object")


const uploadImages = catchAsync(async (req, res, next) => {

    const imageData = filterObj(req.body, "refId", "refModel", "type");

    if (!imageData.refId || !imageData.refModel) {
        return next(new AppError("refId and refModel are required", 400));
    }

    if (!req.files || req.files.length === 0) {
        return next(new AppError("No images uploaded", 400));
    }

    const uploadedImages = [];

    const existingImagesCount = await Image.countDocuments({
        refId: imageData.refId,
        refModel: imageData.refModel,
        isDeleted: false
    });

    for (let i = 0; i < req.files.length; i++) {

        const uploadResult = await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `saga-elite/${imageData.refModel.toLowerCase()}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.end(req.files[i].buffer);
        });

        const image = await Image.create({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            type: imageData.type || "product",
            refId: imageData.refId,
            refModel: imageData.refModel,
            order: existingImagesCount + i,
            metadata: {
                width: uploadResult.width,
                height: uploadResult.height,
                format: uploadResult.format,
                sizeInBytes: uploadResult.bytes
            }
        });

        uploadedImages.push(image);
    }

    res.status(201).json({
        status: "success",
        results: uploadedImages.length,
        data: uploadedImages,
    });
});

module.exports = {
    uploadImages
}