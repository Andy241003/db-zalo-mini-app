from pydantic import BaseModel
from typing import Optional
import datetime

class RoomFeatureBase(BaseModel):
    room_id: int
    feature_name: str
    feature_type: Optional[str] = None  # bathroom, bedroom, general, etc.
    description: Optional[str] = None

class RoomFeatureCreate(RoomFeatureBase):
    pass

class RoomFeatureRead(RoomFeatureBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True
        orm_mode = True
        from_attributes = True

class RoomFeatureUpdate(RoomFeatureBase):
    pass
