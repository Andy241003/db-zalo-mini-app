from pydantic import BaseModel
from typing import Optional
import datetime

class TenantBase(BaseModel):
    name: str
    domain: str
    status: str = 'active'
    subscription_plan_id: Optional[int] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    
class TenantCreate(TenantBase):
    pass

class TenantRead(TenantBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    deleted: int = 0
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

    class Config:
        orm_mode = True

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None
    subscription_plan_id: Optional[int] = None
    updated_by: Optional[str] = None
