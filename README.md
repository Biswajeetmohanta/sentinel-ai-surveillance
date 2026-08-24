# 🛡️ Sentinel AI Surveillance Platform
### Unified CCTV Video Ingestion, ANPR & GIS Vehicle Tracking System for Gujarat Police

An end-to-end, 100% self-hosted, enterprise-grade AI surveillance system built to unify fragmented multi-vendor CCTV cameras, detect Indian vehicle number plates in real-time, alert on watchlists, and reconstruct vehicle trajectories on an interactive GIS map.

---

## 🌟 Key Features
- **Multi-Vendor Camera Ingestion:** Supports RTSP/ONVIF streams from Hikvision, Dahua, CP Plus, Axis, Bosch, and custom DVRs/NVRs.
- **AI ANPR Pipeline:** YOLOv8 vehicle & plate detection + PaddleOCR (PP-OCRv4) optimized for Indian license plate formats (standard, high security, 2-line, commercial, EV).
- **Sub-Second Hotlist Matching:** Real-time lookup with Redis caching and instant WebSocket alert broadcasts to command center operators.
- **Interactive GIS Map & Route Tracking:** Leaflet + OpenStreetMap integration with PostGIS spatial queries, historical breadcrumb path reconstruction, and speed estimation.
- **Zero Paid APIs / Zero Cloud Dependency:** 100% open-source software stack with no external cloud API costs.
- **Git & GitHub CI/CD Ready:** Automated testing, linting, and build workflows with GitHub Actions.

---

## 🏗️ Architecture Stack
- **Frontend:** React.js, Leaflet GIS Map, TailwindCSS, Lucide Icons, WebSockets
- **Backend:** Python FastAPI (Async), PyTorch, OpenCV, PaddleOCR, YOLOv8, Uvicorn
- **Database & Cache:** PostgreSQL + PostGIS (Spatial), Redis (Hotlist Cache & Message Broker)
- **Video Gateway:** MediaMTX (RTSP to WebRTC/HLS Aggregator)
- **Deployment:** GitHub Actions CI/CD, Python venv, Systemd/Windows Services

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python run.py
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard available at: `http://localhost:5173`

### 3. MediaMTX Streaming Server
Download the latest binary from [MediaMTX Releases](https://github.com/bluenviron/mediamtx/releases) and place it in the `streaming/` folder, then run:
```bash
cd streaming
./mediamtx
```

---

## 🔒 Security & On-Premise Compliance
- Air-gapped network compatible
- Role-based authorization & encrypted WebSocket transport
- Compliant with State Data Centre (SDC) hosting standards
