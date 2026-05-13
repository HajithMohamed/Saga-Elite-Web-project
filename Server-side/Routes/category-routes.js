const express = require("express");
const router = express.Router();
const categoryController = require("../Controllers/category-controller");

// Public category endpoints
router.get('/', categoryController.getAll);
router.get("/menu", categoryController.getMenu);
router.get("/featured", categoryController.getFeatured);
router.get("/:slug", categoryController.getBySlug);

module.exports = router;
