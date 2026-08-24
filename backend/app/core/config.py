from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel AI Surveillance Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./sentinel.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS_CACHE: bool = False
    
    # MediaMTX
    MEDIAMTX_API_URL: str = "http://localhost:8554"
    MEDIAMTX_RTSP_BASE: str = "rtsp://localhost:8554"
    
    # AI Engine
    AI_CONFIDENCE_THRESHOLD: float = 0.75
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    ENABLE_MOCK_STREAM_SIMULATION: bool = True
    SNAPSHOT_STORAGE_PATH: str = "./uploads/snapshots"
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure snapshot directory exists
os.makedirs(settings.SNAPSHOT_STORAGE_PATH, exist_ok=True)
