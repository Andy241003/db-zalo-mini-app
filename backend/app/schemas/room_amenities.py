from pydantic import BaseModel
from typing import Optional
import datetime

class RoomAmenityBase(BaseModel):
    room_id: int
    amenity_name: str
    amenity_type: Optional[str] = None  # wifi, ac, tv, minibar, etc.
    icon_url: Optional[str] = None

class RoomAmenityCreate(RoomAmenityBase):
    pass

class RoomAmenityRead(RoomAmenityBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True
        orm_mode = True
        from_attributes = True

class RoomAmenityUpdate(RoomAmenityBase):
    pass
