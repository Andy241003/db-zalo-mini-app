from pydantic import BaseModel
from typing import Optional
import datetime

class BookingRequestBase(BaseModel):
    tenant_id: int
    customer_id: int
    booking_date: datetime.datetime
    room_id: Optional[int] = None
    facility_id: Optional[int] = None
    mobile_number: Optional[str] = None
    check_in_date: Optional[datetime.datetime] = None
    check_out_date: Optional[datetime.datetime] = None
    note: Optional[str] = None
    request_channel: Optional[str] = None
    status: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class BookingRequestCreate(BookingRequestBase):
    pass

class BookingRequestCreateRequest(BaseModel):
    """Schema for booking request creation request (without tenant_id)"""
    customer_id: int
    booking_date: datetime.datetime
    room_id: Optional[int] = None
    facility_id: Optional[int] = None
    mobile_number: Optional[str] = None
    check_in_date: Optional[datetime.datetime] = None
    check_out_date: Optional[datetime.datetime] = None
    note: Optional[str] = None
    request_channel: Optional[str] = None
    status: Optional[str] = None

class BookingRequestUpdateRequest(BaseModel):
    """Schema for booking request update request (without tenant_id)"""
    customer_id: Optional[int] = None
    booking_date: Optional[datetime.datetime] = None
    room_id: Optional[int] = None
    facility_id: Optional[int] = None
    mobile_number: Optional[str] = None
    check_in_date: Optional[datetime.datetime] = None
    check_out_date: Optional[datetime.datetime] = None
    note: Optional[str] = None
    request_channel: Optional[str] = None
    status: Optional[str] = None

class BookingRequestRead(BookingRequestBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class BookingRequestUpdate(BookingRequestBase):
    pass
