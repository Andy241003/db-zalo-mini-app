from pydantic import BaseModel
from typing import Optional
import datetime

class CustomerVoucherBase(BaseModel):
    tenant_id: int
    customer_id: int
    promotion_id: Optional[int] = None              # direct promotion claim
    voucher_id: Optional[int] = None                # legacy optional
    assigned_date: Optional[datetime.datetime] = None
    used_at: Optional[datetime.datetime] = None
    is_used: Optional[bool] = False
    status: Optional[str] = None                    # assigned | used | expired
    booking_request_id: Optional[int] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class CustomerVoucherCreate(CustomerVoucherBase):
    pass

class CustomerVoucherRead(CustomerVoucherBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class CustomerVoucherUpdate(CustomerVoucherBase):
    pass
