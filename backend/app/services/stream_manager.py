import asyncio
import random
import logging
import cv2
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.future import select

from backend.app.core.database import AsyncSessionLocal
from backend.app.models.db_models import Camera, Watchlist, Detection
from backend.app.services.anpr_engine import anpr_engine
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class StreamManager:
    def __init__(self):
        self.active_tasks: Dict[int, asyncio.Task] = {}
        self.is_running = False

    async def start_stream_worker(self, camera_id: int, rtsp_url: str):
        """Worker thread to consume RTSP camera feed and run ANPR"""
        logger.info(f"Starting RTSP stream worker for camera ID {camera_id}: {rtsp_url}")
        
        cap = None
        while self.is_running:
            try:
                cap = cv2.VideoCapture(rtsp_url)
                if not cap.isOpened():
                    logger.warning(f"Could not open RTSP stream for camera {camera_id}. Retrying in 5s...")
                    await asyncio.sleep(5)
                    continue

                frame_count = 0
                while self.is_running and cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    frame_count += 1
                    # Process 1 frame every 6 frames (approx 5 FPS)
                    if frame_count % 6 == 0:
                        async with AsyncSessionLocal() as session:
                            cam_res = await session.execute(select(Camera).where(Camera.id == camera_id))
                            cam = cam_res.scalar_one_or_none()
                            if cam and cam.is_active:
                                await anpr_engine.process_frame(frame, cam, session)
                                
                    await asyncio.sleep(0.01)
            except Exception as e:
                logger.error(f"Stream error on camera {camera_id}: {e}")
                await asyncio.sleep(5)
            finally:
                if cap is not None:
                    cap.release()

    async def simulate_traffic_cycle(self):
        """Background simulator to mimic city-wide traffic & test real-time GIS alerts"""
        logger.info("Starting Sentinel Smart City Traffic Simulation Loop...")
        
        # Sample normal and hotlisted vehicle plates in Gujarat (GJ) format
        sample_normal_plates = [
            "GJ01AB1234", "GJ01XY9876", "GJ27CR4421", "GJ05MN3321",
            "GJ06KK8899", "GJ18ZZ7711", "GJ03BC5544", "GJ12DE6677"
        ]
        
        while self.is_running:
            try:
                await asyncio.sleep(random.randint(4, 8))
                
                async with AsyncSessionLocal() as session:
                    # Pick random camera
                    cams_res = await session.execute(select(Camera).where(Camera.is_active == True))
                    cameras = cams_res.scalars().all()
                    if not cameras:
                        continue
                        
                    camera = random.choice(cameras)
                    
                    # 25% chance of picking a hotlisted vehicle to demonstrate live red alerts
                    wl_res = await session.execute(select(Watchlist).where(Watchlist.is_active == True))
                    watchlist_items = wl_res.scalars().all()
                    
                    if watchlist_items and random.random() < 0.25:
                        target_plate = random.choice(watchlist_items).plate_number
                    else:
                        target_plate = random.choice(sample_normal_plates)
                        
                    await anpr_engine.process_frame(
                        frame=None,
                        camera=camera,
                        db=session,
                        mock_plate=target_plate
                    )
            except Exception as e:
                logger.error(f"Traffic simulator error: {e}")
                await asyncio.sleep(5)

    async def start(self):
        self.is_running = True
        if settings.ENABLE_MOCK_STREAM_SIMULATION:
            asyncio.create_task(self.simulate_traffic_cycle())

    async def stop(self):
        self.is_running = False
        for cam_id, task in self.active_tasks.items():
            task.cancel()
        self.active_tasks.clear()

stream_manager = StreamManager()
