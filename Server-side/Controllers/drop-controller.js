const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const Product = require("../Models/Product");
const Image = require("../Models/Image"); // only for fetching images
const Drop = require("../Models/Drop")
const filterObj = require("../Utils/filter-object");
const validator = require("validator");


const createDrop = catchAsync(async(req,res,next)=>{
    const dropData = filterObj(req.body, "name","description","releaseDate","endDate")

    if(Object.keys(dropData).length===0){
        return next(new AppError("All fields are required"));
    }

    // Sanitize strings
    if (dropData.name) dropData.name = validator.escape(dropData.name);
    if (dropData.description) dropData.description = validator.escape(dropData.description);

    // Validate dates
    if (dropData.releaseDate && !validator.isISO8601(dropData.releaseDate)) {
        return next(new AppError("Invalid releaseDate format", 400));
    }
    if (dropData.endDate && !validator.isISO8601(dropData.endDate)) {
        return next(new AppError("Invalid endDate format", 400));
    }

    try {
        const newDrop = new Drop({
            ...dropData,
            isPublished : true,
            isArchived : false
        })

        await newDrop.save()

        res.status(201).json({
            success : true,
            message : "New Drop created successfully",
            drop : newDrop
        })
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError("Drop with this slug already exists", 400));
        }
        throw error;
    }
})

module.exports = {
    createDrop
}