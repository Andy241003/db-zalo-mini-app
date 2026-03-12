from pydantic import BaseModel
from typing import Optional
import datetime

class RoomStayBase(BaseModel):
    tenant_id: int
    customer_id: int
    room_id: int
    check_in: datetime.datetime
    check_out: Optional[datetime.datetime] = None
    status: Optional[str] = None
    note: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class RoomStayCreate(RoomStayBase):
    pass

class RoomStayRead(RoomStayBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class RoomStayUpdate(RoomStayBase):
    pass
