const express = require('express');
const router = express.Router();

const {
    createDrop,
    getAllDrops,
    getSingleDrop,
    updateDrop,
    deleteDrop,
    archiveDrop,
} = require("../Controllers/drop-controller");
const authMiddleware = require("../Middlewares/auth-middleware");
const adminMiddleware = require("../Middlewares/admin-middleware");
const optionalAuthMiddleware = require("../Middlewares/optional-auth-middleware");

router.get("/get-all-drops", optionalAuthMiddleware, getAllDrops);
router.get("/get-single-drop/:slug", getSingleDrop);
router.post("/create-drop", authMiddleware, adminMiddleware, createDrop);
router.patch("/update-drop/:slug", authMiddleware, adminMiddleware, updateDrop);
router.patch("/archive-drop/:slug", authMiddleware, adminMiddleware, archiveDrop);
router.delete("/delete-drop/:slug", authMiddleware, adminMiddleware, deleteDrop);

module.exports = router;