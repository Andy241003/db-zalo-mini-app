from pydantic import BaseModel
from typing import Optional, Dict, Any
import datetime

class GameBase(BaseModel):
    game_name: Optional[str] = None
    configurations: Optional[Dict[str, Any]] = None
    status: Optional[str] = "active"

class GameCreate(GameBase):
    game_name: str
    tenant_id: int
    created_by: Optional[str] = None

class GameCreateRequest(GameBase):
    """Request model without tenant_id (will be added by endpoint)"""
    game_name: str

class GameRead(GameBase):
    id: int
    tenant_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

class GameUpdate(GameBase):
    updated_by: Optional[str] = None

class GameUpdateRequest(GameBase):
    """Request model for updates without tenant_id"""
    pass
