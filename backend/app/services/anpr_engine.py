import re
import os
import cv2
import numpy as np
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.db_models import Detection, Watchlist, Camera
from app.api.websocket import manager as ws_manager

logger = logging.getLogger(__name__)

# Regular expressions for standard Indian number plates
INDIAN_PLATE_PATTERN = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$')

class ANPREngine:
    def __init__(self):
        self.yolo_model = None
        self.ocr_engine = None
        self.initialized = False
        self.load_models()

    def load_models(self):
        """Lazy load YOLOv8 and PaddleOCR models"""
        try:
            from ultralytics import YOLO
            self.yolo_model = YOLO(settings.YOLO_MODEL_PATH)
            logger.info("YOLOv8 model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load YOLOv8 directly: {e}. Will use OpenCV/heuristic pipeline.")

        # Load OCR engine in background daemon thread to avoid blocking server startup
        def _bg_load_ocr():
            try:
                import easyocr
                self.ocr_engine = easyocr.Reader(['en'], gpu=False)
                logger.info("EasyOCR engine initialized successfully.")
            except Exception as e:
                logger.warning(f"EasyOCR background loading failed: {e}")

        import threading
        threading.Thread(target=_bg_load_ocr, daemon=True).start()
            
        self.initialized = True

    def preprocess_plate_image(self, plate_crop: np.ndarray) -> np.ndarray:
        """Enhanced preprocessing for dirty/tilted/low-light Indian license plates"""
        try:
            # 1. Resize to standard dimensions for OCR
            h, w = plate_crop.shape[:2]
            if h == 0 or w == 0:
                return plate_crop
            scaling = 200.0 / h
            resized = cv2.resize(plate_crop, (int(w * scaling), 200), interpolation=cv2.INTER_CUBIC)
            
            # 2. Convert to Grayscale & Contrast Equalization
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            contrast_boost = clahe.apply(gray)
            
            # 3. Bilateral filter to remove noise while keeping edges sharp
            filtered = cv2.bilateralFilter(contrast_boost, 11, 17, 17)
            return filtered
        except Exception as e:
            logger.error(f"Preprocessing error: {e}")
            return plate_crop

    def clean_plate_text(self, text: str) -> str:
        """Clean alphanumeric characters and normalize Indian state plates (e.g. GJ 01...)"""
        cleaned = re.sub(r'[^A-Za-z0-9]', '', text).upper()
        # Common OCR fixes (e.g. 'O' to '0' in number position, 'I' to '1')
        if len(cleaned) >= 4 and cleaned.startswith("G"):
            # Ensure GJ prefix if scanned as G3, G1 etc.
            if cleaned.startswith("G3") or cleaned.startswith("GI") or cleaned.startswith("GL"):
                cleaned = "GJ" + cleaned[2:]
        return cleaned

    def extract_plate_text(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """Perform OCR on license plate crop using EasyOCR or PaddleOCR"""
        if self.ocr_engine is not None:
            try:
                processed = self.preprocess_plate_image(plate_crop)
                # EasyOCR
                if hasattr(self.ocr_engine, 'readtext'):
                    results = self.ocr_engine.readtext(processed)
                    if results:
                        full_text = ""
                        total_conf = 0.0
                        for bbox, text, conf in results:
                            full_text += text
                            total_conf += conf
                        cleaned = self.clean_plate_text(full_text)
                        avg_conf = (total_conf / len(results)) if len(results) > 0 else 0.8
                        return cleaned, round(avg_conf, 2)
                # PaddleOCR Fallback
                elif hasattr(self.ocr_engine, 'ocr'):
                    result = self.ocr_engine.ocr(processed, cls=True)
                    if result and result[0]:
                        full_text = ""
                        total_conf = 0.0
                        for line in result[0]:
                            text, conf = line[1]
                            full_text += text
                            total_conf += conf
                        cleaned = self.clean_plate_text(full_text)
                        avg_conf = (total_conf / len(result[0])) if len(result[0]) > 0 else 0.8
                        return cleaned, round(avg_conf, 2)
            except Exception as e:
                logger.error(f"OCR inference error: {e}")
        
        return "", 0.0

    async def process_frame(
        self,
        frame: np.ndarray,
        camera: Camera,
        db: AsyncSession,
        mock_plate: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Process a single CCTV frame: Detect Vehicle -> Crop Plate -> OCR -> Match Hotlist -> DB & Alert"""
        try:
            detected_plate = mock_plate
            confidence = 0.94
            vehicle_class = "Car"

            # Run real YOLO inference if frame is valid
            if frame is not None and self.yolo_model is not None and not mock_plate:
                results = self.yolo_model(frame, verbose=False, conf=settings.AI_CONFIDENCE_THRESHOLD)
                # Parse bounding boxes
                for r in results:
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        cls_name = self.yolo_model.names.get(cls_id, "Car")
                        if cls_name in ["car", "motorcycle", "bus", "truck"]:
                            vehicle_class = cls_name.capitalize()
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            crop = frame[y1:y2, x1:x2]
                            text, conf = self.extract_plate_text(crop)
                            if len(text) >= 6:
                                detected_plate = text
                                confidence = conf
                                break

            # Direct OCR fallback if image is a cropped plate or close-up photo
            if not detected_plate and frame is not None and not mock_plate:
                direct_text, direct_conf = self.extract_plate_text(frame)
                if len(direct_text) >= 4:
                    detected_plate = direct_text
                    confidence = direct_conf

            if not detected_plate:
                return None

            clean_plate = self.clean_plate_text(detected_plate)

            # 1. Save frame snapshot
            timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
            snapshot_filename = f"{clean_plate}_{camera.id}_{timestamp_str}.jpg"
            snapshot_rel_path = f"/snapshots/{snapshot_filename}"
            snapshot_full_path = os.path.join(settings.SNAPSHOT_STORAGE_PATH, snapshot_filename)
            
            if frame is not None:
                cv2.imwrite(snapshot_full_path, frame)
            else:
                # Generate dummy snapshot image if no physical stream
                dummy_img = np.zeros((300, 500, 3), dtype=np.uint8)
                cv2.putText(dummy_img, f"CAM: {camera.name}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                cv2.putText(dummy_img, f"PLATE: {clean_plate}", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                cv2.putText(dummy_img, f"TIME: {datetime.utcnow().strftime('%H:%M:%S')}", (20, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1)
                cv2.imwrite(snapshot_full_path, dummy_img)

            # 2. Check Watchlist Match
            wl_query = select(Watchlist).where(Watchlist.plate_number == clean_plate, Watchlist.is_active == True)
            wl_result = await db.execute(wl_query)
            watchlist_entry = wl_result.scalar_one_or_none()
            is_match = watchlist_entry is not None

            # 3. Log Detection in DB
            detection = Detection(
                camera_id=camera.id,
                plate_number=clean_plate,
                confidence=confidence,
                vehicle_class=vehicle_class,
                is_watchlist_match=is_match,
                watchlist_id=watchlist_entry.id if watchlist_entry else None,
                snapshot_url=snapshot_rel_path,
                latitude=camera.latitude,
                longitude=camera.longitude,
                detected_at=datetime.utcnow()
            )
            db.add(detection)
            await db.commit()
            await db.refresh(detection)

            detection_dict = {
                "id": detection.id,
                "camera_id": camera.id,
                "camera_name": camera.name,
                "location_name": camera.location_name,
                "latitude": camera.latitude,
                "longitude": camera.longitude,
                "plate_number": clean_plate,
                "confidence": confidence,
                "vehicle_class": vehicle_class,
                "snapshot_url": snapshot_rel_path,
                "is_watchlist_match": is_match,
                "detected_at": detection.detected_at.isoformat()
            }

            # 4. Broadcast live feed
            await ws_manager.broadcast_detection(detection_dict)

            # 5. Broadcast urgent alert if watchlist matched
            if is_match:
                alert_payload = {
                    **detection_dict,
                    "watchlist_id": watchlist_entry.id,
                    "crime_category": watchlist_entry.crime_category,
                    "fir_number": watchlist_entry.fir_number,
                    "priority": watchlist_entry.priority,
                    "owner_name": watchlist_entry.owner_name,
                    "police_station": watchlist_entry.police_station,
                    "notes": watchlist_entry.notes
                }
                logger.warning(f"🚨 WATCHLIST MATCH DETECTED: Plate {clean_plate} at {camera.name}!")
                await ws_manager.broadcast_alert(alert_payload)

            return detection_dict
        except Exception as e:
            logger.error(f"Error processing frame for camera {camera.id}: {e}")
            return None

anpr_engine = ANPREngine()
