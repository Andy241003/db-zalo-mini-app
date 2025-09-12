from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Import API endpoints
from app.api.api_v1.endpoints import (
    auth, rooms, services, tenants, vouchers, 
    booking_requests, customer_vouchers, customers,
    facilities, facility_features, games, hotel_brands, promotions,
    room_stays, service_bookings, admin_users, room_amenities, room_features, # experiences removed
    test_items, dashboard, file_management, tenant_management, booking_management, 
    customer_management, debug, profile, zalo  # Added Zalo Mini App integration
)

# Import database and models
from app.db.session_local import engine
from app.core.config import settings
from app.models.models import Base

# Import middleware
from app.middleware.logging_safe import RequestLoggingMiddlewareSafe
from app.middleware.security_safe import SecurityHeadersMiddlewareSafe
from app.middleware.performance_safe import PerformanceMonitoringMiddlewareSafe

# Import monitoring and error handling
from app.core.monitoring import health_checker, metrics_collector
from app.core.error_handling import error_handler, system_monitor

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Hotel Management SaaS Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware - ADD FIRST to avoid issues with preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if settings.BACKEND_CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add custom middleware (order matters - last added is executed first)
# Safe middleware that won't cause hanging
app.add_middleware(RequestLoggingMiddlewareSafe)
app.add_middleware(SecurityHeadersMiddlewareSafe)  
app.add_middleware(PerformanceMonitoringMiddlewareSafe)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for all unhandled exceptions"""
    
    # Log the error with context
    error_context = {
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    
    error_record = error_handler.handle_error(exc, error_context)
    
    # Trigger alert for critical errors
    if error_record["severity"] == "critical":
        system_monitor.alert_system.trigger_alert(
            alert_type="unhandled_exception",
            message=f"Unhandled exception: {error_record['error_type']} - {error_record['error_message']}",
            severity="critical",
            metadata=error_context
        )
    
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "error_id": error_record.get("timestamp"),
            "message": "An unexpected error occurred. Please try again later."
        }
    )

@app.on_event("startup")
async def on_startup():
    try:
        # Create database tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        
        # Initialize monitoring (skip health check to avoid connection timeout issues)
        logger.info("Monitoring system initialized")
        
        logger.info("Hotel Management SaaS Backend started successfully!")
        logger.info(f"Using database: {settings.DATABASE_URI}")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        # Log error but continue startup
        error_handler.handle_error(e, {"phase": "startup"})

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Hotel Management SaaS Backend shutting down...")
    
    # Log final metrics
    try:
        final_metrics = metrics_collector.get_metrics_summary()
        logger.info(f"Final metrics: {final_metrics}")
    except Exception as e:
        logger.error(f"Error getting final metrics: {e}")
    
    logger.info("Backend shutdown completed")

@app.get("/")
def read_root():
    return {
        "message": "Hotel Management SaaS Backend API", 
        "status": "operational",
        "version": "1.0.0",
        "environment": "production"
    }

# Enhanced health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    health_status = await health_checker.check_health()
    
    if health_status["status"] == "healthy":
        return health_status
    else:
        return JSONResponse(
            status_code=503,
            content=health_status
        )

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with all components"""
    return await health_checker.detailed_health_check()

@app.get("/metrics")
async def get_metrics():
    """Get application metrics"""
    return metrics_collector.get_metrics_summary()

@app.get("/system/status")
async def get_system_status():
    """Get comprehensive system status"""
    return system_monitor.get_system_status()

# Include routers for the imported modules
app.include_router(debug.router, prefix="/api/v1/debug", tags=["Debug - Simple Tests"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/v1", tags=["Profile"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(file_management.router, prefix="/api/v1", tags=["File Management"])
app.include_router(tenant_management.router, prefix="/api/v1", tags=["Tenant Management"])
app.include_router(booking_management.router, prefix="/api/v1", tags=["Booking Management"])
app.include_router(customer_management.router, prefix="/api/v1", tags=["Customer Management"])
app.include_router(admin_users.router, prefix="/api/v1", tags=["Admin Users"])
app.include_router(rooms.router, prefix="/api/v1", tags=["Rooms"])
app.include_router(room_amenities.router, prefix="/api/v1", tags=["Room Amenities"])
app.include_router(room_features.router, prefix="/api/v1", tags=["Room Features"])
app.include_router(services.router, prefix="/api/v1", tags=["Services"])
app.include_router(tenants.router, prefix="/api/v1", tags=["Tenants"])
app.include_router(vouchers.router, prefix="/api/v1", tags=["Vouchers"])
app.include_router(booking_requests.router, prefix="/api/v1", tags=["Booking Requests"])
app.include_router(customer_vouchers.router, prefix="/api/v1", tags=["Customer Vouchers"])
app.include_router(customers.router, prefix="/api/v1", tags=["Customers"])
app.include_router(facilities.router, prefix="/api/v1", tags=["Facilities"])
app.include_router(facility_features.router, prefix="/api/v1", tags=["Facility Features"])
# app.include_router(experiences.router, prefix="/api/v1", tags=["Experiences"])  # Removed - no table in DB
app.include_router(games.router, prefix="/api/v1", tags=["Games"])
app.include_router(hotel_brands.router, prefix="/api/v1", tags=["Hotel Brands"])
app.include_router(promotions.router, prefix="/api/v1", tags=["Promotions"])
app.include_router(room_stays.router, prefix="/api/v1", tags=["Room Stays"])
app.include_router(service_bookings.router, prefix="/api/v1", tags=["Service Bookings"])
app.include_router(test_items.router, prefix="/api/v1/test-items", tags=["Test Items - Zalo"])

# Zalo Mini App integration
app.include_router(zalo.router, prefix="/api/v1/zalo", tags=["Zalo Mini App"])

# Mount static files for serving uploaded images
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
