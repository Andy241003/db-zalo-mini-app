"""
Main API router that includes all endpoint routers
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    tenants,
    admin_users,
    profile,
    rooms,
    customers,
    booking_requests,
    promotions,  # Re-enabled for testing
    vouchers,
    services,
    facilities,
    games,  # Added games endpoint
    # experiences,  # Commented out - missing TblExperiences model
    hotel_brands,
    auth,
    dashboard,
    zalo,  # Added zalo endpoint
    zalo_test  # Added simple test endpoint
    # Media endpoints removed - no tables in database
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(admin_users.router, tags=["admin-users"])
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(tenants.router, tags=["tenants"])
api_router.include_router(rooms.router, tags=["rooms"])
api_router.include_router(customers.router, tags=["customers"])
api_router.include_router(booking_requests.router, tags=["booking-requests"])
api_router.include_router(promotions.router, tags=["promotions"])  # Re-enabled for testing
api_router.include_router(vouchers.router, tags=["vouchers"])
api_router.include_router(services.router, tags=["services"])
api_router.include_router(facilities.router, tags=["facilities"])
api_router.include_router(games.router, tags=["games"])  # Added games router
# api_router.include_router(experiences.router, tags=["experiences"])  # Commented out - missing TblExperiences model
api_router.include_router(hotel_brands.router, prefix="/hotel-brands", tags=["hotel-brands"])
api_router.include_router(dashboard.router, tags=["dashboard"])

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Zalo Mini App endpoints
api_router.include_router(zalo.router, prefix="/zalo", tags=["zalo"])
api_router.include_router(zalo_test.router, prefix="/zalo-test", tags=["zalo-test"])

# Media endpoints removed - no corresponding database tables
