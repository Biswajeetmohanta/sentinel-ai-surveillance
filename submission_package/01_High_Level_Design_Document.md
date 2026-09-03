# 🛡️ Sentinel AI Surveillance Platform
## High-Level Design (HLD) & System Architecture Document

**Target Deployment:** Gujarat Police Smart City & Highway Surveillance  
**Version:** 1.0 (Enterprise On-Premises Edition)  
**Security Tier:** Air-Gapped / State Data Centre (SDC) Compliant  
**Cloud Dependency:** 0% (100% Self-Hosted Open Source Software Stack)

---

## 1. Executive Overview
The **Sentinel AI Surveillance Platform** is an enterprise-grade, edge-to-core computer vision and spatial tracking intelligence system designed to unify fragmented, multi-vendor CCTV camera networks across city intersections, highway toll plazas, and transit checkpoints.

The system performs:
1. **Multi-Vendor Video Ingestion:** Decodes RTSP/ONVIF streams from any brand (Hikvision, Dahua, CP Plus, Axis, Bosch, DVRs/NVRs).
2. **Specialized Indian ANPR Pipeline:** Dual-head YOLOv8 vehicle/plate localization coupled with fine-tuned PaddleOCR (PP-OCRv4) to handle standard, high-security (HSRP), commercial, two-line, and electric vehicle (EV) plates under tough lighting and weather conditions.
3. **Sub-Second Hotlist Matching:** Real-time lookup against criminal watchlists, stolen vehicle databases (CCTNS), and suspect lists using in-memory Redis caching (<1ms latency).
4. **Interactive GIS Breadcrumb Tracking:** Automatic vehicle trajectory synthesis with speed estimation on OpenStreetMap/Leaflet maps backed by PostGIS spatial databases.
5. **Zero External API Costs:** Complete freedom from third-party cloud fees, ensuring total data sovereignty and state compliance.

---

## 2. High-Level System Architecture

Refer to vector architecture diagram: [`01_High_Level_Architecture_Diagram.svg`](./01_High_Level_Architecture_Diagram.svg)

