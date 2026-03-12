from pydantic import BaseModel
from typing import Optional
import datetime

class ServiceBookingBase(BaseModel):
    tenant_id: int
    service_id: int
    customer_id: int
    booking_date: datetime.datetime
    status: str
    notes: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class ServiceBookingCreate(ServiceBookingBase):
    pass

class ServiceBookingRead(ServiceBookingBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class ServiceBookingUpdate(ServiceBookingBase):
    pass
