from pydantic import BaseModel
from typing import Optional
import datetime

class FacilityFeatureBase(BaseModel):
    facility_id: int
    feature_name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None

class FacilityFeatureCreate(FacilityFeatureBase):
    pass

class FacilityFeatureRead(FacilityFeatureBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True
        orm_mode = True
        from_attributes = True

class FacilityFeatureUpdate(FacilityFeatureBase):
    pass
