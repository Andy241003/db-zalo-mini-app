from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# Base service schema
class ServiceBase(BaseModel):
    service_name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[List[str]] = None  # array of image URLs for slideshow
    price: Optional[Decimal] = None
    unit: Optional[str] = None
    duration_minutes: Optional[int] = None
    requires_schedule: Optional[bool] = True

# Schema for creating service (request from user)
class ServiceCreateRequest(ServiceBase):
    service_name: str
    price: Decimal

# Schema for creating service (with additional fields)
class ServiceCreate(ServiceBase):
    tenant_id: int
    created_by: Optional[str] = None

# Schema for updating service (request from user)
class ServiceUpdateRequest(ServiceBase):
    pass

# Schema for updating service (with additional fields)
class ServiceUpdate(ServiceBase):
    updated_by: Optional[str] = None

# Schema for reading service
class ServiceRead(ServiceBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: int

    class Config:
        from_attributes = True
