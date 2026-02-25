Fly.io (Windows) quick steps

1) Install flyctl via winget (PowerShell as Admin):

```powershell
winget install --id Fly.io.Flyctl -e
flyctl auth login
```

2) From repo root (this path):

```powershell
# create app skeleton
.\



















```flyctl logs -a zalo-mini-app-backend```powershell4) Logs:```flyctl secrets set USE_LOCAL_DB=falseflyctl secrets set SECRET_KEY="your_secret"```powershell3) Set secrets:```flyctl deployflyctl launch --name zalo-mini-app-backend --no-deploy# or run interactivelyun_fly_windows.ps1