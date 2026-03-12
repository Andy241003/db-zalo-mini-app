"""
SQLAlchemy Models for Zalo Mini App Hotel Booking System
Generated from MySQL schema with multi-tenant architecture
"""

from sqlalchemy import Column, Integer, String, Text, DECIMAL, Boolean, DateTime, Date, ForeignKey, Index, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional
from datetime import datetime

Base = declarative_base()

# Test table for Zalo app - no tenant_id required
class TblTestItems(Base):
    __tablename__ = 'tbl_test_items'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2))
    image_url = Column(String(500))
    status = Column(String(20), default='active')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())

class TblTenants(Base):
    __tablename__ = 'tbl_tenants'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, nullable=False)
    status = Column(String(20), default='active')
    subscription_plan_id = Column(Integer)
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblRooms(Base):
    __tablename__ = 'tbl_rooms'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    room_type = Column(String(100), nullable=False)
    room_name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2))
    capacity_adults = Column(Integer)
    capacity_children = Column(Integer)
    size_m2 = Column(Integer)
    view_type = Column(String(50))
    has_balcony = Column(Boolean)
    image_url = Column(String(255))
    video_url = Column(String(255))
    vr360_url = Column(String(255))
    booking_url = Column(String(255))
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblRoomAmenities(Base):
    __tablename__ = 'tbl_room_amenities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('tbl_rooms.id', ondelete='CASCADE'))
    amenity_name = Column(String(100))

class TblRoomFeatures(Base):
    __tablename__ = 'tbl_room_features'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey('tbl_rooms.id', ondelete='CASCADE'))
    feature_name = Column(String(100))
    feature_type = Column(String(50))  # bathroom, bedroom, general, etc.
    description = Column(Text)
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblFacilities(Base):
    __tablename__ = 'tbl_facilities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    facility_name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50))  # restaurant, spa, gym, pool, etc.
    image_url = Column(String(255))
    video_url = Column(String(255))
    vr360_url = Column(String(255))
    gallery_url = Column(String(255))
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblFacilityFeatures(Base):
    __tablename__ = 'tbl_facility_features'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(Integer, ForeignKey('tbl_facilities.id', ondelete='CASCADE'))
    feature_name = Column(String(100))

class TblHotelBrands(Base):
    __tablename__ = 'tbl_hotel_brands'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    hotel_name = Column(String(255), nullable=False)
    slogan = Column(String(255))
    description = Column(Text)
    logo_url = Column(String(255))
    banner_images = Column(JSON)
    intro_video_url = Column(String(255))
    vr360_url = Column(String(255))
    
    address = Column(String(255))
    district = Column(String(100))
    city = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    phone_number = Column(String(50))
    email = Column(String(100))
    website_url = Column(String(255))
    zalo_oa_id = Column(String(50))
    zalo_app_id = Column(String(50))
    zalo_secret_key = Column(String(100))
    facebook_url = Column(String(255))
    youtube_url = Column(String(255))
    tiktok_url = Column(String(255))
    instagram_url = Column(String(255))
    google_map_url = Column(String(512))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    
    primary_color = Column(String(10))
    secondary_color = Column(String(10))
    
    copyright_text = Column(String(255))
    terms_url = Column(String(255))
    privacy_url = Column(String(255))
    
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblCustomers(Base):
    __tablename__ = 'tbl_customers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    zalo_user_id = Column(String(100), unique=True)
    name = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblBookingRequests(Base):
    __tablename__ = 'tbl_booking_requests'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    customer_id = Column(Integer, nullable=False)
    room_id = Column(Integer)
    facility_id = Column(Integer)
    mobile_number = Column(String(20))  # số điện thoại liên hệ khách
    booking_date = Column(DateTime, nullable=False)
    check_in_date = Column(DateTime)
    check_out_date = Column(DateTime)
    note = Column(Text)
    request_channel = Column(String(50))  # zalo_chat | external_link
    status = Column(String(20), default='requested')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblServices(Base):
    __tablename__ = 'tbl_services'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    service_name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50))
    image_url = Column(String(255))
    price = Column(DECIMAL(10, 2))
    unit = Column(String(50))
    duration_minutes = Column(Integer)
    requires_schedule = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblServiceBookings(Base):
    __tablename__ = 'tbl_service_bookings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    booking_request_id = Column(Integer, ForeignKey('tbl_booking_requests.id'))
    service_id = Column(Integer, ForeignKey('tbl_services.id'))
    quantity = Column(Integer, default=1)
    total_price = Column(DECIMAL(10, 2))
    booking_date = Column(DateTime)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblVouchers(Base):
    __tablename__ = 'tbl_vouchers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    promotion_id = Column(Integer)
    code = Column(String(100), unique=True)
    discount_type = Column(String(20))  # percentage | fixed
    discount_value = Column(DECIMAL(10, 2))
    max_usage = Column(Integer)
    used_count = Column(Integer, default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(20), default='active')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblCustomerVouchers(Base):
    __tablename__ = 'tbl_customer_vouchers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey('tbl_customers.id'))
    voucher_id = Column(Integer, ForeignKey('tbl_vouchers.id'))
    used_at = Column(DateTime)
    booking_request_id = Column(Integer, ForeignKey('tbl_booking_requests.id'))
    is_used = Column(Boolean, default=False)
    assigned_date = Column(DateTime, default=func.current_timestamp())
    status = Column(String(20), default='active')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)
    
class TblPromotions(Base):
    __tablename__ = 'tbl_promotions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255))
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    banner_image = Column(String(512))
    status = Column(String(20), default='active')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblGames(Base):
    __tablename__ = 'tbl_games'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    game_name = Column(String(100))
    configurations = Column(JSON)
    status = Column(String(20), default='active')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

class TblRoomStays(Base):
    __tablename__ = 'tbl_room_stays'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    booking_request_id = Column(Integer, ForeignKey('tbl_booking_requests.id'))
    room_id = Column(Integer, ForeignKey('tbl_rooms.id'))
    customer_id = Column(Integer, ForeignKey('tbl_customers.id'))
    checkin_date = Column(DateTime, nullable=False)
    checkout_date = Column(DateTime, nullable=False)
    actual_checkin = Column(DateTime)
    actual_checkout = Column(DateTime)
    status = Column(String(20), default='reserved')
    total_amount = Column(DECIMAL(12, 2))
    payment_status = Column(String(20), default='pending')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)

# Admin Users table for authentication
class TblAdminUsers(Base):
    __tablename__ = 'tbl_admin_users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, index=True)  # NULL nếu là super_admin toàn hệ thống
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    email = Column(String(100))
    role = Column(String(20), default='hotel_admin')  # 'super_admin', 'hotel_admin'
    status = Column(String(20), default='active')
    created_at = Column(DateTime, nullable=False, default=func.current_timestamp())
    updated_at = Column(DateTime, nullable=False, default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(50))
    updated_by = Column(String(50))
    deleted = Column(Integer, default=0)
    deleted_at = Column(DateTime, default=None)
    deleted_by = Column(String(50), default=None)
