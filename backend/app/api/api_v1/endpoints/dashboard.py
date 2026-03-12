from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.core.deps import get_db, get_current_admin_user
from app.models.models import (
    TblTenants, TblRooms, TblFacilities, TblBookingRequests,
    TblCustomers, TblServices, TblAdminUsers, TblTestItems, 
    TblRoomStays, TblVouchers, TblPromotions
)

router = APIRouter()

@router.get("/dashboard/hotel-comprehensive")
def get_hotel_comprehensive_dashboard(
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    days: int = Query(30, description="Số ngày để tính toán thống kê")
) -> Dict[str, Any]:
    """
    Dashboard tổng hợp cho Hotel Admin với dữ liệu chi tiết
    """
    try:
        # Kiểm tra quyền và lấy tenant_id
        if current_user.role == 'super_admin':
            # Super admin có thể xem tất cả
            tenant_id = None
        else:
            if not current_user.tenant_id:
                raise HTTPException(status_code=400, detail="Hotel admin phải thuộc về một tenant")
            tenant_id = current_user.tenant_id
        
        # === BASIC STATS ===
        # Thiết lập khoảng thời gian
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        room_filter = [TblRooms.deleted == 0]
        if tenant_id:
            room_filter.append(TblRooms.tenant_id == tenant_id)
            
        total_rooms = db.query(func.count(TblRooms.id)).filter(and_(*room_filter)).scalar() or 0
        
        # Thống kê theo loại phòng
        room_types = db.query(
            TblRooms.room_type,
            func.count(TblRooms.id).label('count')
        ).filter(and_(*room_filter)).group_by(TblRooms.room_type).all()
        
        # === BOOKING STATS ===
        booking_filter = [TblBookingRequests.deleted == 0]
        if tenant_id:
            booking_filter.append(TblBookingRequests.tenant_id == tenant_id)
        
        # Filter theo thời gian cho các số liệu hiện tại
        current_period_filter = booking_filter + [
            TblBookingRequests.created_at >= start_date,
            TblBookingRequests.created_at <= end_date
        ]
            
        # Thống kê booking tổng quan (trong khoảng thời gian)
        total_bookings = db.query(func.count(TblBookingRequests.id)).filter(and_(*current_period_filter)).scalar() or 0
        
        pending_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.status == 'pending', *current_period_filter)
        ).scalar() or 0
        
        confirmed_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.status == 'confirmed', *current_period_filter)
        ).scalar() or 0
        
        cancelled_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.status == 'cancelled', *current_period_filter)
        ).scalar() or 0
        
        # Booking trong 30 ngày qua
        date_filter = datetime.now() - timedelta(days=days)
        recent_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.created_at >= date_filter, *booking_filter)
        ).scalar() or 0
        
        # Booking theo từng ngày trong 7 ngày qua (cho chart)
        daily_bookings = []
        for i in range(7):
            day_start = datetime.now() - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            count = db.query(func.count(TblBookingRequests.id)).filter(
                and_(
                    TblBookingRequests.created_at >= day_start,
                    TblBookingRequests.created_at < day_end,
                    *booking_filter
                )
            ).scalar() or 0
            daily_bookings.append({
                "date": day_start.strftime("%m/%d"),
                "bookings": count
            })
        daily_bookings.reverse()  # Sắp xếp từ cũ đến mới
        
        # === CUSTOMER STATS ===
        customer_filter = [TblCustomers.deleted == 0]
        if tenant_id:
            customer_filter.append(TblCustomers.tenant_id == tenant_id)
            
        total_customers = db.query(func.count(TblCustomers.id)).filter(and_(*customer_filter)).scalar() or 0
        
        # Khách hàng mới trong period hiện tại
        new_customers_current = db.query(func.count(TblCustomers.id)).filter(
            and_(
                TblCustomers.created_at >= start_date,
                TblCustomers.created_at <= end_date,
                *customer_filter
            )
        ).scalar() or 0
        
        # Khách hàng trong period trước đó (để tính growth)
        previous_start = start_date - timedelta(days=days)
        previous_end = start_date
        previous_customers = db.query(func.count(TblCustomers.id)).filter(
            and_(
                TblCustomers.created_at >= previous_start,
                TblCustomers.created_at < previous_end,
                *customer_filter
            )
        ).scalar() or 0
        
        # Tính customer growth rate
        if previous_customers > 0:
            customer_growth_rate = ((new_customers_current - previous_customers) / previous_customers) * 100
        else:
            customer_growth_rate = 100.0 if new_customers_current > 0 else 0.0
        
        # === FACILITIES STATS ===
        facility_filter = [TblFacilities.deleted == 0]
        if tenant_id:
            facility_filter.append(TblFacilities.tenant_id == tenant_id)
            
        total_facilities = db.query(func.count(TblFacilities.id)).filter(and_(*facility_filter)).scalar() or 0
        active_facilities = total_facilities  # All non-deleted facilities are considered active
        
        # === PROMOTIONS STATS ===
        promotion_filter = [TblPromotions.deleted == 0]
        if tenant_id:
            promotion_filter.append(TblPromotions.tenant_id == tenant_id)
            
        total_promotions = db.query(func.count(TblPromotions.id)).filter(and_(*promotion_filter)).scalar() or 0
        active_promotions = db.query(func.count(TblPromotions.id)).filter(
            and_(TblPromotions.status == 'active', *promotion_filter)
        ).scalar() or 0
        
        # === RECENT ACTIVITIES ===
        # 5 booking gần nhất
        recent_bookings_query = db.query(TblBookingRequests).filter(and_(*booking_filter)).order_by(
            desc(TblBookingRequests.created_at)
        ).limit(5)
        
        recent_bookings_list = []
        for booking in recent_bookings_query.all():
            customer = db.query(TblCustomers).filter(TblCustomers.id == booking.customer_id).first()
            room = db.query(TblRooms).filter(TblRooms.id == booking.room_id).first()
            
            recent_bookings_list.append({
                "id": booking.id,
                "customer_name": customer.name if customer else "Unknown",
                "customer_phone": customer.phone if customer else "",
                "room_name": room.room_name if room else "Unknown Room", 
                "room_type": room.room_type if room else "",
                "check_in_date": booking.check_in_date.isoformat() if booking.check_in_date else None,
                "check_out_date": booking.check_out_date.isoformat() if booking.check_out_date else None,
                "status": booking.status,
                "created_at": booking.created_at.isoformat() if booking.created_at else None
            })
        
        # === PERFORMANCE METRICS ===
        # 1. Tỷ lệ lấp đầy (Occupancy Rate) - dựa trên số booking confirmed vs total rooms
        occupancy_rate = min((confirmed_bookings / max(total_rooms, 1)) * 100, 100) if total_rooms > 0 else 0
        
        # 2. Tỷ lệ conversion (confirmed / total bookings)
        conversion_rate = (confirmed_bookings / max(total_bookings, 1)) * 100 if total_bookings > 0 else 0
        
        # 3. Revenue Growth - so sánh với tháng trước
        # Lấy data tháng trước (30 ngày trước đó)
        previous_month_start = end_date - timedelta(days=days*2)
        previous_month_end = end_date - timedelta(days=days)
        
        previous_month_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.deleted == 0,
                TblBookingRequests.status == 'confirmed',
                TblBookingRequests.tenant_id == tenant_id if tenant_id else True,
                TblBookingRequests.created_at >= previous_month_start,
                TblBookingRequests.created_at < previous_month_end
            )
        ).scalar() or 0
        
        # Tính revenue hiện tại và tháng trước (giả sử mỗi booking = 1.5M VND)
        current_revenue = confirmed_bookings * 1500000
        previous_revenue = previous_month_bookings * 1500000
        
        # Tính % tăng trưởng revenue
        if previous_revenue > 0:
            revenue_growth = ((current_revenue - previous_revenue) / previous_revenue) * 100
        else:
            revenue_growth = 100.0 if current_revenue > 0 else 0.0
        
        # 4. Estimated Revenue dựa trên booking thực tế
        estimated_revenue = current_revenue
        
        return {
            "success": True,
            "data": {
                "overview": {
                    "total_rooms": total_rooms,
                    "total_bookings": total_bookings,
                    "total_customers": total_customers,
                    "total_facilities": total_facilities,
                    "estimated_revenue": estimated_revenue
                },
                "booking_stats": {
                    "total": total_bookings,
                    "pending": pending_bookings,
                    "confirmed": confirmed_bookings,
                    "cancelled": cancelled_bookings,
                    "recent": recent_bookings,
                    "conversion_rate": round(conversion_rate, 1)
                },
                "customer_stats": {
                    "total": total_customers,
                    "new_this_month": new_customers_current,
                    "growth_rate": round(customer_growth_rate, 1)
                },
                "facility_stats": {
                    "total": total_facilities,
                    "active": active_facilities,
                    "utilization_rate": round((active_facilities / max(total_facilities, 1)) * 100, 1)
                },
                "promotion_stats": {
                    "total": total_promotions,
                    "active": active_promotions
                },
                "performance": {
                    "occupancy_rate": round(occupancy_rate, 1),
                    "conversion_rate": round(conversion_rate, 1),
                    "revenue_growth": round(revenue_growth, 1)
                },
                "charts": {
                    "daily_bookings": daily_bookings,
                    "room_types": [{"type": rt.room_type, "count": rt.count} for rt in room_types]
                },
                "recent_activities": {
                    "bookings": recent_bookings_list
                },
                "metadata": {
                    "tenant_id": tenant_id,
                    "user_role": current_user.role,
                    "last_updated": datetime.now().isoformat(),
                    "period_days": days
                }
            }
        }
        
    except Exception as e:
        print(f"Error getting comprehensive dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/dashboard/hotel-stats")
