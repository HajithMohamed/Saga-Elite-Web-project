const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image");
const Drop = require("../Models/Drop");
const mongoose = require("mongoose");
const cloudinary = require("../Config/cloudinary-config");
const filterObj = require("../Utils/filter-object");
const { isAdminRole, ADMIN_ROLES } = require("../Utils/admin-roles");
const { broadcastNotification } = require("../Utils/notification-service");
const { emitToAll } = require("../Utils/socket-service");


/*
|--------------------------------------------------------------------------
| Create Drop
|--------------------------------------------------------------------------
*/

const createDrop = catchAsync(async (req, res, next) => {
    const dropData = filterObj(
        req.body,
        "name",
        "description",
        "headline",
        "manifesto",
        "cinematicMode",
        "vipEarlyAccessHours",
        "releaseDate",
        "endDate",
        "isPublished",
        "isArchived"
    );

    if (Object.keys(dropData).length === 0) {
        return next(new AppError("At least name and releaseDate are required", 400));
    }

    // Date format already validated and converted to Date instances by validateDropCreate.
    if (dropData.releaseDate && dropData.endDate && dropData.endDate <= dropData.releaseDate) {
        return next(new AppError("endDate must be after releaseDate", 400));
    }

    const newDrop = await Drop.create({
        ...dropData,
        isPublished: dropData.isPublished ?? true,
        isArchived: dropData.isArchived ?? false,
    });

    await broadcastNotification({
        type: "drop",
        title: `New drop added: ${newDrop.name}`,
        message: `${newDrop.name} is scheduled for release on ${new Date(
            newDrop.releaseDate,
        ).toLocaleDateString()}.`,
        entityRef: newDrop._id,
        entityType: "Drop",
        meta: { dropSlug: newDrop.slug },
        filter: { isActive: true },
    });

    await broadcastNotification({
        type: "admin",
        title: `Drop published: ${newDrop.name}`,
        message: `Drop ${newDrop.name} was created and published for review.`,
        entityRef: newDrop._id,
        entityType: "Drop",
        meta: { dropId: newDrop._id, dropSlug: newDrop.slug },
        filter: { role: { $in: ADMIN_ROLES } },
    });

    // Real-time emit (Fix #4) so drops list pages refetch.
    emitToAll("drop:created", {
        dropId: newDrop._id,
        slug: newDrop.slug,
        name: newDrop.name,
        releaseDate: newDrop.releaseDate,
    });

    res.status(201).json({
        success: true,
        message: "New Drop created successfully",
        drop: newDrop,
    });
});


/*
|--------------------------------------------------------------------------
| Get All Drops
|--------------------------------------------------------------------------
*/

const getAllDrops = catchAsync(async (req, res, next) => {
    const filter = {};

    // Admin can see all; public sees only published & non-archived
    if (!req.userInfo || !isAdminRole(req.userInfo.role)) { 
        filter.isPublished = true;
        filter.isArchived = false;
    }

    const drops = await Drop.find(filter)
        .sort({ releaseDate: -1 })
        .populate("images")
        .populate({
            path: "products",
            match: { isActive: true },
            populate: { path: "images" },
        });

    res.status(200).json({
        success: true,
        message: "Drops fetched successfully",
        results: drops.length,
        drops,
    });
});


/*
|--------------------------------------------------------------------------
| Get Single Drop (with images & products)
|--------------------------------------------------------------------------
*/

const getSingleDrop = catchAsync(async (req, res, next) => {
    const dropSlug = req.params.slug;

    if (!dropSlug) {
        return next(new AppError("Drop slug is required", 400));
    }

    const filter = { slug: dropSlug };
    if (!req.userInfo || !isAdminRole(req.userInfo.role)) {
        filter.isPublished = true;
        filter.isArchived = false;
    }

    const drop = await Drop.findOne(filter).populate("images");

    if (!drop) {
        return next(new AppError("Drop not found", 404));
    }

    const products = await Product.find({ drop: drop._id, isActive: true })
        .populate("images");

    res.status(200).json({
        success: true,
        message: "Drop fetched successfully",
        drop,
        products,
    });
});


/*
|--------------------------------------------------------------------------
| Update Drop (find-then-save to trigger slug hook)
|--------------------------------------------------------------------------
*/

