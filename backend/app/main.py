from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import sys
import os

# Add paths to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.db_models import Camera, Watchlist, Detection
from app.api import cameras, watchlist, detections, stats, websocket, stream, hls_proxy, auth
from app.api.auth import seed_default_user
from app.services.stream_manager import stream_manager
from sqlalchemy.future import select

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sentinel")

async def seed_initial_data():
    """Seed sample Gujarat Police CCTV camera network & suspect watchlist"""
    async with AsyncSessionLocal() as session:
        # 1. Seed Cameras across Ahmedabad & Gandhinagar
        cams_exist = (await session.execute(select(Camera))).scalars().first()
        if not cams_exist:
            sample_cameras = [
                Camera(
                    name="SG Highway - ISKCON Cross Road",
                    department="Gujarat Traffic Police",
                    location_name="ISKCON Junction, SG Highway, Ahmedabad",
                    latitude=23.0286,
                    longitude=72.5068,
                    rtsp_url="rtsp://localhost:8554/cam_iskcon",
                    status="ONLINE",
                    fps_processing=5
                ),
                Camera(
                    name="Sindhu Bhavan Road - Taj Skyline Junction",
                    department="Ahmedabad City Police",
                    location_name="Sindhu Bhavan Marg, Bodakdev",
                    latitude=23.0398,
                    longitude=72.4984,
                    rtsp_url="rtsp://localhost:8554/cam_sbr",
                    status="ONLINE",
                    fps_processing=5
                ),
                Camera(
                    name="Ashram Road - Income Tax Circle",
                    department="Gujarat Traffic Police",
                    location_name="Income Tax Circle, Ashram Road",
                    latitude=23.0416,
                    longitude=72.5714,
                    rtsp_url="rtsp://localhost:8554/cam_ashram",
                    status="ONLINE",
                    fps_processing=5
                ),
                Camera(
                    name="Gandhinagar - CH-0 Secretariat Circle",
                    department="Gandhinagar Police",
                    location_name="Sector 10, New Sachivalaya, Gandhinagar",
                    latitude=23.2156,
                    longitude=72.6369,
                    rtsp_url="rtsp://localhost:8554/cam_sachivalaya",
                    status="ONLINE",
                    fps_processing=5
                ),
                Camera(
                    name="GIFT City - Entry Gate Tollway",
                    department="GIFT City Security Unit",
                    location_name="GIFT City Main Boulevard",
                    latitude=23.1593,
                    longitude=72.6841,
                    rtsp_url="rtsp://localhost:8554/cam_gift",
                    status="ONLINE",
                    fps_processing=5
                ),
                Camera(
                    name="Kalupur - Railway Station South Gate",
                    department="Railway Police Force (RPF)",
                    location_name="Kalupur Railway Station, Old City",
                    latitude=23.0232,
                    longitude=72.5999,
                    rtsp_url="rtsp://localhost:8554/cam_kalupur",
                    status="ONLINE",
                    fps_processing=5
                )
            ]
            session.add_all(sample_cameras)
            logger.info("Seeded 6 primary Gujarat Police CCTV cameras.")

        # 2. Seed High-Priority Suspect Watchlist
        wl_exist = (await session.execute(select(Watchlist))).scalars().first()
        if not wl_exist:
            sample_watchlist = [
                Watchlist(
                    plate_number="GJ01AB1234",
                    owner_name="Ramesh Patel (Suspect)",
                    vehicle_make_model="White Hyundai Creta",
                    vehicle_type="Car",
                    vehicle_color="White",
                    crime_category="Stolen Vehicle",
                    fir_number="FIR-2026/894-Sola",
                    police_station="Sola High Court Police Station",
                    priority="CRITICAL",
                    notes="Wanted in connection with highway robbery case"
                ),
                Watchlist(
                    plate_number="GJ27CR4421",
                    owner_name="Unknown",
                    vehicle_make_model="Black Mahindra Scorpio",
                    vehicle_type="Car",
                    vehicle_color="Black",
                    crime_category="Hit & Run Case",
                    fir_number="FIR-2026/102-Vastrapur",
                    police_station="Vastrapur Police Station",
                    priority="HIGH",
                    notes="Fled scene near AlphaOne mall"
                ),
                Watchlist(
                    plate_number="GJ05MN3321",
                    owner_name="Vikram Singh",
                    vehicle_make_model="Red Royal Enfield Classic 350",
                    vehicle_type="Bike",
                    vehicle_color="Red",
                    crime_category="Kidnapping Investigation",
                    fir_number="FIR-2026/411-CrimeBranch",
                    police_station="Ahmedabad Crime Branch",
                    priority="CRITICAL",
                    notes="Suspect last spotted heading towards Gandhinagar bypass"
                )
            ]
            session.add_all(sample_watchlist)
            logger.info("Seeded 3 critical watchlist entries.")

        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Initializing Sentinel AI Database and Services...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await seed_initial_data()
    await seed_default_user()
    await stream_manager.start()
    yield
    # Shutdown
    logger.info("🛑 Shutting down stream manager...")
    await stream_manager.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Gujarat Police Unified CCTV Video Ingestion, ANPR & GIS Vehicle Tracking Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for snapshots
os.makedirs(settings.SNAPSHOT_STORAGE_PATH, exist_ok=True)
app.mount("/snapshots", StaticFiles(directory=settings.SNAPSHOT_STORAGE_PATH), name="snapshots")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(cameras.router, prefix=settings.API_V1_STR)
app.include_router(watchlist.router, prefix=settings.API_V1_STR)
app.include_router(detections.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)
app.include_router(stream.router, prefix=settings.API_V1_STR)
app.include_router(hls_proxy.router, prefix=settings.API_V1_STR)

@app.get("/enc.key")
async def root_encryption_key():
    return await hls_proxy.get_encryption_key()

# Real-time WebSocket Endpoint
@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket_conn: WebSocket):
    await websocket.manager.connect(websocket_conn)
    try:
        while True:
            # Keep-alive heartbeat listener
            data = await websocket_conn.receive_text()
    except WebSocketDisconnect:
        websocket.manager.disconnect(websocket_conn)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Sentinel AI Surveillance Backend",
        "version": "1.0.0",
        "docs_url": "/docs",
        "websocket_url": "/ws/alerts"
    }
