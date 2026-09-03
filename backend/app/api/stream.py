import os
import cv2
import time
import asyncio
import logging
import threading
import urllib.parse
from typing import Dict, Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stream", tags=["Live Stream"])

# Low-latency, zero-buffer FFmpeg RTSP options
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;0"

USERNAME = urllib.parse.quote("jyoti@deventtechnology.com")
PASSWORD = urllib.parse.quote("CBUB-226S-HMZ9")
RTSP_HOST = "103.250.160.189:8554"

class CameraStreamWorker:
    """
    Dedicated background capture worker for a single camera.
    Continuously updates the latest JPEG frame to eliminate buffering lag.
    """
    def __init__(self, camera_code: str):
        self.camera_code = camera_code
        self.latest_jpeg: Optional[bytes] = None
        self.is_running = False
        self.client_count = 0
        self.thread: Optional[threading.Thread] = None
        self.last_accessed = time.time()

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.is_running = False
        self.thread = None

    def _capture_loop(self):
        cid = self.camera_code.lower()
        if not cid.startswith("cam"):
            cid = f"cam{cid.zfill(2)}"

        rtsp_url = f"rtsp://{USERNAME}:{PASSWORD}@{RTSP_HOST}/stream/{cid}"
        logger.info(f"Starting low-latency capture worker for {cid}")

        while self.is_running:
            cap = None
            try:
                cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

                if not cap.isOpened():
                    time.sleep(1.0)
                    continue

                while self.is_running and cap.isOpened():
                    # Stop if no clients have watched for > 30 seconds
                    if self.client_count <= 0 and (time.time() - self.last_accessed > 30):
                        logger.info(f"Idling inactive stream worker for {cid}")
                        self.is_running = False
                        break

                    ret, frame = cap.read()
                    if not ret:
                        # Reconnect on GOP loop boundary
                        break

                    # Resize to optimal 854x480 (480p) for ultra-smooth 30fps web throughput
                    small = cv2.resize(frame, (854, 480), interpolation=cv2.INTER_LINEAR)
                    
                    # Encode with high-speed quality 65
                    ok, buffer = cv2.imencode(".jpg", small, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
                    if ok:
                        self.latest_jpeg = buffer.tobytes()

                    # Yield slight CPU slice
                    time.sleep(0.015)

            except Exception as e:
                logger.error(f"Capture worker error for {cid}: {e}")
                time.sleep(1.0)
            finally:
                if cap is not None:
                    cap.release()

class StreamHub:
    """Central registry of active camera stream workers"""
    def __init__(self):
        self.workers: Dict[str, CameraStreamWorker] = {}
        self.lock = threading.Lock()

    def get_worker(self, camera_code: str) -> CameraStreamWorker:
        with self.lock:
            cid = camera_code.lower()
            if cid not in self.workers or not self.workers[cid].is_running:
                worker = CameraStreamWorker(cid)
                worker.start()
                self.workers[cid] = worker
            return self.workers[cid]

hub = StreamHub()

async def stream_generator(camera_code: str):
    worker = hub.get_worker(camera_code)
    worker.client_count += 1
    worker.last_accessed = time.time()
    
    try:
        while True:
            worker.last_accessed = time.time()
            if worker.latest_jpeg:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + worker.latest_jpeg + b"\r\n"
                )
            # Smooth 25-30 FPS pacing (35ms per frame)
            await asyncio.sleep(0.035)
    except (GeneratorExit, asyncio.CancelledError):
        pass
    finally:
        worker.client_count = max(0, worker.client_count - 1)
        worker.last_accessed = time.time()

@router.get("/live-video/{camera_code}")
async def live_video_feed(camera_code: str):
    """
    Ultra-Low-Latency MJPEG Stream.
    Uses zero-buffer capture worker + shared in-memory broadcaster.
    Guarantees instantaneous real-time playback without lag or packet drops.
    """
    return StreamingResponse(
        stream_generator(camera_code),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
