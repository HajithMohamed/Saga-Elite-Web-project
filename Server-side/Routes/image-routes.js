const express = require("express");
const {uploadImages} = require("../Controllers/image-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware")

const router = express.Router()

router.post("/upload-image",authMiddleware,adminMiddleware,uploadImages);



module.exports = router