const express = require('express');
const router = express.Router();

const {getAllProducts, getSingleProduct,addProduct} = require("../Controllers/product-controller");
const paginatedResult = require("../Middlewares/pagination-middleware");
const Product = require("../Models/Product");

router.get("/get-all-products", paginatedResult(Product), getAllProducts);
router.get("/get-single-product/:slug", getSingleProduct);
router.post("/add-product", addProduct);

module.exports = router;
