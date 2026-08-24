from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import math

from backend.app.core.database import get_db
from backend.app.models.db_models import Detection, Camera, Watchlist
from backend.app.models.schemas import (
    DetectionResponse,
    VehicleTrajectoryResponse,
    RouteWaypoint,
    WatchlistResponse
)

router = APIRouter(prefix="/detections", tags=["Detections & GIS Trajectory"])

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Haversine formula to compute distance in km between two GPS coordinates"""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("", response_model=List[DetectionResponse])
async def get_detections(
    skip: int = 0,
    limit: int = 50,
    plate: Optional[str] = None,
    camera_id: Optional[int] = None,
    watchlist_only: bool = False,
    vehicle_class: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Detection)
        .options(selectinload(Detection.camera), selectinload(Detection.watchlist_entry))
        .order_by(Detection.detected_at.desc())
    )
    
    if plate:
        clean_plate = plate.replace(" ", "").upper()
        query = query.where(Detection.plate_number.ilike(f"%{clean_plate}%"))
    if camera_id:
        query = query.where(Detection.camera_id == camera_id)
    if watchlist_only:
        query = query.where(Detection.is_watchlist_match == True)
    if vehicle_class:
        query = query.where(Detection.vehicle_class == vehicle_class)
    if start_time:
        query = query.where(Detection.detected_at >= start_time)
    if end_time:
        query = query.where(Detection.detected_at <= end_time)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    detections = result.scalars().all()
    
    responses = []
    for d in detections:
        resp = DetectionResponse(
            id=d.id,
            camera_id=d.camera_id,
            plate_number=d.plate_number,
            confidence=d.confidence,
            vehicle_class=d.vehicle_class,
            is_watchlist_match=d.is_watchlist_match,
            watchlist_id=d.watchlist_id,
            snapshot_url=d.snapshot_url,
            latitude=d.latitude,
            longitude=d.longitude,
            estimated_speed_kmh=d.estimated_speed_kmh,
            detected_at=d.detected_at,
            camera_name=d.camera.name if d.camera else "Unknown",
            camera_location=d.camera.location_name if d.camera else "Unknown",
            watchlist_reason=d.watchlist_entry.crime_category if d.watchlist_entry else None,
            watchlist_priority=d.watchlist_entry.priority if d.watchlist_entry else None
        )
        responses.append(resp)
        
    return responses


@router.get("/trajectory/{plate_number}", response_model=VehicleTrajectoryResponse)
async def reconstruct_vehicle_trajectory(
    plate_number: str,
    hours: int = Query(48, description="Historical hours to scan"),
    db: AsyncSession = Depends(get_db)
):
    """Reconstruct exact chronological GIS route of a vehicle across all cameras"""
    clean_plate = plate_number.replace(" ", "").upper()
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # 1. Fetch detections in chronological order
    query = (
        select(Detection)
        .options(selectinload(Detection.camera))
        .where(Detection.plate_number == clean_plate)
        .where(Detection.detected_at >= cutoff_time)
        .order_by(Detection.detected_at.asc())
    )
    result = await db.execute(query)
    detections = result.scalars().all()
    
    # 2. Check if vehicle is in watchlist
    wl_query = select(Watchlist).where(Watchlist.plate_number == clean_plate)
    wl_result = await db.execute(wl_query)
    watchlist_entry = wl_result.scalar_one_or_none()
    
    if not detections:
        return VehicleTrajectoryResponse(
            plate_number=clean_plate,
            total_detections=0,
            is_hotlisted=watchlist_entry is not None,
            hotlist_info=WatchlistResponse.from_orm(watchlist_entry) if watchlist_entry else None,
            waypoints=[],
            geojson_path={}
        )
    
    # 3. Build waypoints & calculate inter-camera speed
    waypoints: List[RouteWaypoint] = []
    coordinates = []
    
    prev_d = None
    for d in detections:
        speed = None
        if prev_d and d.detected_at > prev_d.detected_at:
            dist_km = calculate_distance_km(prev_d.latitude, prev_d.longitude, d.latitude, d.longitude)
            time_hours = (d.detected_at - prev_d.detected_at).total_seconds() / 3600.0
            if time_hours > 0 and dist_km > 0.05: # more than 50 meters
                speed = round(dist_km / time_hours, 1)
                
        wp = RouteWaypoint(
            detection_id=d.id,
            camera_id=d.camera_id,
            camera_name=d.camera.name if d.camera else f"Cam #{d.camera_id}",
            location_name=d.camera.location_name if d.camera else f"Lat: {d.latitude}, Lon: {d.longitude}",
            latitude=d.latitude,
            longitude=d.longitude,
            detected_at=d.detected_at,
            snapshot_url=d.snapshot_url,
            estimated_speed_kmh=speed or d.estimated_speed_kmh,
            is_watchlist_match=d.is_watchlist_match
        )
        waypoints.append(wp)
        coordinates.append([d.longitude, d.latitude])
        prev_d = d
        
    # 4. Generate GeoJSON LineString
    geojson_path = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        },
        "properties": {
            "plate_number": clean_plate,
            "waypoints_count": len(waypoints)
        }
    }
    
    return VehicleTrajectoryResponse(
        plate_number=clean_plate,
        total_detections=len(waypoints),
        first_seen=waypoints[0].detected_at,
        last_seen=waypoints[-1].detected_at,
        is_hotlisted=watchlist_entry is not None,
        hotlist_info=WatchlistResponse.from_orm(watchlist_entry) if watchlist_entry else None,
        waypoints=waypoints,
        geojson_path=geojson_path
    )
