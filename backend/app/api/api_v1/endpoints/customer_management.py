from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.deps import get_db, get_current_admin_user
from app.models.models import TblCustomers, TblAdminUsers, TblBookingRequests, TblCustomerVouchers, TblVouchers, TblPromotions
from app.schemas.customers import CustomerUpdate

router = APIRouter()

class CustomerSearchFilter(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    loyalty_level: Optional[str] = None

@router.get("/customers/management")
def get_customers_advanced(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search_query: Optional[str] = Query(None),
    loyalty_level: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|total_bookings|loyalty_points|last_booking)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách customers với tính năng tìm kiếm và sắp xếp nâng cao
    """
    try:
        # Base query with tenant filtering
        query = db.query(TblCustomers).filter(
            and_(
                TblCustomers.tenant_id == current_user.tenant_id,
                TblCustomers.deleted == 0
            )
        )
        
        # Apply search filter
        if search_query:
            search_filter = or_(
                TblCustomers.full_name.ilike(f"%{search_query}%"),
                TblCustomers.email.ilike(f"%{search_query}%"),
                TblCustomers.phone.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        # Apply loyalty level filter
        if loyalty_level:
            query = query.filter(TblCustomers.loyalty_level == loyalty_level)
        
        # Apply sorting
        if sort_by == "created_at":
            if sort_order == "desc":
                query = query.order_by(TblCustomers.created_at.desc())
            else:
                query = query.order_by(TblCustomers.created_at.asc())
        elif sort_by == "total_bookings":
            if sort_order == "desc":
                query = query.order_by(TblCustomers.total_bookings.desc())
            else:
                query = query.order_by(TblCustomers.total_bookings.asc())
        elif sort_by == "loyalty_points":
            if sort_order == "desc":
                query = query.order_by(TblCustomers.loyalty_points.desc())
            else:
                query = query.order_by(TblCustomers.loyalty_points.asc())
        elif sort_by == "last_booking":
            if sort_order == "desc":
                query = query.order_by(TblCustomers.last_booking_date.desc().nulls_last())
            else:
                query = query.order_by(TblCustomers.last_booking_date.asc().nulls_first())
        
        # Get total count
        total_count = query.count()
        
        # Get paginated results
        customers = query.offset(skip).limit(limit).all()
        
        # Enhance with additional statistics
        enhanced_customers = []
        for customer in customers:
            # Get recent booking info
            recent_booking = db.query(TblBookingRequests).filter(
                and_(
                    TblBookingRequests.customer_id == customer.id,
                    TblBookingRequests.tenant_id == current_user.tenant_id,
                    TblBookingRequests.deleted == 0
                )
            ).order_by(TblBookingRequests.created_at.desc()).first()
            
            # Get vouchers count
            vouchers_count = db.query(func.count(TblCustomerVouchers.id)).filter(
                and_(
                    TblCustomerVouchers.customer_id == customer.id,
                    TblCustomerVouchers.deleted == 0
                )
            ).scalar() or 0
            
            # Calculate customer value metrics
            total_spent = db.query(func.sum(TblBookingRequests.total_amount)).filter(
                and_(
                    TblBookingRequests.customer_id == customer.id,
                    TblBookingRequests.tenant_id == current_user.tenant_id,
                    TblBookingRequests.status.in_(["confirmed", "completed"]),
                    TblBookingRequests.deleted == 0
                )
            ).scalar() or 0
            
            customer_data = {
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "phone": customer.phone,
                "date_of_birth": customer.date_of_birth.isoformat() if customer.date_of_birth else None,
                "gender": customer.gender,
                "address": customer.address,
                "city": customer.city,
                "country": customer.country,
                "loyalty_level": customer.loyalty_level,
                "loyalty_points": customer.loyalty_points,
                "total_bookings": customer.total_bookings,
                "last_booking_date": customer.last_booking_date.isoformat() if customer.last_booking_date else None,
                "created_at": customer.created_at.isoformat(),
                "updated_at": customer.updated_at.isoformat() if customer.updated_at else None,
                "statistics": {
                    "total_spent": float(total_spent),
                    "vouchers_count": vouchers_count,
                    "avg_booking_value": float(total_spent) / max(customer.total_bookings, 1),
                    "recent_booking": {
                        "id": recent_booking.id,
                        "check_in_date": recent_booking.check_in_date.isoformat() if recent_booking and recent_booking.check_in_date else None,
                        "status": recent_booking.status if recent_booking else None
                    } if recent_booking else None
                }
            }
            enhanced_customers.append(customer_data)
        
        return {
            "success": True,
            "data": {
                "customers": enhanced_customers,
                "pagination": {
                    "total": total_count,
                    "skip": skip,
                    "limit": limit,
                    "has_more": skip + limit < total_count
                },
                "filters_applied": {
                    "search_query": search_query,
                    "loyalty_level": loyalty_level,
                    "sort_by": sort_by,
                    "sort_order": sort_order
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy danh sách khách hàng: {str(e)}")

@router.get("/customers/management/{customer_id}")
def get_customer_detailed_profile(
    customer_id: int,
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết customer bao gồm lịch sử booking
    """
    try:
        # Get customer with tenant check
        customer = db.query(TblCustomers).filter(
            and_(
                TblCustomers.id == customer_id,
                TblCustomers.tenant_id == current_user.tenant_id,
                TblCustomers.deleted == 0
            )
        ).first()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
        
        # Get booking history
        bookings = db.query(TblBookingRequests).filter(
            and_(
                TblBookingRequests.customer_id == customer_id,
                TblBookingRequests.tenant_id == current_user.tenant_id,
                TblBookingRequests.deleted == 0
            )
        ).order_by(TblBookingRequests.created_at.desc()).limit(20).all()
        
        booking_history = []
        for booking in bookings:
            booking_history.append({
                "id": booking.id,
                "check_in_date": booking.check_in_date.isoformat() if booking.check_in_date else None,
                "check_out_date": booking.check_out_date.isoformat() if booking.check_out_date else None,
                "status": booking.status,
                "total_amount": float(booking.total_amount or 0),
                "room_id": booking.room_id,
                "created_at": booking.created_at.isoformat()
            })
        
        # Get vouchers — join TblPromotions trực tiếp
        voucher_rows = (
            db.query(TblCustomerVouchers, TblPromotions)
            .outerjoin(TblPromotions, TblCustomerVouchers.promotion_id == TblPromotions.id)
            .filter(
                and_(
                    TblCustomerVouchers.customer_id == customer_id,
                    TblCustomerVouchers.deleted == 0
                )
            )
            .order_by(TblCustomerVouchers.created_at.desc())
            .limit(10)
            .all()
        )

        voucher_list = []
        for cv, p in voucher_rows:
            voucher_list.append({
                "id": cv.id,
                "promotion_id": cv.promotion_id,
                "title": p.title if p else None,
                "discount_type": p.discount_type if p else None,
                "discount_amount": float(p.discount_value or 0) if p else 0,
                "is_used": bool(cv.is_used),
                "status": cv.status,
                "used_at": cv.used_at.isoformat() if cv.used_at else None,
                "assigned_date": cv.assigned_date.isoformat() if cv.assigned_date else None,
                "expiry_date": p.end_date.isoformat() if p and p.end_date else None
            })
        
        # Calculate statistics
        total_spent = db.query(func.sum(TblBookingRequests.total_amount)).filter(
            and_(
                TblBookingRequests.customer_id == customer_id,
                TblBookingRequests.tenant_id == current_user.tenant_id,
                TblBookingRequests.status.in_(["confirmed", "completed"]),
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        
        cancelled_bookings = db.query(func.count(TblBookingRequests.id)).filter(
            and_(
                TblBookingRequests.customer_id == customer_id,
                TblBookingRequests.tenant_id == current_user.tenant_id,
                TblBookingRequests.status == "cancelled",
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        
        customer_profile = {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone": customer.phone,
            "date_of_birth": customer.date_of_birth.isoformat() if customer.date_of_birth else None,
            "gender": customer.gender,
            "address": customer.address,
            "city": customer.city,
            "country": customer.country,
            "loyalty_level": customer.loyalty_level,
            "loyalty_points": customer.loyalty_points,
            "total_bookings": customer.total_bookings,
            "last_booking_date": customer.last_booking_date.isoformat() if customer.last_booking_date else None,
            "preferences": customer.preferences,
            "created_at": customer.created_at.isoformat(),
            "updated_at": customer.updated_at.isoformat() if customer.updated_at else None,
            "statistics": {
                "total_spent": float(total_spent),
                "average_booking_value": float(total_spent) / max(customer.total_bookings, 1),
                "cancelled_bookings": cancelled_bookings,
                "vouchers_count": len(voucher_list),
                "active_vouchers": len([v for v in voucher_list if v["status"] == "active" and not v["is_used"]])
            },
            "booking_history": booking_history,
            "vouchers": voucher_list
        }
        
        return {
            "success": True,
            "data": customer_profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy thông tin khách hàng: {str(e)}")

@router.put("/customers/management/{customer_id}/loyalty-points")
def update_customer_loyalty_points(
    customer_id: int,
    points_change: int,
    reason: str,
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Cập nhật điểm loyalty của khách hàng (cộng hoặc trừ)
    """
    try:
        # Get customer with tenant check
        customer = db.query(TblCustomers).filter(
            and_(
                TblCustomers.id == customer_id,
                TblCustomers.tenant_id == current_user.tenant_id,
                TblCustomers.deleted == 0
            )
        ).first()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
        
        # Validate points change
        new_points = customer.loyalty_points + points_change
        if new_points < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Không thể trừ {abs(points_change)} điểm. Khách hàng chỉ có {customer.loyalty_points} điểm"
            )
        
        # Update customer points
        old_points = customer.loyalty_points
        customer.loyalty_points = new_points
        customer.updated_at = datetime.now()
        customer.updated_by = current_user.username
        
        # Update loyalty level based on new points
        if new_points >= 10000:
            customer.loyalty_level = "platinum"
        elif new_points >= 5000:
            customer.loyalty_level = "gold"
        elif new_points >= 1000:
            customer.loyalty_level = "silver"
        else:
            customer.loyalty_level = "bronze"
        
        db.commit()
        db.refresh(customer)
        
        return {
            "success": True,
            "message": f"Đã {'cộng' if points_change > 0 else 'trừ'} {abs(points_change)} điểm loyalty",
            "data": {
                "customer_id": customer_id,
                "old_points": old_points,
                "new_points": new_points,
                "points_change": points_change,
                "new_loyalty_level": customer.loyalty_level,
                "reason": reason,
                "updated_by": current_user.username,
                "updated_at": customer.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật điểm loyalty: {str(e)}")

@router.get("/customers/management/statistics")
def get_customer_statistics(
    days: int = Query(30, ge=1, le=365),
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thống kê khách hàng trong khoảng thời gian
    """
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Base query with tenant filter
        base_query = db.query(TblCustomers).filter(
            and_(
                TblCustomers.tenant_id == current_user.tenant_id,
                TblCustomers.deleted == 0
            )
        )
        
        # Total customers
        total_customers = base_query.count()
        
        # New customers in period
        new_customers = base_query.filter(TblCustomers.created_at >= start_date).count()
        
        # Customers by loyalty level
        loyalty_counts = {}
        loyalty_levels = ["bronze", "silver", "gold", "platinum"]
        for level in loyalty_levels:
            count = base_query.filter(TblCustomers.loyalty_level == level).count()
            loyalty_counts[level] = count
        
        # Active customers (have bookings in period)
        active_customers = db.query(func.count(func.distinct(TblBookingRequests.customer_id))).filter(
            and_(
                TblBookingRequests.tenant_id == current_user.tenant_id,
                TblBookingRequests.created_at >= start_date,
                TblBookingRequests.deleted == 0
            )
        ).scalar() or 0
        
        # Top spenders
        top_spenders = db.query(
            TblCustomers.id,
            TblCustomers.full_name,
            TblCustomers.email,
            func.sum(TblBookingRequests.total_amount).label('total_spent')
        ).join(
            TblBookingRequests, TblCustomers.id == TblBookingRequests.customer_id
        ).filter(
            and_(
                TblCustomers.tenant_id == current_user.tenant_id,
                TblBookingRequests.created_at >= start_date,
                TblBookingRequests.status.in_(["confirmed", "completed"]),
                TblCustomers.deleted == 0,
                TblBookingRequests.deleted == 0
            )
        ).group_by(
            TblCustomers.id,
            TblCustomers.full_name,
            TblCustomers.email
        ).order_by(
            func.sum(TblBookingRequests.total_amount).desc()
        ).limit(10).all()
        
        top_spenders_data = [
            {
                "customer_id": spender.id,
                "full_name": spender.full_name,
                "email": spender.email,
                "total_spent": float(spender.total_spent or 0)
            }
            for spender in top_spenders
        ]
        
        # Customer acquisition by month (last 12 months)
        monthly_acquisition = []
        for i in range(12):
            month_start = (datetime.now().replace(day=1) - timedelta(days=i*30)).replace(day=1)
            if i == 0:
                month_end = datetime.now()
            else:
                next_month = month_start + timedelta(days=32)
                month_end = next_month.replace(day=1) - timedelta(days=1)
            
            month_count = base_query.filter(
                and_(
                    TblCustomers.created_at >= month_start,
                    TblCustomers.created_at <= month_end
                )
            ).count()
            
            monthly_acquisition.append({
                "month": month_start.strftime("%Y-%m"),
                "new_customers": month_count
            })
        
        # Reverse to get chronological order
        monthly_acquisition.reverse()
        
        return {
            "success": True,
            "data": {
                "period": {
                    "days": days,
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "overview": {
                    "total_customers": total_customers,
                    "new_customers": new_customers,
                    "active_customers": active_customers,
                    "customer_retention_rate": round((active_customers / max(total_customers, 1)) * 100, 2)
                },
                "loyalty_breakdown": loyalty_counts,
                "top_spenders": top_spenders_data,
                "monthly_acquisition": monthly_acquisition[-6:]  # Last 6 months
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy thống kê khách hàng: {str(e)}")
