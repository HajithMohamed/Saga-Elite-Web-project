const catchAsync = require("../Utils/catchAsync");

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
      search,
      sort,
    } = req.query;

    const matchStage = {
      isActive: true,
    };

    /* ========= Variant Size Filter ========= */
    if (size) {
      matchStage["variants.size"] = {
        $in: size.split(","),
      };
    }

    /* ========= Brand / Category ========= */
    if (brand) matchStage.brand = brand;
    if (category) matchStage.category = category;

    /* ========= Variant Color ========= */
    if (color) {
      matchStage["variants.color"] = color;
    }

    /* ========= Price Filter ========= */
    if (minPrice || maxPrice) {
      matchStage.basePrice = {};
      if (minPrice) matchStage.basePrice.$gte = Number(minPrice);
      if (maxPrice) matchStage.basePrice.$lte = Number(maxPrice);
    }

    /* ========= Search ========= */
    if (search) {
      matchStage.$or = [
        { artNo: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    /* ========= Sorting ========= */
    let sortStage = { createdAt: -1 };

    if (sort) {
      const field = sort.startsWith("-")
        ? sort.substring(1)
        : sort;
      sortStage = {
        [field]: sort.startsWith("-") ? -1 : 1,
      };
    }

    /* ========= Aggregation ========= */
    const data = await Model.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "images",
          localField: "_id",
          foreignField: "refId",
          as: "images",
        },
      },

      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalDocuments = await Model.countDocuments(matchStage);

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