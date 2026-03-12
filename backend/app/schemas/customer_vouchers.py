from pydantic import BaseModel
from typing import Optional
import datetime

class CustomerVoucherBase(BaseModel):
    tenant_id: int
    customer_id: int
    voucher_id: int
    assigned_date: datetime.datetime
    used_date: Optional[datetime.datetime] = None
    status: Optional[str] = None
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