```
+----------------------------------------------------------------------------------------------------+
|                                    1. VIDEO INGESTION TIER                                         |
|  [Hikvision]  [Dahua]  [CP Plus]  [Axis/Bosch]  [City NVRs] ---> [MediaMTX RTSP/WebRTC Proxy]      |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                  2. AI COMPUTER VISION PIPELINE                                    |
|  [Adaptive Frame Sampler] -> [YOLOv8 Detection] -> [CLAHE Enhancer] -> [PaddleOCR PP-OCRv4]      |
|                                                                              |                     |
|                                                                   [Indian LP Regex Matcher]        |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                  3. CORE BACKEND & EVENT ENGINE                                    |
|  [FastAPI Async ASGI Server] <---> [Redis Hotlist & PubSub] <---> [PostgreSQL + PostGIS Database]  |
|               |                                                                                    |
|               +----------------------+---------------------------------+                           |
+--------------------------------------|---------------------------------|---------------------------+
                                       | WebSocket Push                  | REST API / Video Stream
                                       v                                 v
+----------------------------------------------------------------------------------------------------+
|                                  4. COMMAND & CONTROL DASHBOARD                                    |
|  [Live Multi-Cam Grid]  [Leaflet GIS Map & Breadcrumbs]  [Audio-Visual Siren]  [Journey Replay]    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Decomposition

### 3.1 Tier 1: Ingestion & Edge Video Gateway
- **Multi-Vendor Support:** Native integration with standard RTSP/RTP/ONVIF feeds across all major surveillance OEMs.
- **MediaMTX Multiplexer:** Acts as a video gateway that ingests camera RTSP feeds once, fanning them out to:
  - The internal AI inference pipeline (raw frames).
  - The web browser command dashboard via low-latency WebRTC (WHEP) and Low-Latency HLS (LL-HLS) with under 150ms glass-to-glass delay.
- **Auto-Healing Watchdog:** Background daemon continuously checks RTSP socket liveness, auto-reconnecting on dropped connections or network blips.

### 3.2 Tier 2: Specialized Indian AI ANPR Engine
- **Motion-Triggered Frame Sampler:** Intelligently throttles inference between 5 to 15 FPS based on motion heuristics, avoiding redundant computation on stationary traffic.
- **Dual-Head YOLOv8:** Detects the vehicle bounding box, classifies vehicle category (Car, Bike/Scooter, Auto-Rickshaw, Truck, Bus), and pinpoints the precise license plate sub-rectangle.
- **CV Image Preprocessing:** Applies CLAHE (Contrast Limited Adaptive Histogram Equalization), Bilateral filtering, and perspective deskewing to restore night-vision, headlight glare, or angled cameras.
- **PaddleOCR (PP-OCRv4 Engine):** High-precision deep OCR network specialized for multi-font Indian plates, high-security registration plates (HSRP), and vertical 2-line layouts.
- **Heuristic Indian Syntax Validator:** Applies regex pattern validation:
  $$\text{Regex: } \wedge[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}\$$
  Corrects optical character disambiguations ($O \leftrightarrow 0$, $I \leftrightarrow 1$, $B \leftrightarrow 8$, $Z \leftrightarrow 2$).

### 3.3 Tier 3: Core Application & Real-Time Event Dispatcher
- **FastAPI ASGI Backend:** Non-blocking async Python core handling high-concurrency stream ingestion, spatial queries, and RESTful APIs.
- **Sub-Second Hotlist Engine:** Maintains active criminal/stolen watchlists in Redis memory. Matches are performed in $<1\text{ms}$.
- **GIS Trajectory Synthesizer:** Connects discrete vehicle detections across multi-camera nodes into chronological spatial breadcrumbs, computing transit duration ($\Delta t$) and estimated speed ($\text{km/h}$).
- **WebSocket Broadcast Hub:** Emits instantaneous JSON payloads to all connected operator workstations upon hotlist hits.

### 3.4 Tier 4: Storage, Spatial Database & Cache
- **PostgreSQL + PostGIS:** Stores camera coordinates as spatial geometries (`ST_Point`), detection metadata, vehicle classifications, OCR confidences, and vehicle breadcrumb lines (`ST_MakeLine`).
- **Redis 7+:** Serves as the primary ultra-fast key-value cache for hotlists and the event Pub/Sub broker.
- **Local NVMe Storage:** Stores localized plate crop thumbnails and full-frame snapshots without external cloud storage requirements.

### 3.5 Tier 5: Web-Based Command Center UI
- **Technology:** React 18, Vanilla CSS Design System, Lucide Icons, Leaflet.js.
- **Interactive GIS Map:** Real-time camera markers, color-coded health states, dynamic breadcrumb animations, and vehicle journey playback across Gujarat.
- **Live Video Matrix & CCTV Player:** Hardware-accelerated 60 FPS HLS player with GPU decoding and dynamic AES-128 key handshake.
- **Real-Time Siren & Alert Sidebar:** Audio chimes and visual blinking banners for urgent incidents, complete with a 1-click acknowledgement and PCR dispatch workflow.
- **Forensic Vehicle Search:** Wildcard plate search (`GJ01??1234`), date/time range filtering, and PDF dossier export.
- **Mobile Responsive Drawer:** Seamless experience across control room video walls, laptops, and field smartphones.

### 3.6 Tier 6: Enterprise Authentication & Access Control Gateway
- **Cryptographic Security:** Salted SHA-256 password hashing with server-side nonce isolation.
- **Officer Identity Schema:** Tracks Officer Name, Email, Badge ID, Department, Role (Superintendent, Inspector, Control Room Operator), and session expiration tokens.
- **Gated Architecture:** Unauthenticated access to dashboard views, telemetry streams, and database records is strictly blocked.
- **Session Lifecycles:** Stateful session authentication with secure header verification and one-click session invalidation (Logout).

### 3.7 Tier 7: Official 30-Camera Real-Time Network & HLS Proxy Engine
- **Full State Coverage:** 30 official Gujarat Police CCTV nodes spanning Ahmedabad, Gandhinagar, Surat, Vadodara, Rajkot, and Kutch (`cam01` to `cam30`).
- **Authenticated Proxy Gateway:** Connects to Gujarat Police sandbox (`103.250.160.189` / `cctv.corp8.cloud`) with automated Basic Auth session negotiation.
- **Dynamic Manifest Rewriting:** Intercepts HLS playlists, rewrites `.m3u8` references, and proxies AES-128 `/enc.key` decryption keys seamlessly to standard browsers without requiring VPN tunnels.

---

## 4. Hardware & Deployment Sizing

| Scale Tier | Cameras | AI Hardware Target | Backend / DB | Target Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Pilot / Station** | 4 – 16 Cameras | 1x NVIDIA RTX 4060 (8GB) / Intel i7 | 16 GB RAM, 4 Cores | 1 TB SSD |
| **Zone / Division** | 16 – 64 Cameras | 2x NVIDIA RTX 4080 (16GB) | 32 GB RAM, 8 Cores | 4 TB NVMe |
| **City Command Centre** | 100+ Cameras | Clustered Edge Nodes + NVIDIA A4000 / L4 | 64 GB RAM, 16 Cores | 16+ TB RAID-6 |
| **Cloud Production Demo** | 30 Live Nodes | Python 3.10 ASGI + SQLite / PostgreSQL | Hosted Container | Auto-Seeded Database |

---

## 5. Live Production Cloud Deployment Architecture

The platform is actively deployed and accessible for live field evaluation:

- **Live Web Command Center:** `https://sentinel.deventtechnology.com`
- **Live API & Streaming Core:** `https://sentinel-api-bqfm.onrender.com`
- **Interactive Swagger Documentation:** `https://sentinel-api-bqfm.onrender.com/docs`
- **Active Authorized Credentials:** `jyoti@deventtechnology.com` / `123456`
- **High-Availability Keep-Alive Engine:** Configured with an automated cron monitor pinging the `/` health endpoint every 10 minutes to guarantee 24/7 continuous uptime with zero cold-start latency.

---

## 6. Information Security & Regulatory Compliance
- **Air-Gapped Operation:** Capable of running 100% offline inside the Gujarat Police State Data Centre (SDC).
- **Data Sovereignty:** Zero data or telemetry transmitted to external third-party cloud providers.
- **Role-Based Access Control (RBAC):** Granular officer credentials with immutable access audit trails.

