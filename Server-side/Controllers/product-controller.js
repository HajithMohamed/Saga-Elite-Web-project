const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image"); // only for fetching images
const filterObj = require("../Utils/filter-object");


/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

const getAllProducts = catchAsync(async (req, res, next) => {

    res.status(200).json({
        status: "success",
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

    const product = await Product.findOne({ slug: productSlug });

    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    // Fetch images separately (since you maintain separate Image model)
    const images = await Image.find({
        refId: product._id,
        refModel: "Product",
        isDeleted: false
    }).sort({ order: 1 });

    res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        product,
        images
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
        "basePrice",
        "discountPercent",
        "slug"
    );

    if (Object.keys(productData).length === 0) {
        return next(new AppError("All fields are required", 400));
    }

    const existingProduct = await Product.findOne({ artNo: productData.artNo });

    if (existingProduct) {
        return next(new AppError("Product with this Art No already exists", 400));
    }

    const newlyCreatedProduct = await Product.create(productData);

    res.status(201).json({
        success: true,
        message: "New product added successfully",
        product: newlyCreatedProduct
    });

});



module.exports = {
    getAllProducts,
    getSingleProduct,
    addProduct
};