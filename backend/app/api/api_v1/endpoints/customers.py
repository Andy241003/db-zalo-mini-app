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
    voucher_id: int
    customer_id: int
    assigned_date: Optional[datetime.datetime] = None
    used_at: Optional[datetime.datetime] = None
    is_used: bool = False
    status: Optional[str] = None
    # From tbl_vouchers
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    # From tbl_promotions
    promotion_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    banner_image: Optional[str] = None
    promotion_type: Optional[str] = None

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

    # Join customer_vouchers → vouchers → promotions
    rows = (
        db.query(TblCustomerVouchers, TblVouchers, TblPromotions)
        .join(TblVouchers, TblCustomerVouchers.voucher_id == TblVouchers.id)
        .outerjoin(TblPromotions, TblVouchers.promotion_id == TblPromotions.id)
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
    for cv, v, p in rows:
        result.append(MyVoucherRead(
            id=cv.id,
            voucher_id=cv.voucher_id,
            customer_id=cv.customer_id,
            assigned_date=cv.assigned_date,
            used_at=cv.used_at,
            is_used=bool(cv.is_used),
            status=cv.status,
            # Voucher fields
            code=v.code if v else None,
            discount_type=v.discount_type if v else None,
            discount_value=float(v.discount_value) if v and v.discount_value else None,
            start_date=v.start_date if v else None,
            end_date=v.end_date if v else None,
            # Promotion fields
            promotion_id=p.id if p else None,
            title=p.title if p else None,
            description=p.description if p else None,
            banner_image=p.banner_image if p else None,
            promotion_type=p.type if p else None,
        ))

    return result


@router.post("/customers/{item_id}/vouchers/{voucher_id}/claim")
def claim_voucher(
    *,
    item_id: int,
    voucher_id: int,
    tenant_id: int,
    db: Session = Depends(get_db)
):
    """
    Customer nhận voucher (claim) từ promotion.
    FE gọi khi người dùng bấm "Lưu voucher".
    """
    # Kiểm tra customer
    cust = customer.get(db=db, id=item_id, tenant_id=tenant_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Kiểm tra voucher tồn tại và còn hạn
    v = db.query(TblVouchers).filter(
        TblVouchers.id == voucher_id,
        TblVouchers.tenant_id == tenant_id,
        TblVouchers.deleted == 0
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Voucher not found")
    if v.status != 'active':
        raise HTTPException(status_code=400, detail="Voucher không còn hiệu lực")

    # Kiểm tra đã claim chưa
    existing = db.query(TblCustomerVouchers).filter(
        TblCustomerVouchers.customer_id == item_id,
        TblCustomerVouchers.voucher_id == voucher_id,
        TblCustomerVouchers.deleted == 0
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã lưu voucher này rồi")

    # Tạo record
    cv = TblCustomerVouchers(
        tenant_id=tenant_id,
        customer_id=item_id,
        voucher_id=voucher_id,
        status='active',
        is_used=False,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return {"message": "Lưu voucher thành công", "customer_voucher_id": cv.id}
