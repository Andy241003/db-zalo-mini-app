# =====================================================
# Deploy Backend lên VPS Việt Nam (157.10.199.22)
# Chạy: .\deploy_vps.ps1
# Yêu cầu: ssh key đã được setup hoặc nhập password
# =====================================================

param(
    [string]$VpsUser = "root",
    [string]$VpsHost = "157.10.199.22",
    [string]$RemotePath = "/var/www/hotel-backend"
)

$SshTarget = "$VpsUser@$VpsHost"

Write-Host "🚀 Deploy Backend lên VPS Vietnam ($VpsHost)" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Bước 1: Upload code backend lên VPS
Write-Host "`n📦 Bước 1: Upload code lên VPS..." -ForegroundColor Yellow

$RsyncExcludes = @(
    "--exclude=venv/",
    "--exclude=.venv/",
    "--exclude=__pycache__/",
    "--exclude=*.pyc",
    "--exclude=*.log",
    "--exclude=logs/",
    "--exclude=.git/",
    "--exclude=.env",
    "--exclude=uploads/",
    "--exclude=*.tmp"
)

$RsyncCmd = "rsync -avz --progress $($RsyncExcludes -join ' ') backend/ ${SshTarget}:${RemotePath}/backend/"
Write-Host "Running: $RsyncCmd" -ForegroundColor Gray
Invoke-Expression $RsyncCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload thất bại! Kiểm tra SSH connection." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Upload thành công!" -ForegroundColor Green

# Bước 2: SSH vào VPS và cài đặt + restart service
Write-Host "`n🔧 Bước 2: Cài dependencies và restart service..." -ForegroundColor Yellow

$SetupScript = @"
set -e
cd $RemotePath

# Tạo venv nếu chưa có
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3.11 -m venv venv || python3 -m venv venv
fi

# Activate venv và install dependencies
source venv/bin/activate
pip install --upgrade pip --quiet
pip install -r backend/app/requirements.txt --quiet

echo "✅ Dependencies installed"

# Tạo .env nếu chưa có
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'ENVEOF'
DATABASE_URL=mysql+pymysql://vp_admin:bI9SmNMOEbXC5%40b%2F@127.0.0.1:3306/zalo-mini-app
USE_LOCAL_DB=False
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENVEOF
    echo "✅ .env created"
else
    echo "✅ .env already exists"
fi

# Restart systemd service nếu có
if systemctl is-active --quiet hotel-backend 2>/dev/null; then
    systemctl restart hotel-backend
    echo "✅ Service hotel-backend restarted"
elif systemctl is-active --quiet zalo-backend 2>/dev/null; then
    systemctl restart zalo-backend
    echo "✅ Service zalo-backend restarted"
else
    echo "⚠️  Không tìm thấy systemd service. Chạy thủ công:"
    echo "   cd $RemotePath && source venv/bin/activate"
    echo "   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 2"
fi

# Kiểm tra service
sleep 2
if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend đang chạy tại localhost:8000"
else
    curl -s http://localhost:8000/docs > /dev/null 2>&1 && echo "✅ Backend OK" || echo "⚠️  Backend chưa sẵn sàng - kiểm tra log"
fi
"@

ssh $SshTarget $SetupScript

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy thành công!" -ForegroundColor Green
    Write-Host "🌐 Backend URL: https://zalominiapp.vtlink.vn/api/v1" -ForegroundColor Cyan
    Write-Host "📖 API Docs:    https://zalominiapp.vtlink.vn/docs" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Có lỗi — kiểm tra output ở trên." -ForegroundColor Red
}
