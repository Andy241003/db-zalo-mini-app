from pydantic import BaseModel
from typing import Optional
import datetime

class FacilityBase(BaseModel):
    tenant_id: int
    facility_name: str
    description: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    vr360_url: Optional[str] = None
    gallery_url: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class FacilityCreate(FacilityBase):
    pass

class FacilityCreateRequest(BaseModel):
    """Schema for facility creation request (without tenant_id)"""
    facility_name: str
    description: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    vr360_url: Optional[str] = None
    gallery_url: Optional[str] = None

class FacilityUpdateRequest(BaseModel):
    """Schema for facility update request (without tenant_id)"""
    facility_name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    vr360_url: Optional[str] = None
    gallery_url: Optional[str] = None

class FacilityRead(FacilityBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class FacilityUpdate(FacilityBase):
    pass
