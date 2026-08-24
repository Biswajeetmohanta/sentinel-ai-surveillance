from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from backend.app.core.database import get_db
from backend.app.models.db_models import Camera
from backend.app.models.schemas import CameraCreate, CameraUpdate, CameraResponse

router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=List[CameraResponse])
async def get_all_cameras(
    skip: int = 0,
    limit: int = 100,
    department: str = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Camera)
    if department:
        query = query.where(Camera.department == department)
    query = query.offset(skip).limit(limit).order_by(Camera.id.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera_by_id(camera_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.post("", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(camera_in: CameraCreate, db: AsyncSession = Depends(get_db)):
    camera = Camera(**camera_in.dict())
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    return camera

@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(camera_id: int, camera_in: CameraUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    update_data = camera_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)
        
    await db.commit()
    await db.refresh(camera)
    return camera

@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    await db.delete(camera)
    await db.commit()
    return None
