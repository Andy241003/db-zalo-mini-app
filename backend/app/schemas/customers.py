from pydantic import BaseModel
from typing import Optional
import datetime

class CustomerBase(BaseModel):
    tenant_id: int
    zalo_user_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerCreateRequest(BaseModel):
    """Schema for customer creation request (without tenant_id)"""
    zalo_user_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CustomerUpdateRequest(BaseModel):
    """Schema for customer update request (without tenant_id)"""
    zalo_user_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CustomerRead(CustomerBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class CustomerUpdate(CustomerBase):
    pass
