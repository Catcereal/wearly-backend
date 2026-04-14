import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // AWS S3에서 발급받은 이미지의 전체 URL 경로
    imageUrl: {
      type: String,
      required: true,
    },
    // 요구사항: 업로드한 페이지 출처 구분
    sourceContext: {
      type: String,
      enum: ["color", "style", "texture"],
      required: true,
    },
    // AI 모델의 분석 및 분류 결과
    aiAnalysis: {
      category: {
        type: String,
        enum: ["하의", "신발", "모자", "아우터", "상의"],
        required: true,
      },
      style: { type: String, default: null }, // 예: "스트릿"
      texture: { type: String, default: null }, // 예: "데님"
      confidence: { type: Number, default: 0 }, // AI 확신도
      mainColors: [String], // 추출된 색상 HEX 코드 배열
    },
  },
  { timestamps: true },
);

// 조회 성능 향상을 위해 userId와 sourceContext에 인덱스 설정
uploadSchema.index({ userId: 1, sourceContext: 1 });

export const Upload = mongoose.model("Upload", uploadSchema);
