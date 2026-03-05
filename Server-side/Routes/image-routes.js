const express = require("express");
const {uploadImages,getDropImages,getProductImages} = require("../Controllers/image-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware")
const upload = require("../Middlewares/multer-middleware");

const router = express.Router()

// use upload.any() so multer accepts files regardless of the field name in the multipart form
// (the controller will still enforce a max of 10 files)
router.post("/upload-image", authMiddleware, adminMiddleware, upload.any(), uploadImages);
router.get("get-product-images/:id",authMiddleware,adminMiddleware,getProductImages);
router.get("get-drop-images",authMiddleware,adminMiddleware,getDropImages);



module.exports = router