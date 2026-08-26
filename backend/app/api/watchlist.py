from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import csv
import io
from app.core.database import get_db
from app.models.db_models import Watchlist
from app.models.schemas import WatchlistCreate, WatchlistUpdate, WatchlistResponse

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.get("", response_model=List[WatchlistResponse])
async def get_watchlist(
    skip: int = 0,
    limit: int = 200,
    priority: Optional[str] = None,
    crime_category: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Watchlist).where(Watchlist.is_active == True)
    if priority:
        query = query.where(Watchlist.priority == priority)
    if crime_category:
        query = query.where(Watchlist.crime_category == crime_category)
    if q:
        query = query.where(Watchlist.plate_number.ilike(f"%{q}%"))
    query = query.offset(skip).limit(limit).order_by(Watchlist.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{watchlist_id}", response_model=WatchlistResponse)
async def get_watchlist_item(watchlist_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")
    return item

@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def create_watchlist_entry(entry_in: WatchlistCreate, db: AsyncSession = Depends(get_db)):
    clean_plate = entry_in.plate_number.replace(" ", "").upper()
    existing = await db.execute(select(Watchlist).where(Watchlist.plate_number == clean_plate))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Vehicle number plate already exists in watchlist")
    
    data = entry_in.dict()
    data["plate_number"] = clean_plate
    item = Watchlist(**data)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/{watchlist_id}", response_model=WatchlistResponse)
async def update_watchlist_entry(watchlist_id: int, entry_in: WatchlistUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")
    
    for field, value in entry_in.dict(exclude_unset=True).items():
        setattr(item, field, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist_entry(watchlist_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")
    await db.delete(item)
    await db.commit()
    return None

@router.post("/bulk-import")
async def bulk_import_watchlist(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    
    imported_count = 0
    skipped_count = 0
    
    for row in reader:
        raw_plate = row.get("plate_number") or row.get("plate")
        if not raw_plate:
            continue
        clean_plate = raw_plate.replace(" ", "").upper()
        
        # Check duplicate
        res = await db.execute(select(Watchlist).where(Watchlist.plate_number == clean_plate))
        if res.scalar_one_or_none():
            skipped_count += 1
            continue
            
        entry = Watchlist(
            plate_number=clean_plate,
            owner_name=row.get("owner_name", ""),
            vehicle_make_model=row.get("vehicle_make_model", ""),
            vehicle_type=row.get("vehicle_type", "Car"),
            crime_category=row.get("crime_category", "Suspect"),
            fir_number=row.get("fir_number", ""),
            police_station=row.get("police_station", "Gujarat Police HQ"),
            priority=row.get("priority", "HIGH"),
            notes=row.get("notes", "")
        )
        db.add(entry)
        imported_count += 1
        
    await db.commit()
    return {
        "status": "success",
        "imported_records": imported_count,
        "skipped_duplicates": skipped_count
    }
