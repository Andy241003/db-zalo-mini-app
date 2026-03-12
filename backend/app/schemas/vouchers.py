from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

# Base voucher schema
class VoucherBase(BaseModel):
    promotion_id: Optional[int] = None
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    max_usage: Optional[int] = None
    used_count: Optional[int] = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = 'active'

# Schema for creating voucher (request from user)
class VoucherCreateRequest(VoucherBase):
    code: str
    discount_type: str
    discount_value: Decimal
    start_date: date
    end_date: date

# Schema for creating voucher (with additional fields)
class VoucherCreate(VoucherBase):
    tenant_id: int
    created_by: Optional[str] = None

# Schema for updating voucher (request from user)
class VoucherUpdateRequest(VoucherBase):
    pass

# Schema for updating voucher (with additional fields)
class VoucherUpdate(VoucherBase):
    updated_by: Optional[str] = None

# Schema for reading voucher
class VoucherRead(VoucherBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: int

    class Config:
        orm_mode = True
        from_attributes = True
