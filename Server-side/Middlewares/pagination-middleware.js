const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");

const paginatedResult = (Model) =>
  catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      size,
      brand,
      category,
      color,
      minPrice,
      maxPrice,
      maxStock,
      search,
      sort,
      isActive,
      drop,
      status, // drop status: active or archive
    } = req.query;

    const matchStage = {};

    if (isActive === "false") {
      matchStage.isActive = false;
    } else if (isActive === "all") {
      // no filter for active state
    } else {
      matchStage.isActive = true;
    }

    if (drop) {
      try {
        matchStage.drop = new mongoose.Types.ObjectId(drop); // FIX 1: added `new` keyword
      } catch (error) {
        return next(new AppError("Invalid drop id", 400));
      }
    }

    /* ========= Variant Size Filter ========= */
    if (size) {
      matchStage.variants = {
        $elemMatch: { size: { $in: size.split(",") } },
      };
    }

    /* ========= Brand / Category ========= */
    if (brand) matchStage.brand = brand;
    if (category) matchStage.category = category;

    /* ========= Variant Color Filter ========= */
    // FIX 2: Merged size and color into a single $elemMatch to avoid overwriting
    if (color) {
      if (size) {
        matchStage.variants = {
          $elemMatch: { size: { $in: size.split(",") }, color },
        };
      } else {
        matchStage.variants = {
          $elemMatch: { color },
        };
      }
    }

    /* ========= Price Filter ========= */
    if (minPrice || maxPrice) {
      if (minPrice && isNaN(Number(minPrice))) {
        return next(new AppError("minPrice must be a number", 400));
      }
      if (maxPrice && isNaN(Number(maxPrice))) {
        return next(new AppError("maxPrice must be a number", 400));
      }
      matchStage.basePrice = {};
      if (minPrice) matchStage.basePrice.$gte = Number(minPrice);
      if (maxPrice) matchStage.basePrice.$lte = Number(maxPrice);
    }

    /* ========= Stock Ceiling Filter ========= */
    if (typeof maxStock !== "undefined" && maxStock !== "") {
      const parsedMaxStock = Number(maxStock);
      if (Number.isNaN(parsedMaxStock)) {
        return next(new AppError("maxStock must be a number", 400));
      }
      matchStage.totalStock = { $lte: parsedMaxStock };
    }

    /* ========= Search ========= */
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchStage.$or = [
        { artNo: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
        { name: { $regex: safeSearch, $options: "i" } },
      ];
    }

    /* ========= Sorting ========= */
    let sortStage = { createdAt: -1 };

    if (sort) {
      const field = sort.startsWith("-") ? sort.slice(1) : sort;
      sortStage = {
        [field]: sort.startsWith("-") ? -1 : 1,
      };
    }

    /* ========= Aggregation Pipeline ========= */
    // FIX 3: Changed `const data = await Model.aggregate([...];` to a proper `pipeline` array
    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "images",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$refId", "$$productId"] },
                    { $eq: ["$refModel", "Product"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            { $sort: { order: 1 } },
          ],
          as: "images",
        },
      },
      {
        $lookup: {
          from: "drops",
          localField: "drop",
          foreignField: "_id",
          as: "drop",
        },
      },
      {
        $unwind: {
          path: "$drop",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]; // FIX 4: Closed the array with `]` and `;` instead of `];` inside an incomplete expression

    /* ========= Status Filter (post-lookup) ========= */
    if (status === "active") {
      const now = new Date();
      pipeline.push({
        $match: {
          "drop.endDate": { $gt: now },
          "drop.releaseDate": { $lte: now },
        },
      });
    } else if (status === "archive") {
      const now = new Date();
      pipeline.push({
        $match: {
          $or: [
            { "drop.endDate": { $lte: now } },
            { drop: { $exists: false } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit }
    );

    const data = await Model.aggregate(pipeline); // FIX 5: Removed duplicate `const data` declaration

    /* ========= Total Count ========= */
    // FIX 6: For status-filtered results, run a separate count pipeline instead of using data.length
    let totalDocuments;
    if (status) {
      const countPipeline = [...pipeline];
      // Remove sort/skip/limit to get the true total
      countPipeline.splice(-3, 3);
      countPipeline.push({ $count: "total" });
      const countResult = await Model.aggregate(countPipeline);
      totalDocuments = countResult.length > 0 ? countResult[0].total : 0;
    } else {
      totalDocuments = await Model.countDocuments(matchStage);
    }

    const results = {
      total: totalDocuments,
      page,
      limit,
      results: data.length,
      data,
    };

    if (skip + limit < totalDocuments) {
      results.next = { page: page + 1, limit };
    }

    if (skip > 0) {
      results.previous = { page: page - 1, limit };
    }

    res.paginatedResults = results;
    next();
  });

module.exports = paginatedResult;