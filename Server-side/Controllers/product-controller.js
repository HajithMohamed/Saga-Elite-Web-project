const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image"); // only for fetching images
const filterObj = require("../Utils/filter-object");
const validator = require("validator");


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

    const product = await Product.findOne({ slug: productSlug }).populate('images');

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
    );

    if (Object.keys(productData).length === 0) {
        return next(new AppError("All fields are required", 400));
    }

    // Sanitize strings
    if (productData.name) productData.name = validator.escape(productData.name);
    if (productData.description) productData.description = validator.escape(productData.description);
    if (productData.brand) productData.brand = validator.escape(productData.brand);

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