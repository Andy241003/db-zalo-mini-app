# Hướng dẫn Deploy Backend lên Render (Fix Python 3.14 → 3.11)

## Vấn đề hiện tại
- Render đang dùng Python 3.14.3 (mặc định)
- FastAPI 0.104.1 + Pydantic 1.10.13 không tương thích với Python 3.14
- Lỗi: `pydantic.errors.ConfigError: unable to infer type for attribute "name"`

## Giải pháp: Recreate service bằng Blueprint

### Bước 1: Xóa service backend cũ (Tuỳ chọn)
1. Render Dashboard → chọn service backend hiện tại
2. Settings (scroll xuống cuối) → **Delete Service**
3. Confirm xóa

### Bước 2: Tạo service mới bằng Blueprint
1. Render Dashboard → **New +** → **Blueprint**
2. Nếu chưa connect GitHub:
   - Click **Connect account**
   - Authorize GitHub
3. Chọn repository: `Andy241003/db-zalo-mini-app`
4. Branch: `main`
5. Click **Apply**

### Bước 3: Render tự động deploy
Render sẽ:
- Đọc `render.yaml` trong repo
- Đọc `runtime.txt` (khóa Python 3.11.9)
- Tạo backend service với config:
  - Root Directory: `backend`
  - Build: `pip install -r app/requirements.txt`
  - Start: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Build và deploy tự động

### Bước 4: Thêm biến môi trường (SAU KHI service running)
1. Vào backend service → **Environment**
2. Click **Add Environment Variable** và thêm:

```
USE_LOCAL_DB=False
SECRET_KEY=your-super-secret-key-change-me-in-production-min-32-chars
DATABASE_URL=mysql+pymysql://username:password@host:3306/database_name
ZALO_APP_ID=your_zalo_app_id
ZALO_SECRET_KEY=your_zalo_secret_key
```

3. Click **Save Changes**
4. Service sẽ tự động redeploy

### Bước 5: Kiểm tra deployment
1. **Logs**: Render Dashboard → service → Logs
   - Kiểm tra: `Using Python version 3.11.9` (KHÔNG phải 3.14)
   - Xem có lỗi startup không

2. **Health check**:
   ```bash
   curl https://your-backend-service.onrender.com/health
   ```
   Phải trả về: `{"status": "healthy"}`

3. **API test**:
   ```bash
   curl https://your-backend-service.onrender.com/
   ```

## Config chi tiết trong repo

### File quan trọng đã chuẩn bị sẵn:
- ✅ `render.yaml` - Cấu hình service (Python 3.11, build/start commands)
- ✅ `runtime.txt` - Khóa Python version: `python-3.11.9`
- ✅ `requirements.txt` (root) - Forward tới `backend/app/requirements.txt`
- ✅ `backend/app/requirements.txt` - Dependencies (FastAPI 0.104.1, Pydantic 1.10.13)

### Nội dung render.yaml:
```yaml
services:
  - type: web
    name: zalo-mini-app-backend
    runtime: python
    pythonVersion: 3.11
    rootDir: backend
    buildCommand: pip install -r app/requirements.txt
    startCommand: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Nếu vẫn gặp lỗi

### Lỗi: ModuleNotFoundError: No module named 'backend'
→ Check Root Directory = `backend` và Start Command đúng

### Lỗi: Could not open requirements file
→ Check Build Command = `pip install -r app/requirements.txt` (với Root Directory = `backend`)

### Lỗi: Python 3.14 vẫn được dùng
→ Service chưa được recreate bằng Blueprint. Xóa service cũ và tạo lại.

### Lỗi: pydantic.errors.ConfigError
→ Python version sai (phải là 3.11, không phải 3.14)

## Sau khi Backend OK

### Update Frontend
1. Render → Frontend Static Site → Environment
2. Thêm biến:
   ```
   VITE_API_BASE_URL=https://your-backend-service.onrender.com
   ```
3. Manual Deploy frontend

## Database Setup

### Option 1: MySQL External (Khuyến nghị cho production)
- Dùng service như PlanetScale, AWS RDS, hoặc Render MySQL
- Set `DATABASE_URL` trong env vars

### Option 2: Render Postgres (Managed)
- Render Dashboard → New → PostgreSQL
- Copy connection string và set vào `DATABASE_URL`
- **LƯU Ý**: Phải đổi driver từ `mysql+pymysql://` → `postgresql://`

## Troubleshooting

### Check logs real-time:
```bash
# Install Render CLI (optional)
npm install -g render-cli
render login
render logs -s <service-id>
```

### Test local trước khi deploy:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r app/requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Support
- Render Docs: https://render.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Pydantic v1 Docs: https://docs.pydantic.dev/1.10/
