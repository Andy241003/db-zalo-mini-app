from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Base schema for AdminUser
class AdminUserBase(BaseModel):
    username: str
    email: Optional[str] = None
    role: str = "hotel_admin"
    tenant_id: Optional[int] = None
    status: str = "active"

# Schema for creating AdminUser
class AdminUserCreate(AdminUserBase):
    password: str

# Schema for updating AdminUser
class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None
    status: Optional[str] = None
    password: Optional[str] = None

# Schema for AdminUser response (without password)
class AdminUserResponse(AdminUserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        # Support both pydantic v1 and v2: use `orm_mode` (v1) and `from_attributes` (v2)
        orm_mode = True
        from_attributes = True

# Schema for AdminUser in database
class AdminUserInDB(AdminUserResponse):
    hashed_password: str

# Schema for login
class AdminUserLogin(BaseModel):
    username: str
    password: str

# Schema for token response
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for token data
class TokenData(BaseModel):
    username: Optional[str] = None
    tenant_id: Optional[int] = None
