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
    """
    Resolve Zalo Mini App phone number using Zalo Open API
    Reference: https://miniapp.zaloplatforms.com/documents/api/getPhoneNumber/
    """
    try:
        # Get credentials from settings (with fallback to env)
        secret_key = settings.ZALO_SECRET_KEY or os.getenv("ZALO_SECRET_KEY")
        if not secret_key:
            logger.error("ZALO_SECRET_KEY is not configured")
            raise HTTPException(status_code=500, detail="Zalo configuration missing")
        
        # Prepare form data for Zalo API (must use form-data, not JSON)
        # According to Zalo Mini App docs: https://miniapp.zaloplatforms.com/documents/api/getPhoneNumber/
        form_data = {
            "code": request.token,
            "access_token": request.access_token,
            "secret_key": secret_key
        }
        
        logger.info(f"Calling Zalo API with code: {request.token[:10]}... and access_token: {request.access_token[:10]}...")
        
        # Call Zalo Open API for phone number
        # Try the correct endpoint for Mini App phone number
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openapi.zalo.me/v2.0/me/phone",
                data=form_data,  # Use data (form-data) not json
                timeout=30.0,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            
            logger.info(f"Zalo API response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Zalo API returned status {response.status_code}: {response.text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Zalo API error: HTTP {response.status_code}"
                )
            
            # Parse response
            try:
                response_data = response.json()
                logger.info(f"Zalo API response: {response_data}")
            except Exception as e:
                logger.error(f"Failed to parse Zalo API response: {e}")
                raise HTTPException(status_code=400, detail="Invalid response from Zalo API")
            
            # Check for error in response
            error_code = response_data.get("error", 0)
            if error_code != 0:
                error_message = response_data.get("message", "Unknown error from Zalo API")
                logger.error(f"Zalo API returned error {error_code}: {error_message}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Zalo API error {error_code}: {error_message}"
                )
            
            # Extract phone number - check both possible response formats
            phone_data = response_data.get("data", {})
            phone_number = phone_data.get("number") or phone_data.get("phone")
            
            # Also check direct fields in case of different response structure
            if not phone_number:
                phone_number = response_data.get("number") or response_data.get("phone")
            
            if not phone_number:
                logger.error(f"Phone number not found in Zalo API response: {response_data}")
                raise HTTPException(status_code=400, detail="Phone number not found in response")
            
            logger.info(f"Successfully resolved phone number: {phone_number}")
            return ZaloPhoneResponse(number=phone_number)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in resolve_zalo_phone: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
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