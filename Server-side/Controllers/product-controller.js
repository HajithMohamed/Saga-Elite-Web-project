const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const filterObj = require("../Utils/filter-object")


const getAllProducts = catchAsync(async (req,res,next)=>{
        res.status(200).json({
        status: "success",
        ...res.paginatedResults,
  });
})

const getSingleProduct = catchAsync(async (req,res,next)=>{
    const productSlug = req.params.slug;

    if(!productSlug){
        return next(new AppError("Product Slug is required",400));
    }
    const singleProduct = await Product.findOne({productSlug}).populate("images")

    if(!singleProduct){
        return next(new AppError("Product is not found",404));
    }
    res.status(200).json({
        success : true,
        message : "product fetched",
        product : singleProduct
    })
})

const addProduct = catchAsync(async(req,res,next)=>{
    const productData = filterObj(req.body,"name","artNo","description","brand","category","basePrice","discountPercent");

    if(Object.keys(productData).length==0){
        return next(new AppError("All fields are required"));
    }

    const newlyCreatedProduct = new Product(productData)
    await newlyCreatedProduct.save();

    if(req.files && req.files.length>0){
        const imagesData = req.files.map(file => ({
            url : file.path,
            altText : file.originalname,
            refId: newlyCreatedProduct._id,
            type : "product",
            refModel : product
        }))
        await Image.insertMany(imagesData);
    }
    const newProduct = await Product.findById(product._id).populate("images");
    if(!newProduct){
        return next(new AppError("Product not found there is a problem in adding this product"));

    }
    res.status(201).json({
        success : true,
        message : "New product added successfully",
        product : newlyCreatedProduct
    })
})



module.exports = {
    getAllProducts,
    getSingleProduct,
    addProduct
}