from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# Base schema for TestItem
class TestItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    status: str = "active"

# Schema for creating a TestItem
class TestItemCreate(TestItemBase):
    pass

# Schema for updating a TestItem
class TestItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

# Schema for reading a TestItem (response)
class TestItemRead(TestItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None
        }