const updateDrop = catchAsync(async (req, res, next) => {
    const dropSlug = req.params.slug;

    if (!dropSlug) {
        return next(new AppError("Drop slug is required", 400));
    }

    const dropData = filterObj(
        req.body,
        "name",
        "description",
        "headline",
        "manifesto",
        "cinematicMode",
        "vipEarlyAccessHours",
        "releaseDate",
        "endDate",
        "isPublished",
        "isArchived"
    );

    if (Object.keys(dropData).length === 0) {
        return next(new AppError("At least one field is required to update", 400));
    }

    // Date format already validated and converted to Date instances by validateDropUpdate.
    const drop = await Drop.findOne({ slug: dropSlug });

    if (!drop) {
        return next(new AppError("Drop not found", 404));
    }

    const finalRelease = dropData.releaseDate || drop.releaseDate;
    const finalEnd = Object.prototype.hasOwnProperty.call(dropData, "endDate")
        ? dropData.endDate
        : drop.endDate;

    if (finalRelease && finalEnd && finalEnd <= finalRelease) {
        return next(new AppError("endDate must be after releaseDate", 400));
    }

    Object.assign(drop, dropData);
    await drop.save({ validateModifiedOnly: true });

    const populatedDrop = await Drop.findById(drop._id).populate("images");

    emitToAll("drop:updated", {
        dropId: populatedDrop._id,
        drop: populatedDrop,
    });

    res.status(200).json({
        success: true,
        message: "Drop updated successfully",
        drop: populatedDrop,
    });
});


/*
|--------------------------------------------------------------------------
| Delete Drop (with product & image cleanup)
|--------------------------------------------------------------------------
*/

const deleteDrop = catchAsync(async (req, res, next) => {
    const dropSlug = req.params.slug;

    if (!dropSlug) {
        return next(new AppError("Drop slug is required", 400));
    }

    const drop = await Drop.findOne({ slug: dropSlug });

    if (!drop) {
        return next(new AppError("Drop not found", 404));
    }

    // Check if drop has products
    const productCount = await Product.countDocuments({ drop: drop._id });
    if (productCount > 0) {
        return next(
            new AppError(
                `Cannot delete drop with ${productCount} product(s). Remove products first or archive the drop instead.`,
                400
            )
        );
    }

    // Gather drop images for Cloudinary cleanup
    const dropImages = await Image.find({
        refId: drop._id,
        refModel: "Drop",
    });

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await Image.deleteMany({
                refId: drop._id,
                refModel: "Drop",
            }).session(session);

            await Drop.deleteOne({ _id: drop._id }).session(session);
        });
    } finally {
        session.endSession();
    }

    // Cloudinary cleanup (best-effort)
    if (dropImages.length > 0) {
        const cloudinaryDeletes = dropImages.map((img) =>
            cloudinary.uploader.destroy(img.publicId)
        );
        await Promise.allSettled(cloudinaryDeletes);
    }

    res.status(200).json({
        success: true,
        message: "Drop deleted successfully",
        deletedDropSlug: dropSlug,
        deletedImagesCount: dropImages.length,
    });
});


/*
|--------------------------------------------------------------------------
| Archive / Unarchive Drop (soft action)
|--------------------------------------------------------------------------
*/

const archiveDrop = catchAsync(async (req, res, next) => {
    const dropSlug = req.params.slug;

    if (!dropSlug) {
        return next(new AppError("Drop slug is required", 400));
    }

    const drop = await Drop.findOne({ slug: dropSlug });

    if (!drop) {
        return next(new AppError("Drop not found", 404));
    }

    drop.isArchived = !drop.isArchived;
    if (drop.isArchived) {
        drop.isPublished = false;
    }
    await drop.save();

    emitToAll("drop:updated", {
        dropId: drop._id,
        drop: drop,
    });

    res.status(200).json({
        success: true,
        message: drop.isArchived
            ? "Drop archived successfully"
            : "Drop unarchived successfully",
        drop,
    });
});

module.exports = {
    createDrop,
    getAllDrops,
    getSingleDrop,
    updateDrop,
    deleteDrop,
    archiveDrop,
};
