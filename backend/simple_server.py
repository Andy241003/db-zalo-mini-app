from fastapi import FastAPI
from fastapi.responses import JSONResponse
import httpx
import os

app = FastAPI(title="Simple Zalo Test Server")

@app.post("/zalo/phone")
async def resolve_phone():
    """Simple test endpoint for Zalo phone resolution"""
    return JSONResponse({
        "message": "Zalo endpoint working!",
        "status": "success"
    })

@app.get("/")
async def root():
    return {"message": "Simple test server is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
