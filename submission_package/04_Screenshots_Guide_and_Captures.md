# 📸 Sentinel AI Surveillance Platform
## Submission Screenshots Guide & Visual Proof Catalog

This document details the complete checklist of screenshots required for client submission, including instructions on how to capture them from your running platform and the exact narrative to include in the submission folder.

---

## 📂 Screenshot Checklist & Descriptions

Create a folder in Google Drive named: **`Sentinel_AI_Surveillance_Screenshots`** containing the following 8 high-resolution screenshots:

| # | Filename | Screen / Feature | Key Highlight Elements to Show |
| :--- | :--- | :--- | :--- |
| **01** | `01_Main_Command_Dashboard.png` | **Main Overview Dashboard** | Top KPI stats cards (Active Cameras, Total Detections, Active Watchlists, Critical Alerts), Leaflet GIS map with color-coded camera pins, and live alert feed sidebar. |
| **02** | `02_Interactive_GIS_Map.png` | **GIS Map & Live Tracking** | High-resolution satellite / dark-mode Leaflet map showing Ahmedabad city road network, green/red camera pins, active alert radar pulse, and junction clusters. |
| **03** | `03_Multi_Camera_Live_Grid.png` | **Live Video Matrix** | 4-channel or 9-channel camera grid showing simultaneous feeds (e.g. SG Highway, Ashram Road, Ring Road) with live bounding boxes overlaying vehicles. |
| **04** | `04_RealTime_Hotlist_Alert.png` | **Instant Watchlist Alert** | Red flashing audio-visual alert pop-up on the right sidebar showing "CRITICAL - Stolen Vehicle Match", vehicle number (`GJ01AB1234`), FIR details, crop thumbnail, and 1-click Acknowledge button. |
| **05** | `05_GIS_Vehicle_Breadcrumb_Replay.png` | **Vehicle Trajectory Replay** | Trajectory reconstruction view for a searched vehicle with numbered breadcrumb pins (1, 2, 3, 4) connected by directional polyline arrows on the GIS map, with speed calculations. |
| **06** | `06_Vehicle_Forensic_Search.png` | **Vehicle Search & Timeline** | Search interface filtering by plate number, date/time range, and camera location, displaying chronological detection cards with high-res license plate crops and confidence scores. |
| **07** | `07_Watchlist_Manager.png` | **Watchlist & Hotlist Hub** | Hotlist management interface with categories (Stolen, Wanted, Revoked), CSV import button, priority tags, and active count. |
| **08** | `08_Camera_Manager_and_Health.png` | **Camera Setup & Health** | Camera management page showing RTSP URLs, ONVIF status, GPS coordinates, frame rate (FPS), and online/offline status indicators. |

---

## 🛠️ Step-by-Step Instructions to Capture

1. **Start the Platform:**
   ```bash
   # Terminal 1: Backend
   cd backend
   .\venv\Scripts\activate
   python run.py

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```
2. Open browser at `http://localhost:5173`.
3. Press `F11` (or use Fullscreen mode in browser) for clean edge-to-edge visuals.
4. Use Windows Snipping Tool (`Win + Shift + S`) or browser developer tools screenshot feature to capture full-screen 1080p/4K PNGs.
5. Save all images in a folder, upload to Google Drive, set sharing to **"Anyone with the link can view"**, and paste the link into the form.
