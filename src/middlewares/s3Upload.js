import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";

dotenv.config();

// 1. AWS S3 클라이언트 설정
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 2. 멀터(Multer) 설정: S3에 저장하도록 구성
export const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: "public-read", // 누구나 URL을 통해 볼 수 있게 설정 (보안 정책에 따라 변경 가능)
    contentType: multerS3.AUTO_CONTENT_TYPE, // 브라우저에서 바로 보이도록 타입 자동 설정
    key: (req, file, cb) => {
      // 파일명을 'uploads/날짜_원본파일명'으로 저장하여 중복 방지
      const fileName = `uploads/${Date.now()}_${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 파일 크기 제한 (5MB)
});
