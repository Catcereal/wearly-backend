import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 추천받은 코디 이미지의 S3 URL
    coordImageUrl: {
      type: String,
      required: true,
    },
    // 요구사항: 어떤 원본 옷 사진을 통해 추천받았는지 연결 (Traceability)
    sourceUploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: true,
    },
  },
  { timestamps: true },
);

export const Like = mongoose.model("Like", likeSchema);
