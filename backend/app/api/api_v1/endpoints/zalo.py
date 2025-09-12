from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os
import logging

from app.schemas.zalo import ZaloPhoneRequest, ZaloPhoneResponse

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/test")
async def test_zalo():
    """Simple test endpoint to verify Zalo router works"""
    return {"message": "Zalo router is working!", "status": "success"}

@router.post("/phone", response_model=ZaloPhoneResponse)
async def resolve_zalo_phone(request: ZaloPhoneRequest):
    """
    Resolve Zalo Mini App phone number using Zalo Open API
    """
    try:
        # Get secret key from environment
        secret_key = os.getenv("ZALO_SECRET_KEY")
        if not secret_key:
            logger.error("ZALO_SECRET_KEY environment variable is not set")
            raise HTTPException(status_code=500, detail="Zalo configuration missing")
        
        # Prepare form data for Zalo API
        form_data = {
            "code": request.token,
            "access_token": request.access_token,
            "secret_key": secret_key
        }
        
        # Call Zalo Open API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://graph.zalo.me/v2.0/miniapp/phone/getphone",
                data=form_data,
                timeout=30.0
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
                logger.info(f"Zalo API response data: {response_data}")
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
            
            # Extract phone number
            phone_data = response_data.get("data", {})
            phone_number = phone_data.get("number")
            
            if not phone_number:
                logger.error("Phone number not found in Zalo API response")
                raise HTTPException(status_code=400, detail="Phone number not found in response")
            
            logger.info(f"Successfully resolved phone number: {phone_number}")
            return ZaloPhoneResponse(number=phone_number)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in resolve_zalo_phone: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
