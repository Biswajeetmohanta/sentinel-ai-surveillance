from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    camera_code = Column(String(50), nullable=True, index=True) # e.g. cam01, cam02
    name = Column(String(100), nullable=False, index=True)
    department = Column(String(100), default="Gujarat Police")
    camera_type = Column(String(50), default="Fixed Bullet") # PTZ, Fixed Bullet, Dome, ANPR HSRP, 360 Fisheye
    ownership = Column(String(100), default="Gujarat Police")
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rtsp_url = Column(Text, nullable=False)
    hls_url = Column(Text, nullable=True)
    webrtc_url = Column(Text, nullable=True)
    stream_type = Column(String(50), default="RTSP") # RTSP, WebRTC, HLS, File
    status = Column(String(20), default="ONLINE")     # ONLINE, OFFLINE, MAINTENANCE
    is_active = Column(Boolean, default=True)
    fps_processing = Column(Integer, default=5)
    coverage_radius_meters = Column(Float, default=150.0)
    installation_year = Column(Integer, default=2023)
    storage_details = Column(String(100), default="NVR 30-Day On-Premise")
    maintenance_status = Column(String(50), default="Operational")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    detections = relationship("Detection", back_populates="camera", cascade="all, delete-orphan")


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plate_number = Column(String(20), unique=True, index=True, nullable=False)
    owner_name = Column(String(100), nullable=True)
    vehicle_make_model = Column(String(100), nullable=True)
    vehicle_type = Column(String(50), default="Car") # Car, Bike, Truck, Bus, Auto
    vehicle_color = Column(String(50), nullable=True)
    crime_category = Column(String(100), nullable=False) # Stolen, Wanted, Hit & Run, Kidnapping
    fir_number = Column(String(100), nullable=True)
    police_station = Column(String(100), default="Ahmedabad Cyber Crime")
    priority = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False, index=True)
    plate_number = Column(String(20), index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    vehicle_class = Column(String(50), default="Car")
    is_watchlist_match = Column(Boolean, default=False, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlist.id"), nullable=True)
    snapshot_url = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    estimated_speed_kmh = Column(Float, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)

    camera = relationship("Camera", back_populates="detections")
    watchlist_entry = relationship("Watchlist")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(100), default="Jyoti (Control Room Officer)")
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Surveillance Officer")
    badge_number = Column(String(50), default="GP-7829")
    department = Column(String(100), default="Gujarat Police Headquarters")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

