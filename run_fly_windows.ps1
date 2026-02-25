# PowerShell helper to deploy to Fly.io (Windows)
# Run from repository root (d:\zalo-mini-app\be-zalo-mini-app\zalo_be)

# 1) Install flyctl (if not installed) - run in an elevated PowerShell
# winget install --id Fly.io.Flyctl -e

# 2) Login
flyctl auth login

# 3) Launch (interactive) - use --no-deploy to only create app and fly.toml
flyctl launch --name zalo-mini-app-backend --no-deploy

# 4) Build & Deploy
flyctl deploy

# 5) Set secrets (example)
# flyctl secrets set SECRET_KEY="your_secret_here"
# flyctl secrets set USE_LOCAL_DB=false
# flyctl secrets set DATABASE_URL="mysql+pymysql://user:pass@host:3306/dbname"

# 6) Check logs
flyctl logs -a zalo-mini-app-backend
