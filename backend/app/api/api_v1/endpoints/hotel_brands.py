from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.deps import get_db, get_current_admin_user
from app.models.models import TblHotelBrands, TblAdminUsers
from datetime import datetime

router = APIRouter()

@router.get("/current")
def get_current_hotel_brand(
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin thương hiệu khách sạn hiện tại của tenant
    """
    try:
        # Xác định tenant_id
        if current_user.role.upper() == "SUPER_ADMIN":
            # Super admin không thuộc tenant cụ thể
            tenant_id = current_user.tenant_id
        else:
            if not current_user.tenant_id:
                raise HTTPException(status_code=400, detail="Hotel admin phải thuộc về một tenant")
            tenant_id = current_user.tenant_id

        # Super admin không có tenant_id → trả về rỗng
        if tenant_id is None:
            return {
                "success": True,
                "data": None,
                "message": "Super admin không thuộc tenant nào"
            }

        # Tìm hotel brand của tenant
        hotel_brand = db.query(TblHotelBrands).filter(
            and_(
                TblHotelBrands.tenant_id == tenant_id,
                TblHotelBrands.deleted == 0
            )
        ).first()

        if not hotel_brand:
            # Tạo brand mặc định nếu chưa có
            default_brand = TblHotelBrands(
                tenant_id=tenant_id,
                hotel_name="Khách sạn mới",
                slogan="Chào mừng bạn đến với khách sạn",
                description="Mô tả về khách sạn sẽ được cập nhật",
                primary_color="#1890ff",
                secondary_color="#52c41a",
                created_by=current_user.username,
                updated_by=current_user.username
            )
            db.add(default_brand)
            db.commit()
            db.refresh(default_brand)
            hotel_brand = default_brand

        return {
            "success": True,
            "data": hotel_brand,
            "message": "Lấy thông tin thương hiệu thành công"
        }
        
    except Exception as e:
        print(f"Error getting hotel brand: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

@router.post("")
def create_hotel_brand(
    brand_data: dict,
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Tạo mới thông tin thương hiệu khách sạn
    """
    try:
        # Xác định tenant_id
        if current_user.role.upper() == "SUPER_ADMIN":
            tenant_id = brand_data.get('tenant_id', current_user.tenant_id)
        else:
            if not current_user.tenant_id:
                raise HTTPException(status_code=400, detail="Hotel admin phải thuộc về một tenant")
            tenant_id = current_user.tenant_id

        # Kiểm tra đã có brand chưa
        existing_brand = db.query(TblHotelBrands).filter(
            and_(
                TblHotelBrands.tenant_id == tenant_id,
                TblHotelBrands.deleted == 0
            )
        ).first()

        if existing_brand:
            raise HTTPException(status_code=400, detail="Tenant này đã có thông tin thương hiệu")

        # Tạo brand mới
        brand_dict = dict(brand_data)
        brand_dict.pop('tenant_id', None)  # Remove tenant_id if exists
        
        new_brand = TblHotelBrands(
            tenant_id=tenant_id,
            **brand_dict,
            created_by=current_user.username,
            updated_by=current_user.username
        )
        
        db.add(new_brand)
        db.commit()
        db.refresh(new_brand)

        return {
            "success": True,
            "data": new_brand,
            "message": "Tạo thương hiệu thành công"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating hotel brand: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

@router.put("/{brand_id}")
def update_hotel_brand(
    brand_id: int,
    brand_data: dict,
    current_user: TblAdminUsers = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Cập nhật thông tin thương hiệu khách sạn
    """
    try:
        # Tìm brand
        brand = db.query(TblHotelBrands).filter(
            and_(
                TblHotelBrands.id == brand_id,
                TblHotelBrands.deleted == 0
            )
        ).first()

        if not brand:
            raise HTTPException(status_code=404, detail="Không tìm thấy thông tin thương hiệu")

        # Kiểm tra quyền
        if current_user.role.upper() != "SUPER_ADMIN" and brand.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Không có quyền cập nhật thương hiệu này")

        # Cập nhật thông tin
        update_data = dict(brand_data)
            
        for field, value in update_data.items():
            if hasattr(brand, field) and value is not None:
                setattr(brand, field, value)
        
        brand.updated_by = current_user.username
        brand.updated_at = datetime.now()
        
        db.commit()
        db.refresh(brand)

        return {
            "success": True,
            "data": brand,
            "message": "Cập nhật thương hiệu thành công"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating hotel brand: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")
