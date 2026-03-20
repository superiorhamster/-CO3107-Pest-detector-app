import os
import cv2
import numpy as np
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL_DIR = "models"
loaded_models = {} # Cache lưu các model đã tải để tránh giật lag

@app.get("/models")
async def list_models():
    """Trả về danh sách các file .pt có trong thư mục models"""
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
    
    files = [f for f in os.listdir(MODEL_DIR) if f.endswith(".pt")]
    return {"models": files}

@app.post("/detect")
async def detect_object(model_name: str = Form(...), file: UploadFile = File(...)):
    """Nhận diện dựa trên model được chọn"""
    model_path = os.path.join(MODEL_DIR, model_name)
    
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy mô hình này!")

    # Tải mô hình nếu chưa có trong cache
    if model_name not in loaded_models:
        loaded_models[model_name] = YOLO(model_path)
    
    model = loaded_models[model_name]

    # Đọc và xử lý ảnh
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Dự đoán và vẽ
    results = model(img)
    res_plotted = results[0].plot()

    # Chuyển về Base64
    _, buffer = cv2.imencode('.jpg', res_plotted)
    return {"image_base64": base64.b64encode(buffer).decode('utf-8')}