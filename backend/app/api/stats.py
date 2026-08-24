from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any

from backend.app.core.database import get_db
from backend.app.models.db_models import Camera, Detection, Watchlist
from backend.app.models.schemas import DashboardStats

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/overview", response_model=DashboardStats)
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    # 1. Cameras count
    total_cams = (await db.execute(select(func.count(Camera.id)))).scalar() or 0
    active_cams = (await db.execute(select(func.count(Camera.id)).where(Camera.is_active == True))).scalar() or 0
    
    # 2. Today's detections
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_det_today = (await db.execute(
        select(func.count(Detection.id)).where(Detection.detected_at >= today_start)
    )).scalar() or 0
    
    # 3. Today's watchlist alerts
    alerts_today = (await db.execute(
        select(func.count(Detection.id))
        .where(Detection.detected_at >= today_start)
        .where(Detection.is_watchlist_match == True)
    )).scalar() or 0
    
    # 4. Active Watchlist Count & breakdown
    active_wl = (await db.execute(select(func.count(Watchlist.id)).where(Watchlist.is_active == True))).scalar() or 0
    
    breakdown_query = select(Watchlist.crime_category, func.count(Watchlist.id)).group_by(Watchlist.crime_category)
    breakdown_res = (await db.execute(breakdown_query)).all()
    breakdown_dict = {row[0]: row[1] for row in breakdown_res}
    
    return DashboardStats(
        total_cameras=total_cams,
        active_cameras=active_cams,
        total_detections_today=total_det_today,
        total_watchlist_alerts_today=alerts_today,
        active_hotlist_count=active_wl,
        hotlist_breakdown=breakdown_dict
    )