def get_hotel_dashboard_stats(
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Thống kê dashboard cho Hotel Admin (chỉ tenant của họ)
    """
    try:
        # Hotel admin chỉ xem được thống kê của tenant mình
        if current_user.role == 'super_admin':
            # Super admin có thể xem tất cả hoặc xem theo tenant_id từ query param
            tenant_id = None  # Xem tất cả
        else:
            # Hotel admin chỉ xem tenant của mình
            if not current_user.tenant_id:
                raise HTTPException(status_code=400, detail="Hotel admin phải thuộc về một tenant")
            tenant_id = current_user.tenant_id
        
        # Filter base query
        base_filter = [TblRooms.deleted == 0]
        if tenant_id:
            base_filter.append(TblRooms.tenant_id == tenant_id)
        
        # Thống kê phòng
        total_rooms = db.query(func.count(TblRooms.id)).filter(and_(*base_filter)).scalar() or 0
        
        # Thống kê facilities
        facility_filter = [TblFacilities.deleted == 0]
        if tenant_id:
            facility_filter.append(TblFacilities.tenant_id == tenant_id)
        total_facilities = db.query(func.count(TblFacilities.id)).filter(and_(*facility_filter)).scalar() or 0
        
        # Thống kê booking requests
        booking_filter = [TblBookingRequests.deleted == 0]
        if tenant_id:
            booking_filter.append(TblBookingRequests.tenant_id == tenant_id)
        total_bookings = db.query(func.count(TblBookingRequests.id)).filter(and_(*booking_filter)).scalar() or 0
        
        # Thống kê customers
        customer_filter = [TblCustomers.deleted == 0]
        if tenant_id:
            customer_filter.append(TblCustomers.tenant_id == tenant_id)
        total_customers = db.query(func.count(TblCustomers.id)).filter(and_(*customer_filter)).scalar() or 0
        
        # Thống kê promotions đang active
        promotion_filter = [TblPromotions.deleted == 0, TblPromotions.status == 'active']
        if tenant_id:
            promotion_filter.append(TblPromotions.tenant_id == tenant_id)
        active_promotions = db.query(func.count(TblPromotions.id)).filter(and_(*promotion_filter)).scalar() or 0
        
        # Tính doanh thu tháng (giả lập - có thể tích hợp từ booking system thực tế)
        # Hiện tại return mock data
        revenue_month = 125000000  # 125 triệu VND
        
        return {
            "success": True,
            "data": {
                "total_rooms": total_rooms,
                "total_bookings": total_bookings,
                "total_customers": total_customers,
                "active_promotions": active_promotions,
                "total_facilities": total_facilities,
                "revenue_month": revenue_month,
                "tenant_id": tenant_id,
                "user_role": current_user.role
            }
        }
    
    except Exception as e:
        print(f"Error getting hotel dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/dashboard/super-admin/stats")
def get_super_admin_dashboard_stats(
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Thống kê tổng quan cho Super Admin (toàn hệ thống)
    """
    try:
        # Chỉ super admin mới được xem
        if current_user.role != 'super_admin':
            raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
        
        # Thống kê tenants
        total_tenants = db.query(func.count(TblTenants.id)).filter(TblTenants.deleted == 0).scalar() or 0
        active_tenants = db.query(func.count(TblTenants.id)).filter(
            and_(TblTenants.status == 'active', TblTenants.deleted == 0)
        ).scalar() or 0
        
        # Thống kê tổng phòng trong hệ thống
        total_rooms = db.query(func.count(TblRooms.id)).filter(TblRooms.deleted == 0).scalar() or 0
        
        # Thống kê tổng facilities
        total_facilities = db.query(func.count(TblFacilities.id)).filter(TblFacilities.deleted == 0).scalar() or 0
        
        # Thống kê booking requests
        total_bookings = db.query(func.count(TblBookingRequests.id)).filter(TblBookingRequests.deleted == 0).scalar() or 0
        pending_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.status == 'pending', TblBookingRequests.deleted == 0)
        ).scalar() or 0
        
        # Thống kê customers
        total_customers = db.query(func.count(TblCustomers.id)).filter(TblCustomers.deleted == 0).scalar() or 0
        
        # Thống kê admin users
        total_admins = db.query(func.count(TblAdminUsers.id)).scalar() or 0
        
        # Thống kê theo thời gian (7 ngày qua)
        week_ago = datetime.now() - timedelta(days=7)
        new_tenants_week = db.query(func.count(TblTenants.id)).filter(
            and_(TblTenants.created_at >= week_ago, TblTenants.deleted == 0)
        ).scalar() or 0
        new_customers_week = db.query(func.count(TblCustomers.id)).filter(
            and_(TblCustomers.created_at >= week_ago, TblCustomers.deleted == 0)
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "system_overview": {
                    "total_tenants": total_tenants,
                    "active_tenants": active_tenants,
                    "inactive_tenants": total_tenants - active_tenants,
                    "total_rooms": total_rooms,
                    "total_facilities": total_facilities,
                    "total_customers": total_customers,
                    "total_admins": total_admins
                },
                "bookings": {
                    "total": total_bookings,
                    "pending": pending_bookings,
                    "processed": total_bookings - pending_bookings
                },
                "growth": {
                    "new_tenants_week": new_tenants_week,
                    "new_customers_week": new_customers_week
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")

@router.get("/dashboard/tenant/stats")
def get_tenant_dashboard_stats(
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Thống kê cho tenant admin (chỉ dữ liệu của tenant họ)
    """
    try:
        tenant_id = current_user.tenant_id
        
        # Thống kê rooms của tenant
        total_rooms = db.query(func.count(TblRooms.id)).filter(
            and_(TblRooms.tenant_id == tenant_id, TblRooms.deleted == 0)
        ).scalar() or 0
        
        # Thống kê facilities của tenant  
        total_facilities = db.query(func.count(TblFacilities.id)).filter(
            and_(TblFacilities.tenant_id == tenant_id, TblFacilities.deleted == 0)
        ).scalar() or 0
        
        # Thống kê services của tenant
        total_services = db.query(func.count(TblServices.id)).filter(
            and_(TblServices.tenant_id == tenant_id, TblServices.deleted == 0)
        ).scalar() or 0
        
        # Thống kê booking requests của tenant
        total_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.tenant_id == tenant_id, TblBookingRequests.deleted == 0)
        ).scalar() or 0
        pending_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.tenant_id == tenant_id,
                TblBookingRequests.status == 'pending',
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        confirmed_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.tenant_id == tenant_id,
                TblBookingRequests.status == 'confirmed', 
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        
        # Thống kê customers của tenant
        total_customers = db.query(func.count(TblCustomers.id)).filter(
            and_(TblCustomers.tenant_id == tenant_id, TblCustomers.deleted == 0)
        ).scalar() or 0
        
        # Thống kê vouchers của tenant
        total_vouchers = db.query(func.count(TblVouchers.id)).filter(
            and_(TblVouchers.tenant_id == tenant_id, TblVouchers.deleted == 0)
        ).scalar() or 0
        active_vouchers = db.query(func.count(TblVouchers.id)).filter(
            and_(
                TblVouchers.tenant_id == tenant_id,
                TblVouchers.status == 'active',
                TblVouchers.deleted == 0
            )
        ).scalar() or 0
        
        # Thống kê promotions của tenant
        total_promotions = db.query(func.count(TblPromotions.id)).filter(
            and_(TblPromotions.tenant_id == tenant_id, TblPromotions.deleted == 0)
        ).scalar() or 0
        
        # Thống kê theo thời gian (30 ngày qua)
        month_ago = datetime.now() - timedelta(days=30)
        new_bookings_month = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.tenant_id == tenant_id,
                TblBookingRequests.created_at >= month_ago,
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        new_customers_month = db.query(func.count(TblCustomers.id)).filter(
            and_(
                TblCustomers.tenant_id == tenant_id,
                TblCustomers.created_at >= month_ago,
                TblCustomers.deleted == 0
            )
        ).scalar() or 0
        
        return {
            "success": True,
            "data": {
                "tenant_id": tenant_id,
                "inventory": {
                    "total_rooms": total_rooms,
                    "total_facilities": total_facilities,
                    "total_services": total_services
                },
                "bookings": {
                    "total": total_bookings,
                    "pending": pending_bookings,
                    "confirmed": confirmed_bookings,
                    "cancelled": total_bookings - pending_bookings - confirmed_bookings
                },
                "marketing": {
                    "total_vouchers": total_vouchers,
                    "active_vouchers": active_vouchers,
                    "total_promotions": total_promotions
                },
                "customers": {
                    "total": total_customers
                },
                "growth": {
                    "new_bookings_month": new_bookings_month,
                    "new_customers_month": new_customers_month
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")
        
#         active_services = db.query(func.count(Service.id)).filter(
#             Service.merchant_id == merchant_id,
#             Service.status == 'ACTIVE'
#         ).scalar() or 0
        
#         # Thống kê orders của merchant
#         total_orders = db.query(func.count(Orders.id)).filter(
#             Orders.merchant_id == merchant_id
#         ).scalar() or 0
        
#         return {
#             "success": True,
#             "data": {
#                 "merchant": {
#                     "id": merchant.id,
#                     "name": merchant.name,
#                     "status": merchant.status
#                 },
#                 "rooms": {
#                     "total": total_rooms,
#                     "available": available_rooms,
#                     "occupied": total_rooms - available_rooms
#                 },
#                 "services": {
#                     "total": total_services,
#                     "active": active_services,
#                     "inactive": total_services - active_services
#                 },
#                 "orders": {
#                     "total": total_orders
#                 }
#             }
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")

# @router.get("/dashboard/recent-activities")
# def get_recent_activities(
#     limit: int = Query(10, le=50),
#     merchant_id: Optional[int] = None,
#     db: Session = Depends(get_db)
# ) -> Dict[str, Any]:
#     """
#     Lấy hoạt động gần đây
#     """
#     try:
#         activities = []
        
#         # Lấy merchants mới nhất
#         query = db.query(Merchant).order_by(Merchant.created_at.desc())
#         if merchant_id:
#             query = query.filter(Merchant.id == merchant_id)
        
#         recent_merchants = query.limit(limit // 3).all()
#         for merchant in recent_merchants:
#             activities.append({
#                 "type": "merchant",
#                 "action": "created",
#                 "title": f"Merchant mới: {merchant.name}",
#                 "description": f"Địa chỉ: {merchant.address or 'Chưa có'}",
#                 "timestamp": merchant.created_at,
#                 "status": merchant.status
#             })
        
#         # Lấy rooms mới nhất
#         room_query = db.query(Room).order_by(Room.created_at.desc())
#         if merchant_id:
#             room_query = room_query.filter(Room.merchant_id == merchant_id)
            
#         recent_rooms = room_query.limit(limit // 3).all()
#         for room in recent_rooms:
#             activities.append({
#                 "type": "room",
#                 "action": "created", 
#                 "title": f"Phòng mới: {room.name}",
#                 "description": f"Giá: {room.price:,} VND/đêm",
#                 "timestamp": room.created_at,
#                 "status": room.status
#             })
        
#         # Lấy services mới nhất
#         service_query = db.query(Service).order_by(Service.created_at.desc())
#         if merchant_id:
#             service_query = service_query.filter(Service.merchant_id == merchant_id)
            
#         recent_services = service_query.limit(limit // 3).all()
#         for service in recent_services:
#             activities.append({
#                 "type": "service",
#                 "action": "created",
#                 "title": f"Dịch vụ mới: {service.name}",
#                 "description": f"Giá: {service.price:,} VND",
#                 "timestamp": service.created_at,
#                 "status": service.status
#             })
        
#         # Sắp xếp theo thời gian
#         activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
#         return {
#             "success": True,
#             "data": activities[:limit]
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")

@router.get("/reports/dashboard")
def get_dashboard_reports(
    tenant_id: int = Query(..., description="Tenant ID"),
    period: Optional[str] = Query(None, description="Period for stats (optional)"),
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Dashboard reports endpoint that matches frontend API expectations
    Maps to tenant dashboard stats with additional fields for compatibility
    """
    try:
        # Verify tenant access
        if current_user.role != 'super_admin' and current_user.tenant_id != tenant_id:
            raise HTTPException(status_code=403, detail="Không đủ quyền truy cập tenant này")
        
        # Get basic stats for the tenant
        total_rooms = db.query(func.count(TblRooms.id)).filter(
            and_(TblRooms.tenant_id == tenant_id, TblRooms.deleted == 0)
        ).scalar() or 0
        
        # Booking stats
        total_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(TblBookingRequests.tenant_id == tenant_id, TblBookingRequests.deleted == 0)
        ).scalar() or 0
        
        pending_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.tenant_id == tenant_id,
                TblBookingRequests.status == 'pending',
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        
        confirmed_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.tenant_id == tenant_id,
                TblBookingRequests.status == 'confirmed',
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        
        # Customer stats
        active_customers = db.query(func.count(TblCustomers.id)).filter(
            and_(TblCustomers.tenant_id == tenant_id, TblCustomers.deleted == 0)
        ).scalar() or 0
        
        # Recent bookings for dashboard
        recent_bookings_query = db.query(TblBookingRequests).filter(
            and_(TblBookingRequests.tenant_id == tenant_id, TblBookingRequests.deleted == 0)
        ).order_by(TblBookingRequests.created_at.desc()).limit(5)
        
        recent_bookings = []
        for booking in recent_bookings_query.all():
            # Get customer and room info
            customer = db.query(TblCustomers).filter(TblCustomers.id == booking.customer_id).first()
            room = db.query(TblRooms).filter(TblRooms.id == booking.room_id).first()
            
            recent_bookings.append({
                "id": booking.id,
                "customer_name": customer.name if customer else "Unknown",
                "room_name": room.room_name if room else "Unknown Room",
                "check_in_date": booking.check_in_date.isoformat() if booking.check_in_date else None,
                "total_amount": 0  # Default since no amount field in model
            })
        
        # Calculate occupancy rate (simplified)
        occupancy_rate = (confirmed_bookings / max(total_rooms, 1)) * 100 if total_rooms > 0 else 0
        
        return {
            "total_bookings": total_bookings,
            "total_revenue": 0,  # Default since no revenue tracking yet
            "occupancy_rate": round(occupancy_rate, 2),
            "active_customers": active_customers,
            "pending_bookings": pending_bookings,
            "low_stock_alerts": 0,  # Default since no inventory tracking yet
            "recent_bookings": recent_bookings
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")
