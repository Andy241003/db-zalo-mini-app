from pydantic import BaseModel
from typing import Optional
import datetime
import decimal

class RoomBase(BaseModel):
    tenant_id: int
    room_type: str
    room_name: str
    description: Optional[str] = None
    price: Optional[decimal.Decimal] = None
    capacity_adults: Optional[int] = None
    capacity_children: Optional[int] = None
    size_m2: Optional[int] = None
    view_type: Optional[str] = None
    has_balcony: Optional[bool] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    vr360_url: Optional[str] = None
    booking_url: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomCreateRequest(BaseModel):
    """Schema for room creation request (without tenant_id)"""
    room_type: str
    room_name: str
    description: Optional[str] = None
    price: Optional[decimal.Decimal] = None
    capacity_adults: Optional[int] = None
    capacity_children: Optional[int] = None
    size_m2: Optional[int] = None
    view_type: Optional[str] = None
    has_balcony: Optional[bool] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    vr360_url: Optional[str] = None
    booking_url: Optional[str] = None

class RoomRead(RoomBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class RoomUpdate(RoomBase):
    tenant_id: Optional[int] = None
    room_type: Optional[str] = None  
    room_name: Optional[str] = None
