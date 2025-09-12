from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os
import logging

from app.schemas.zalo import ZaloPhoneRequest, ZaloPhoneResponse
from app.core.config import settings

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/test")
async def test_zalo():
    """Simple test endpoint to verify Zalo router works"""
    logger.info(f"ZALO_APP_ID from settings: {settings.ZALO_APP_ID}")
    logger.info(f"ZALO_SECRET_KEY from settings: {'***HIDDEN***' if settings.ZALO_SECRET_KEY else 'None'}")
    logger.info(f"ZALO_SECRET_KEY from os.getenv: {'***HIDDEN***' if os.getenv('ZALO_SECRET_KEY') else 'None'}")
    
    return {
        "message": "Zalo router is working!", 
        "status": "success",
        "config": {
            "app_id": settings.ZALO_APP_ID,
            "has_secret_from_settings": bool(settings.ZALO_SECRET_KEY),
            "has_secret_from_env": bool(os.getenv('ZALO_SECRET_KEY')),
            "env_file_location": os.path.abspath('.env') if os.path.exists('.env') else "Not found"
        }
    }

@router.post("/phone", response_model=ZaloPhoneResponse)
async def resolve_zalo_phone(request: ZaloPhoneRequest):
    try:
        secret_key = os.getenv("ZALO_SECRET_KEY")
        if not secret_key:
            raise HTTPException(status_code=500, detail="Zalo configuration missing")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://graph.zalo.me/v2.0/me/info",
                json={
                    "code": request.token,
                    "access_token": request.access_token,
                    "secret_key": secret_key
                },
                timeout=30.0
            )

        response_data = response.json()
        if "error" in response_data and response_data["error"] != 0:
            raise HTTPException(
                status_code=400,
                detail=f"Zalo API error {response_data['error']}: {response_data.get('message','Unknown')}"
            )

        phone_number = response_data.get("data", {}).get("number")
        if not phone_number:
            raise HTTPException(status_code=400, detail="Phone number not found in response")

        return ZaloPhoneResponse(number=phone_number)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")