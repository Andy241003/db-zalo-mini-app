from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Base experience schema
class ExperienceBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    max_participants: Optional[int] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = 'active'

# Schema for creating experience (request from user)
class ExperienceCreateRequest(ExperienceBase):
    name: str
    type: str
    price: float

# Schema for creating experience (with additional fields)
class ExperienceCreate(ExperienceCreateRequest):
    tenant_id: int
    created_by: int

# Schema for updating experience (request from user)
class ExperienceUpdateRequest(ExperienceBase):
    pass

# Schema for updating experience (with additional fields)
class ExperienceUpdate(ExperienceUpdateRequest):
    updated_by: Optional[int] = None

# Schema for reading experience (response to user)
class ExperienceRead(ExperienceBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None

    class Config:
        orm_mode = True
        from_attributes = True
