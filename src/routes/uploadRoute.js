import express from "express";
import { uploadMiddleware } from "../middlewares/s3Upload.js";
import { handleImageUpload } from "../controllers/uploadController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 'image'는 프론트엔드에서 보낼 때의 field name입니다.
router.post("/", protect, uploadMiddleware.single("image"), handleImageUpload);

export default router;
