from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_admin_user, verify_tenant_permission
from app.crud.crud_customers import customer
from app.schemas.customers import CustomerCreate, CustomerRead, CustomerUpdate, CustomerCreateRequest, CustomerUpdateRequest
from app.models.models import TblAdminUsers, TblCustomerVouchers, TblVouchers, TblPromotions
from pydantic import BaseModel
import datetime

router = APIRouter()


# Response schema cho My Vouchers (đủ data để FE render)
class MyVoucherRead(BaseModel):
    id: int                          # customer_voucher.id
    customer_id: int
    promotion_id: Optional[int] = None
    assigned_date: Optional[datetime.datetime] = None
    used_at: Optional[datetime.datetime] = None
    is_used: bool = False
    status: Optional[str] = None     # assigned | used | expired
    # From tbl_promotions
    title: Optional[str] = None
    description: Optional[str] = None
    banner_image: Optional[str] = None
    promotion_type: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None

    class Config:
        from_attributes = True

@router.get("/customers", response_model=List[CustomerRead])
def read_customers(
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: TblAdminUsers = Depends(get_current_admin_user)
):
    """Get all customers for a tenant"""
    verify_tenant_permission(tenant_id, current_user)
    return customer.get_multi(db=db, tenant_id=tenant_id, skip=skip, limit=limit)

@router.post("/customers", response_model=CustomerRead)
def create_customer(
    *,
    tenant_id: int,
    obj_in: CustomerCreateRequest,
    db: Session = Depends(get_db),
    current_user: TblAdminUsers = Depends(get_current_admin_user)
):
    """Create new customer"""
    verify_tenant_permission(tenant_id, current_user)
    
    # Convert CustomerCreateRequest to CustomerCreate with tenant_id
    customer_data = obj_in.dict()
    customer_data['tenant_id'] = tenant_id
    customer_data['created_by'] = current_user.username
    customer_create = CustomerCreate(**customer_data)
    
    return customer.create(db=db, obj_in=customer_create, tenant_id=tenant_id)

@router.get("/customers/{item_id}", response_model=CustomerRead)
def read_customer(
    *,
    item_id: int,
    tenant_id: int,
    db: Session = Depends(get_db)
):
    """Get customer by ID"""
    obj = customer.get(db=db, id=item_id, tenant_id=tenant_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")
    return obj

@router.put("/customers/{item_id}", response_model=CustomerRead)
def update_customer(
    *,
    item_id: int,
    tenant_id: int,
    obj_in: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """Update customer"""
    obj = customer.get(db=db, id=item_id, tenant_id=tenant_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer.update(db=db, db_obj=obj, obj_in=obj_in)

@router.delete("/customers/{item_id}")
def delete_customer(
    *,
    item_id: int,
    tenant_id: int,
    deleted_by: str = None,
    db: Session = Depends(get_db)
):
    """Delete customer"""
    obj = customer.remove(db=db, id=item_id, tenant_id=tenant_id, deleted_by=deleted_by)
    if not obj:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}


@router.get("/customers/{item_id}/vouchers", response_model=List[MyVoucherRead])
def get_customer_vouchers(
    *,
    item_id: int,
    tenant_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách voucher của customer (My Promotions trên Mini App).
    Không yêu cầu auth — customer tự lấy voucher của mình qua zalo_user_id.
    """
    # Kiểm tra customer tồn tại
    cust = customer.get(db=db, id=item_id, tenant_id=tenant_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Join customer_vouchers → promotions trực tiếp
    rows = (
        db.query(TblCustomerVouchers, TblPromotions)
        .outerjoin(TblPromotions, TblCustomerVouchers.promotion_id == TblPromotions.id)
        .filter(
            TblCustomerVouchers.customer_id == item_id,
            TblCustomerVouchers.tenant_id == tenant_id,
            TblCustomerVouchers.deleted == 0
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for cv, p in rows:
        result.append(MyVoucherRead(
            id=cv.id,
            customer_id=cv.customer_id,
            promotion_id=cv.promotion_id,
            assigned_date=cv.assigned_date,
            used_at=cv.used_at,
            is_used=bool(cv.is_used),
            status=cv.status,
            title=p.title if p else None,
            description=p.description if p else None,
            banner_image=p.banner_image if p else None,
            promotion_type=p.type if p else None,
            discount_type=p.discount_type if p else None,
            discount_value=float(p.discount_value) if p and p.discount_value else None,
            start_date=p.start_date if p else None,
            end_date=p.end_date if p else None,
        ))

    return result


@router.post("/customers/{item_id}/promotions/{promotion_id}/claim")
def claim_promotion(
    *,
    item_id: int,
    promotion_id: int,
    tenant_id: int,
    db: Session = Depends(get_db)
):
    """
    Customer nhận ưu đãi (claim) trực tiếp từ promotion.
    FE gọi khi người dùng bấm "Lưu ưu đãi".
    """
    today = datetime.date.today()

    # Kiểm tra customer
    cust = customer.get(db=db, id=item_id, tenant_id=tenant_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Kiểm tra promotion tồn tại và khóa bản ghi để tránh over-claim khi nhiều request đồng thời
    p = db.query(TblPromotions).filter(
        TblPromotions.id == promotion_id,
        TblPromotions.tenant_id == tenant_id,
        TblPromotions.deleted == 0
    ).with_for_update().first()
    if not p:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if p.status != 'active':
        raise HTTPException(status_code=400, detail="Ưu đãi không còn hiệu lực")
    if p.start_date and today < p.start_date:
        raise HTTPException(status_code=400, detail="Ưu đãi chưa đến thời gian áp dụng")
    if p.end_date and today > p.end_date:
        raise HTTPException(status_code=400, detail="Ưu đãi đã hết hạn")
    if p.max_usage is not None and (p.used_count or 0) >= p.max_usage:
        raise HTTPException(status_code=400, detail="Ưu đãi đã đạt giới hạn lượt nhận")

    # Kiểm tra đã claim chưa
    existing = db.query(TblCustomerVouchers).filter(
        TblCustomerVouchers.customer_id == item_id,
        TblCustomerVouchers.promotion_id == promotion_id,
        TblCustomerVouchers.deleted == 0
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã lưu ưu đãi này rồi")

    # Tạo record + tăng used_count
    cv = TblCustomerVouchers(
        tenant_id=tenant_id,
        customer_id=item_id,
        promotion_id=promotion_id,
        status='assigned',
        is_used=False,
    )
    db.add(cv)

    p.used_count = (p.used_count or 0) + 1
    db.add(p)

    db.commit()
    db.refresh(cv)
    return {
        "message": "Lưu ưu đãi thành công",
        "customer_voucher_id": cv.id,
        "promotion_used_count": p.used_count,
        "promotion_max_usage": p.max_usage,
    }
