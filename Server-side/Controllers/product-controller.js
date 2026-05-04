const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image");
const Drop = require("../Models/Drop");
const mongoose = require("mongoose");
const cloudinary = require("../Config/cloudinary-config");
const filterObj = require("../Utils/filter-object");
const { broadcastNotification } = require("../Utils/notification-service");


/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

const getAllProducts = catchAsync(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        ...res.paginatedResults
    });
});


/*
|--------------------------------------------------------------------------
| Get Single Product (with images)
|--------------------------------------------------------------------------
*/

const getSingleProduct = catchAsync(async (req, res, next) => {
    const productSlug = req.params.slug;

    if (!productSlug) {
        return next(new AppError("Product slug is required", 400));
    }

    const productQuery = mongoose.Types.ObjectId.isValid(productSlug)
        ? { _id: productSlug }
        : { slug: productSlug };

    const product = await Product.findOne(productQuery)
        .populate('images')
        .populate('drop', 'name slug releaseDate endDate');

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        product
    });
});


/*
|--------------------------------------------------------------------------
| Add Product (Only Product Data)
|--------------------------------------------------------------------------
*/

const addProduct = catchAsync(async (req, res, next) => {
    const productData = filterObj(
        req.body,
        "name",
        "artNo",
        "description",
        "brand",
        "category",
        "drop",
        "basePrice",
        "discountPercent",
        "variants"
    );

    if (Object.keys(productData).length === 0) {
        return next(new AppError("All fields are required", 400));
    }

    // Validate Drop ID — required by schema
    if (!productData.drop) {
        return next(new AppError("Drop is required", 400));
    }

    if (!mongoose.isValidObjectId(productData.drop)) {
        return next(new AppError("Invalid drop id", 400));
    }

    const dropExists = await Drop.exists({ _id: productData.drop });
    if (!dropExists) {
        return next(new AppError("Drop not found", 404));
    }

    const existingProduct = await Product.findOne({ artNo: productData.artNo });

    if (existingProduct) {
        return next(new AppError("Product with this Art No already exists", 400));
    }

    const newlyCreatedProduct = await Product.create(productData);

    if (newlyCreatedProduct.discountPercent > 0 || newlyCreatedProduct.isFeatured) {
        await broadcastNotification({
            type: "offer",
            title: `Special offer: ${newlyCreatedProduct.name}`,
            message: `${newlyCreatedProduct.name} is now available with a special offer. Check it out before it ends!`,
            entityRef: newlyCreatedProduct._id,
            entityType: "Product",
            meta: { productSlug: newlyCreatedProduct.slug, discountPercent: newlyCreatedProduct.discountPercent },
            filter: { isActive: true },
        });
    }

    res.status(201).json({
        success: true,
        message: "New product added successfully",
        product: newlyCreatedProduct
    });
});


/*
|--------------------------------------------------------------------------
| Update Product (find-then-save to trigger hooks for slug/totalStock)
|--------------------------------------------------------------------------
*/

const updateProduct = catchAsync(async (req, res, next) => {
    const productSlug = req.params.slug;

    if (!productSlug) {
        return next(new AppError("Product slug is required", 400));
    }

    const allowedFields = [
        "name",
        "description",
        "brand",
        "category",
        "drop",
        "basePrice",
        "discountPercent",
        "isFeatured",
        "isActive",
        "maxPerUser",
        "isLimited",
        "variants"
    ];

    const productData = filterObj(req.body, ...allowedFields);

    if (Object.keys(productData).length === 0) {
        return next(new AppError("At least one field is required to update", 400));
    }

    // Validate Drop exists if being updated
    if (productData.drop) {
        const dropExists = await Drop.exists({ _id: productData.drop });
        if (!dropExists) {
            return next(new AppError("Drop not found", 404));
        }
    }

    const product = await Product.findOne({ slug: productSlug });

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const shouldNotifyOffer =
        (typeof productData.discountPercent !== "undefined" && product.discountPercent === 0 && productData.discountPercent > 0) ||
        (typeof productData.isFeatured !== "undefined" && !product.isFeatured && productData.isFeatured === true);

    // Apply updates to the document
    Object.assign(product, productData);

    // save() triggers pre-save hooks (slug regen, totalStock recalc)
    await product.save({ validateModifiedOnly: true });

    if (shouldNotifyOffer) {
        const headline = productData.discountPercent > 0
            ? `Special offer: ${product.name}`
            : `Featured now: ${product.name}`;

        const details = product.discountPercent > 0
            ? `${product.name} now has a ${product.discountPercent}% discount.`
            : `${product.name} is now featured in the collection.`;

        await broadcastNotification({
            type: "offer",
            title: headline,
            message: details,
            entityRef: product._id,
            entityType: "Product",
            meta: { productSlug: product.slug, discountPercent: product.discountPercent },
            filter: { isActive: true },
        });
    }

    const io = req.app.get("io");
    if (io) {
        io.emit("product:updated", {
            productId: product._id,
            slug: product.slug,
            price: product.basePrice,
            discount: product.discountPercent,
            basePrice: product.basePrice,
            discountPercent: product.discountPercent,
            variants: product.variants,
            drop: product.drop,
        });
    }

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
    });
});


/*
|--------------------------------------------------------------------------
| Get Admin Analytics 
|--------------------------------------------------------------------------
*/

const getAdminAnalytics = catchAsync(async (req, res, next) => {
    // Fetch Best Sellers (Top 5 Checkout)
    const bestSellers = await Product.find({ soldCount: { $gt: 0 } })
        .sort({ soldCount: -1 })
        .limit(5)
        .select("name soldCount brand category artNo slug");

    // Fetch Most Wished (Top 5 Wishlisted)
    const mostWished = await Product.find({ wishCount: { $gt: 0 } })
        .sort({ wishCount: -1 })
        .limit(5)
        .select("name wishCount soldCount brand category artNo slug");

    res.status(200).json({
        success: true,
        message: "Analytics fetched successfully",
        analytics: {
            bestSellers,
            mostWished
        }
    });
});


/*
|--------------------------------------------------------------------------
| Delete Product (with image cleanup & transaction)
|--------------------------------------------------------------------------
*/


const deleteProduct = catchAsync(async (req, res, next) => {
    const productSlug = req.params.slug;

    if (!productSlug) {
        return next(new AppError("Product slug is required", 400));
    }

    const product = await Product.findOne({ slug: productSlug });

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    const productImages = await Image.find({
        refId: product._id,
        refModel: "Product"
    });

    // Use transaction for atomicity
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await Image.deleteMany({
                refId: product._id,
                refModel: "Product"
            }).session(session);

            await Product.deleteOne({ _id: product._id }).session(session);
        });
    } finally {
        session.endSession();
    }

    // Cloudinary cleanup (best-effort, after DB commit)
    if (productImages.length > 0) {
        const cloudinaryDeletes = productImages.map((image) =>
            cloudinary.uploader.destroy(image.publicId)
        );
        await Promise.allSettled(cloudinaryDeletes);
    }

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        deletedProductSlug: productSlug,
        deletedImagesCount: productImages.length
    });
});

module.exports = {
    getAllProducts,
    getSingleProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    getAdminAnalytics
};
