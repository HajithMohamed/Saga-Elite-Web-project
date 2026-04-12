const express = require('express');
const router = express.Router();

const { getAllProducts, getSingleProduct, addProduct, updateProduct, deleteProduct, getAdminAnalytics } = require("../Controllers/product-controller");
const paginatedResult = require("../Middlewares/pagination-middleware");
const Product = require("../Models/Product");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");

router.get("/get-all-products", paginatedResult(Product), getAllProducts);
router.get("/get-single-product/:slug", getSingleProduct);
router.get("/analytics", authMiddleware, adminMiddleware, getAdminAnalytics);
router.post("/add-product", authMiddleware, adminMiddleware, addProduct);
router.patch("/update-product/:slug", authMiddleware, adminMiddleware, updateProduct);
router.delete("/delete-product/:slug", authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;