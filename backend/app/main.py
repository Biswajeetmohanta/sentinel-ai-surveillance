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
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sentinel")

async def auto_migrate_sqlite():
    """Automatically alter existing SQLite tables to add missing columns without dropping data"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            res = await conn.execute(text("PRAGMA table_info(cameras)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                missing_cols = {
                    "camera_code": "VARCHAR(50)",
                    "department": "VARCHAR(100) DEFAULT 'Gujarat Police'",
                    "camera_type": "VARCHAR(50) DEFAULT 'Fixed Bullet'",
                    "ownership": "VARCHAR(100) DEFAULT 'Gujarat Police'",
                    "hls_url": "TEXT",
                    "webrtc_url": "TEXT",
                    "stream_type": "VARCHAR(50) DEFAULT 'RTSP'",
                    "fps_processing": "INTEGER DEFAULT 5",
                    "coverage_radius_meters": "FLOAT DEFAULT 150.0",
                    "installation_year": "INTEGER DEFAULT 2023",
                    "storage_details": "VARCHAR(100) DEFAULT 'NVR 30-Day On-Premise'",
                    "maintenance_status": "VARCHAR(50) DEFAULT 'Operational'"
                }
                for col_name, col_def in missing_cols.items():
                    if col_name not in cols:
                        logger.info(f"Auto-migrating cameras table: adding missing column {col_name}...")
                        await conn.execute(text(f"ALTER TABLE cameras ADD COLUMN {col_name} {col_def}"))
        except Exception as e:
            logger.warning(f"Auto-migration note: {e}")

async def seed_initial_data():
    """Ensure all 30 official Gujarat Police cameras exist in database"""
    async with AsyncSessionLocal() as session:
        # 1. Seed or Upgrade to 30 Official Gujarat Police Cameras
        res = await session.execute(select(Camera))
        existing_cams = res.scalars().all()

        needs_upgrade = (
            len(existing_cams) < 30 or
            any(c.name.startswith("SG Highway") for c in existing_cams) or
            any(c.camera_code is None for c in existing_cams)
        )

        if needs_upgrade:
            logger.info("Upgrading camera network to all 30 official Gujarat Police cameras...")
            try:
                from seed_official_cameras import OFFICIAL_CAMERAS_DATA
            except ImportError:
                import sys
                sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
                from seed_official_cameras import OFFICIAL_CAMERAS_DATA

            # Clear outdated mock cameras
            for old_cam in existing_cams:
                await session.delete(old_cam)
            await session.commit()

            # Insert all 30 real Gujarat Police cameras
            for cdata in OFFICIAL_CAMERAS_DATA:
                cam = Camera(**cdata)
                session.add(cam)
            await session.commit()
            logger.info(f"Successfully seeded {len(OFFICIAL_CAMERAS_DATA)} official Gujarat Police cameras (cam01 - cam30).")

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
    await auto_migrate_sqlite()
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
