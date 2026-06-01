# Interview Prep cho dự án Pest Detector App

Tài liệu này giúp bạn ôn nhanh đúng theo code hiện tại của repo trước khi phỏng vấn.

## 1) Kiến trúc tổng thể FE-BE

### Bạn cần nắm
- Frontend: React + Vite ở `frontend/src/App.jsx`.
- Backend: FastAPI ở `backend/main.py`.
- Giao tiếp qua REST API:
  - `GET /models`: lấy danh sách model `.pt`.
  - `POST /detect`: gửi `multipart/form-data` gồm ảnh + tên model.
- Luồng dữ liệu chính:
  1. FE gọi `/models` để hiển thị model trong `<select>`.
  2. Người dùng chọn ảnh + model.
  3. FE gửi `FormData` sang `/detect`.
  4. BE chạy YOLO, trả `image_base64`.
  5. FE render bằng `data:image/jpeg;base64,...`.

### Câu hỏi phỏng vấn thường gặp
- Vì sao tách FE và BE thành 2 service?
- Khi đổi domain/port thì điểm cấu hình nào cần thay?
- Ưu/nhược của việc trả ảnh base64 qua JSON so với trả file URL?

---

## 2) FastAPI backend

### Bạn cần nắm
- `FastAPI()` + CORS middleware (`allow_origins=["*"]`) hiện đang mở toàn bộ.
- `GET /models`:
  - Tạo thư mục `models` nếu chưa có.
  - Trả danh sách file đuôi `.pt`.
- `POST /detect`:
  - Nhận `model_name: Form(...)`, `file: UploadFile = File(...)`.
  - Kiểm tra file model tồn tại, nếu không thì `HTTPException(404)`.
  - Dùng cache `loaded_models` để tái sử dụng model đã load.

### Câu hỏi phỏng vấn thường gặp
- Vì sao dùng `UploadFile` thay vì gửi base64 từ client?
- Nếu muốn giới hạn định dạng/kích thước ảnh thì kiểm tra ở đâu?
- CORS hiện tại có rủi ro gì khi đưa production?

---

## 3) Computer Vision / YOLO cơ bản

### Bạn cần nắm
- Model YOLO được load từ file `.pt` trong `backend/models/`.
- Pipeline trong endpoint `/detect`:
  1. `await file.read()`.
  2. `np.frombuffer` + `cv2.imdecode` để đổi bytes -> ảnh OpenCV.
  3. `results = model(img)` để infer.
  4. `results[0].plot()` để vẽ bounding boxes.
  5. `cv2.imencode('.jpg', ...)` + `base64.b64encode(...)` để trả về FE.
- Ý nghĩa trade-off:
  - Model lớn: thường chính xác hơn nhưng chậm hơn.
  - Model nhỏ: nhanh hơn nhưng có thể giảm độ chính xác.

### Câu hỏi phỏng vấn thường gặp
- Vì sao chọn YOLO/Ultralytics cho bài toán này?
- Làm sao đo latency và accuracy một cách khách quan?
- Nếu ảnh đầu vào lỗi/không decode được thì cần xử lý thế nào?

---

## 4) Frontend React

### Bạn cần nắm
- State chính trong `App.jsx`:
  - `selectedFile`, `previewUrl`, `resultImage`, `loading`, `models`, `selectedModel`, `isDark`.
- `useEffect` để load model list khi mount.
- Upload bằng `FormData` trong `handleUpload`.
- Render kết quả bằng `src={\`data:image/jpeg;base64,${resultImage}\`}`.
- UX hiện có:
  - Preview ảnh trước khi detect.
  - Disable nút detect khi đang xử lý hoặc chưa có model.
  - Loading overlay trong lúc infer.

### Câu hỏi phỏng vấn thường gặp
- Vì sao quản lý state local thay vì dùng global state?
- Có nguy cơ memory leak nào với `URL.createObjectURL`?
- Cần bổ sung gì để hiển thị lỗi API thân thiện hơn cho người dùng?

---

## 5) Hiệu năng & triển khai thực tế

### Bạn cần nắm
- Điểm tối ưu đã có:
  - Cache model bằng `loaded_models` giảm chi phí load lại model.
- Điểm cần cải thiện để production:
  - Tách biến môi trường cho API URL (thay vì hard-code `http://localhost:8000`).
  - CORS whitelist theo domain thực tế.
  - Giới hạn kích thước file upload và validate MIME type.
  - Logging + monitoring (latency, error rate, throughput).
  - Cân nhắc hàng đợi/batching khi nhiều request đồng thời.

### Câu hỏi phỏng vấn thường gặp
- Khi traffic tăng, bottleneck nằm ở đâu (CPU/GPU, I/O, network)?
- Scale dọc hay scale ngang cho service inference?
- Dùng base64 có ảnh hưởng gì đến băng thông và kích thước payload?

---

## 6) Câu hỏi phản biện bạn nên tự luyện trả lời

1. Vì sao chọn **FastAPI + React** cho bài toán này?
2. Vì sao backend trả **base64** thay vì URL file tĩnh?
3. Nếu có **nhiều model** hơn, cách quản lý và preload như thế nào?
4. Nếu deploy production, bạn sẽ thay đổi gì về:
   - CORS
   - upload security
   - logging/monitoring
   - error handling
5. Nếu cần tăng tốc inference mà vẫn giữ chất lượng, bạn sẽ đánh đổi gì?

---

## Checklist ôn trước buổi phỏng vấn

- [ ] Mô tả trơn tru luồng FE -> BE -> YOLO -> FE trong 1-2 phút.
- [ ] Giải thích rõ input/output của 2 endpoint `/models` và `/detect`.
- [ ] Trình bày được cơ chế cache model và lợi ích latency.
- [ ] Nêu được ít nhất 3 rủi ro production và cách giảm rủi ro.
- [ ] Trả lời được câu hỏi “nếu làm lại, bạn sẽ cải tiến gì trước?”.
