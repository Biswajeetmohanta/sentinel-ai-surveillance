from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Camera Schemas ---
class CameraBase(BaseModel):
    name: str
    department: Optional[str] = "Gujarat Police"
    location_name: str
    latitude: float
    longitude: float
    rtsp_url: str
    stream_type: Optional[str] = "RTSP"
    status: Optional[str] = "ONLINE"
    is_active: Optional[bool] = True
    fps_processing: Optional[int] = 5

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rtsp_url: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    fps_processing: Optional[int] = None

class CameraResponse(CameraBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Watchlist Schemas ---
class WatchlistBase(BaseModel):
    plate_number: str
    owner_name: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_type: Optional[str] = "Car"
    vehicle_color: Optional[str] = None
    crime_category: str
    fir_number: Optional[str] = None
    police_station: Optional[str] = "Ahmedabad Central"
    priority: Optional[str] = "HIGH"
    notes: Optional[str] = None
    is_active: Optional[bool] = True

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    owner_name: Optional[str] = None
    vehicle_make_model: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    crime_category: Optional[str] = None
    fir_number: Optional[str] = None
    police_station: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class WatchlistResponse(WatchlistBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Detection Schemas ---
class DetectionBase(BaseModel):
    camera_id: int
    plate_number: str
    confidence: float
    vehicle_class: Optional[str] = "Car"
    is_watchlist_match: Optional[bool] = False
    watchlist_id: Optional[int] = None
    snapshot_url: Optional[str] = None
    latitude: float
    longitude: float
    estimated_speed_kmh: Optional[float] = None

class DetectionCreate(DetectionBase):
    detected_at: Optional[datetime] = None

class DetectionResponse(DetectionBase):
    id: int
    detected_at: datetime
    camera_name: Optional[str] = None
    camera_location: Optional[str] = None
    watchlist_reason: Optional[str] = None
    watchlist_priority: Optional[str] = None

    class Config:
        from_attributes = True


# --- GIS Trajectory Route Schemas ---
class RouteWaypoint(BaseModel):
    detection_id: int
    camera_id: int
    camera_name: str
    location_name: str
    latitude: float
    longitude: float
    detected_at: datetime
    snapshot_url: Optional[str] = None
    estimated_speed_kmh: Optional[float] = None
    is_watchlist_match: bool

class VehicleTrajectoryResponse(BaseModel):
    plate_number: str
    total_detections: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    is_hotlisted: bool = False
    hotlist_info: Optional[WatchlistResponse] = None
    waypoints: List[RouteWaypoint] = []
    geojson_path: dict = {}


# --- Dashboard Stats Schemas ---
class DashboardStats(BaseModel):
    total_cameras: int
    active_cameras: int
    total_detections_today: int
    total_watchlist_alerts_today: int
    active_hotlist_count: int
    hotlist_breakdown: dict
