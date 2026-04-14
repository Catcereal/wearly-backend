import { Upload } from "../models/Upload.js";

export const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "파일이 없습니다." });

    const { sourceContext, category, style, texture } = req.body;

    // DB 저장 (S3 URL 포함)
    const newRecord = await Upload.create({
      userId: req.user.id,
      imageUrl: req.file.location, // S3가 돌려준 URL
      sourceContext,
      aiAnalysis: { category, style, texture },
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};
