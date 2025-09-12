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

@router.post("/debug", response_model=ZaloPhoneResponse)
async def debug_zalo_phone(request: ZaloPhoneRequest):
    """Debug endpoint with detailed logging"""
    try:
        logger.info(f"=== DEBUG ZALO PHONE START ===")
        logger.info(f"Request token: {request.token[:20]}...")
        logger.info(f"Request access_token: {request.access_token[:20]}...")
        
        # Check secret key
        secret_key = settings.ZALO_SECRET_KEY or os.getenv("ZALO_SECRET_KEY")
        logger.info(f"Secret key available: {bool(secret_key)}")
        
        if not secret_key:
            logger.error("ZALO_SECRET_KEY is not configured")
            return ZaloPhoneResponse(number="ERROR: No secret key")
        
        # Test httpx client
        async with httpx.AsyncClient() as client:
            logger.info("Testing httpx client with simple request...")
            try:
                test_response = await client.get("https://httpbin.org/get", timeout=5.0)
                logger.info(f"Test request successful: {test_response.status_code}")
            except Exception as e:
                logger.error(f"Test request failed: {e}")
                return ZaloPhoneResponse(number="ERROR: HTTP client failed")
        
        logger.info("=== DEBUG ZALO PHONE END ===")
        return ZaloPhoneResponse(number="DEBUG SUCCESS")
        
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}", exc_info=True)
        return ZaloPhoneResponse(number=f"DEBUG ERROR: {str(e)}")

@router.post("/test-connection")
async def test_zalo_connection():
    """Test basic connection to Zalo API without authentication"""
    try:
        async with httpx.AsyncClient() as client:
            # Test basic connectivity to Zalo domain
            try:
                response = await client.get("https://openapi.zalo.me", timeout=3.0)
                return {
                    "status": "success",
                    "message": f"Can connect to Zalo API: {response.status_code}",
                    "url": "https://openapi.zalo.me"
                }
            except httpx.TimeoutException:
                return {
                    "status": "timeout",
                    "message": "Timeout connecting to Zalo API",
                    "url": "https://openapi.zalo.me"
                }
            except Exception as e:
                return {
                    "status": "error", 
                    "message": f"Connection error: {str(e)}",
                    "url": "https://openapi.zalo.me"
                }
    except Exception as e:
        return {
            "status": "fatal_error",
            "message": f"Fatal error: {str(e)}"
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
        
        logger.info(f"Calling Zalo API with code: {request.token[:10]}... and access_token: {request.access_token[:10]}...")
        
        # Call Zalo Open API for phone number
        # According to the actual implementation, Zalo uses headers, not form-data
        # Endpoint: https://graph.zalo.me/v2.0/me/info (not /phone)
        async with httpx.AsyncClient() as client:
            try:
                logger.info(f"Calling Zalo API: https://graph.zalo.me/v2.0/me/info")
                response = await client.get(
                    "https://graph.zalo.me/v2.0/me/info",
                    headers={
                        "access_token": request.access_token,
                        "code": request.token,  # This is the token returned by getPhoneNumber() in Mini App
                        "secret_key": secret_key
                    },
                    timeout=8.0
                )
                logger.info(f"Zalo API response received: status={response.status_code}")
                
            except httpx.TimeoutException as e:
                logger.error(f"Zalo API timeout: {e}")
                raise HTTPException(status_code=408, detail="Zalo API timeout - token may be expired (2 minutes)")
            except httpx.RequestError as e:
                logger.error(f"Zalo API request error: {e}")
                raise HTTPException(status_code=502, detail="Zalo API connection error")
            
            logger.info(f"Zalo API response status: {response.status_code}")
            
            if response.status_code != 200:
                response_text = response.text
                logger.error(f"Zalo API returned status {response.status_code}: {response_text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Zalo API error: HTTP {response.status_code} - {response_text}"
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
        logger.error(f"Unexpected error in resolve_zalo_phone: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")