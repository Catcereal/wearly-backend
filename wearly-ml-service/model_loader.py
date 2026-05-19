import torch
import torch.nn as nn
from torchvision import transforms, models
from torchvision.models import ResNet50_Weights, ViT_B_16_Weights
from PIL import Image

# CPU 환경 또는 GPU 환경 설정 (FastAPI 서버용)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 11개 클래스 정의 (학습에 사용된 그대로)
CLASSES = [
    "폴리에스터", "면", "데님", "레이온", "아크릴", 
    "울", "나일론", "레더(아우터)", "가죽(신발)", "스웨이드", "기타 섬유"
]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}
IDX_TO_CLASS = {i: c for i, c in enumerate(CLASSES)}

# --- 앙상블 모델 정의 (ResNet50 + ViT) ---
class ResNetViTEnsemble(nn.Module):
    def __init__(self, num_classes=11):
        super(ResNetViTEnsemble, self).__init__()
        
        # 1. ResNet50 백본 로드
        self.resnet = models.resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)
        resnet_out_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Identity() # 최종 분류층 제거 (특징만 추출)
        
        # 2. ViT-B/16 백본 로드
        self.vit = models.vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)
        vit_out_features = self.vit.heads.head.in_features
        self.vit.heads.head = nn.Identity() # 최종 분류층 제거 (특징만 추출)
        
        # 3. 결합된 특징을 받을 최종 분류기
        # ResNet 특징 (2048) + ViT 특징 (768) = 2816
        combined_features = resnet_out_features + vit_out_features
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(combined_features, 512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        # 각각의 백본을 통과
        res_features = self.resnet(x) # [Batch, 2048]
        vit_features = self.vit(x)    # [Batch, 768]
        
        # 특징 병합 (Concatenation)
        combined = torch.cat((res_features, vit_features), dim=1) # [Batch, 2816]
        
        # 최종 분류
        out = self.classifier(combined)
        return out

# --- 추론을 위한 이미지 전처리 파이프라인 ---
def get_val_transform():
    return transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

# --- FastAPI와 연결될 함수들 ---
def load_model(weights_path="weights/model.pth"):
    """
    저장된 .pth 파일을 불러와서 모델에 적용하는 함수 (서버 구동 시 1회 실행)
    """
    model = ResNetViTEnsemble(num_classes=len(CLASSES))
    model.to(device)
    
    # 모델 가중치 불러오기
    try:
        # weights_only=True로 설정하면 보안 경고 방지
        model.load_state_dict(torch.load(weights_path, map_location=device, weights_only=True))
        model.eval() # 추론 모드로 전환
        print(f"✅ 모델 가중치를 성공적으로 불러왔습니다: {weights_path} ({device})")
    except Exception as e:
        print(f"⚠️ 모델 가중치를 불러오는 데 실패했습니다 (학습되지 않은 상태로 실행됨): {e}")
        model.eval()
        
    return model

def predict_material(model, image_path_or_file):
    """
    FastAPI에서 이미지를 넘겨받아 최종 소재를 예측하는 함수
    """
    val_transform = get_val_transform()
    
    # 이미지가 파일 경로이거나 메모리의 BytesIO 객체일 수 있음
    image = Image.open(image_path_or_file).convert("RGB")
    image_tensor = val_transform(image).unsqueeze(0).to(device) # [1, 3, 224, 224]
    
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        top_prob, top_class = torch.max(probabilities, 1)
    
    # 예측된 클래스 텍스트 추출
    pred_class_name = IDX_TO_CLASS[top_class.item()]
    confidence = top_prob.item() * 100
    
    print(f"[추론 완료] 예측 소재: {pred_class_name} (신뢰도: {confidence:.2f}%)")
    
    return pred_class_name
