Fly.io deploy instructions for this repo

Prerequisites
- Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
- Have a Fly account and `flyctl auth login`

Steps
1. From repository root (this repo contains `Dockerfile`):

```bash
# login
flyctl auth login

# create and configure a new app interactively (choose region)
flyctl launch --name zalo-mini-app-backend --no-deploy

# ensure fly.toml has the correct internal port (8080)
# open fly.toml and verify:
# [env]
#   PORT = "8080"

# deploy
flyctl deploy
```

2. Set runtime secrets (after deploy or before):

```bash
flyctl secrets set SECRET_KEY="your_secret_here"
flyctl secrets set USE_LOCAL_DB=false
# if using an external DB set DATABASE_URL
flyctl secrets set DATABASE_URL="mysql+pymysql://user:pass@host:3306/dbname"
```

3. Check logs:

```bash
flyctl logs -a zalo-mini-app-backend
```

Notes
- Dockerfile builds the `backend/` folder and runs `uvicorn app.main:app` on port 8080.
- If you want to run both frontend + backend on Fly, consider deploying the frontend separately (static site) or use a multi-service setup.
