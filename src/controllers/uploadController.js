import { Upload } from "../models/Upload.js";
import fetch from "node-fetch"; // FastAPI 통신을 위한 fetch

export const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "파일이 없습니다." });

    let { sourceContext, category, style, texture } = req.body;
    const imageUrl = req.file.location; // S3가 돌려준 URL

    // 🌟 FastAPI 서버로 소재 분석 요청
    try {
      const mlResponse = await fetch("http://localhost:8000/predict/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl })
      });
      
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        if (mlData.success && mlData.texture) {
          // 기존에 유저가 선택한 소재가 없거나, AI로 무조건 덮어쓸 경우
          texture = mlData.texture; 
        }
      } else {
        console.warn("AI 소재 분류 서버에서 오류를 반환했습니다.");
      }
    } catch (err) {
      console.warn("AI 소재 분류 서버에 연결할 수 없습니다. 기본값을 유지합니다.", err.message);
    }

    // DB 저장 (S3 URL 및 AI가 분석한 소재 포함)
    const newRecord = await Upload.create({
      userId: req.user.id,
      imageUrl: imageUrl, 
      sourceContext,
      aiAnalysis: { category, style, texture },
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
};
