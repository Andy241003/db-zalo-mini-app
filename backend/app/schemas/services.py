from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List, Union
from decimal import Decimal

# Base service schema
class ServiceBase(BaseModel):
    service_name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[Union[str, List[str]]] = None  # array of image URLs for slideshow
    price: Optional[Decimal] = None
    unit: Optional[str] = None
    duration_minutes: Optional[int] = None
    requires_schedule: Optional[bool] = True

    @validator('image_url', pre=True)
    def normalize_image_url(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            return v
        raise ValueError('image_url must be a string or list of strings')

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
        orm_mode = True
        from_attributes = True
