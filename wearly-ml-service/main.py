from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from io import BytesIO
import uvicorn

# 모델 불러오기 (서버 시작 시 1번만 메모리에 올립니다)
from model_loader import load_model, predict_material

app = FastAPI(title="Wearly ML Service - Material Classification")

# 전역 변수로 모델 로드
ai_model = load_model("weights/model.pth")

class ImageAnalysisRequest(BaseModel):
    image_url: str

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ML Service is running."}

@app.post("/predict/material")
async def analyze_material(request: ImageAnalysisRequest):
    """
    Node.js 백엔드로부터 이미지 URL을 받아서 소재를 분류하는 엔드포인트
    """
    try:
        # 1. S3(또는 웹)에서 이미지 다운로드
        response = requests.get(request.image_url)
        response.raise_for_status()
        
        # 2. 이미지를 메모리에서 읽기
        image_bytes = BytesIO(response.content)
        
        # 3. 모델로 추론 (소재 분류)
        material_result = predict_material(ai_model, image_bytes)
        
        # 4. 결과 반환
        return {
            "success": True, 
            "texture": material_result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # 포트 8000에서 FastAPI 서버 실행
    uvicorn.run(app, host="0.0.0.0", port=8000)
