from pydantic import BaseModel
from typing import Optional
import datetime
import decimal

class HotelBrandBase(BaseModel):
    tenant_id: int
    hotel_name: str
    slogan: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_images: Optional[str] = None
    intro_video_url: Optional[str] = None
    vr360_url: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    website_url: Optional[str] = None
    zalo_oa_id: Optional[str] = None
    zalo_app_id: Optional[str] = None
    zalo_secret_key: Optional[str] = None
    facebook_url: Optional[str] = None
    youtube_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    instagram_url: Optional[str] = None
    google_map_url: Optional[str] = None
    latitude: Optional[decimal.Decimal] = None
    longitude: Optional[decimal.Decimal] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    copyright_text: Optional[str] = None
    terms_url: Optional[str] = None
    privacy_url: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    deleted: Optional[int] = None
    deleted_at: Optional[datetime.datetime] = None
    deleted_by: Optional[str] = None

class HotelBrandCreate(HotelBrandBase):
    pass

class HotelBrandRead(HotelBrandBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class HotelBrandUpdate(HotelBrandBase):
    pass
