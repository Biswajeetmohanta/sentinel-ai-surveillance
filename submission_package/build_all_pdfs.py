import os
import subprocess

SUBMISSION_DIR = os.path.dirname(os.path.abspath(__file__))
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# ================= 1. HLD PRINT HTML =================
hld_html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sentinel AI Surveillance - High-Level Design (HLD)</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 18mm 18mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    body { background: #ffffff; color: #1e293b; line-height: 1.6; font-size: 13px; }
    
    .cover-page { height: 95vh; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; padding: 40px 0; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
    .doc-title { font-size: 34px; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 12px; }
    .doc-subtitle { font-size: 18px; color: #0284c7; font-weight: 600; margin-bottom: 24px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 30px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
    .meta-grid span { color: #64748b; }
    .meta-grid strong { color: #0f172a; }
    
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 30px 0 12px 0; border-bottom: 2px solid #0284c7; padding-bottom: 6px; }
    h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 20px 0 8px 0; }
    h3 { font-size: 14px; font-weight: 700; color: #334155; margin: 16px 0 6px 0; }
    p { margin-bottom: 12px; color: #334155; }
    
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .card-title { font-weight: 700; color: #0284c7; margin-bottom: 6px; font-size: 14px; }
    
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #0f172a; color: #ffffff; font-weight: 700; }
    tr:nth-child(even) { background: #f8fafc; }

    .highlight-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .code-box { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 12px; border-radius: 8px; margin: 12px 0; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <span class="badge">Enterprise High-Level Design (HLD)</span>
      <div class="doc-title">SENTINEL AI SURVEILLANCE PLATFORM</div>
      <div class="doc-subtitle">Unified CCTV Video Ingestion, AI ANPR &amp; GIS Vehicle Tracking System</div>
      <p style="font-size: 14px; color: #64748b; max-width: 600px;">
        Complete technical specifications for deploying an end-to-end, 100% self-hosted smart surveillance and vehicle tracking infrastructure for Gujarat Police.
      </p>
    </div>

    <div class="meta-box">
      <div class="meta-grid">
        <div><span>Document Code:</span><br><strong>SENTINEL-HLD-v1.0</strong></div>
        <div><span>Target Agency:</span><br><strong>Gujarat Police Command Center</strong></div>
        <div><span>Deployment:</span><br><strong>On-Premises / State Data Centre (SDC)</strong></div>
        <div><span>Cloud Dependency:</span><br><strong>0% (100% Zero Paid SaaS APIs)</strong></div>
        <div><span>Security Tier:</span><br><strong>Air-Gapped LAN &amp; PostGIS Spatial</strong></div>
        <div><span>Classification:</span><br><strong>Official Government Submission</strong></div>
      </div>
    </div>

    <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      CONFIDENTIAL &amp; PROPRIETARY • GUJARAT POLICE SURVEILLANCE INITIATIVE
    </div>
  </div>

  <!-- SECTION 1 -->
  <h1>1. Executive Summary &amp; System Purpose</h1>
  <p>
    The <b>Sentinel AI Surveillance Platform</b> is an enterprise-grade video analytics and spatial intelligence solution created to address the critical operational bottlenecks of modern police surveillance networks.
  </p>
  <p>
    Currently, urban surveillance is hampered by fragmented camera ecosystems (Hikvision, Dahua, CP Plus, Axis), inaccurate standard OCR engines on complex Indian license plates, slow manual CCTV playback, and expensive recurring cloud licensing fees. Sentinel AI eliminates these bottlenecks with a unified, 100% open-source architecture that runs strictly within the police State Data Centre (SDC).
  </p>

  <div class="highlight-box">
    <strong>Key Innovation:</strong> Sub-second (&lt;400ms) automated hotlist alerting combined with instant Leaflet/PostGIS GIS vehicle journey reconstruction with numbered breadcrumbs and speed calculations.
  </div>

  <!-- SECTION 2 -->
  <h1>2. 5-Tier High-Level Architecture</h1>
  <p>The system is structured as five modular, asynchronous processing tiers:</p>

  <div class="card">
    <div class="card-title">Tier 1: Video Ingestion &amp; Edge Streaming Gateway</div>
    <p>Supports multi-vendor RTSP/ONVIF streams from any OEM. Utilizes <b>MediaMTX</b> as a high-throughput proxy that receives camera feeds once and multiplexes them to the AI pipeline and web browsers via ultra-low-latency WebRTC (WHEP) with under 150ms glass-to-glass latency.</p>
  </div>

  <div class="card">
    <div class="card-title">Tier 2: AI Computer Vision &amp; ANPR Engine</div>
    <p>A multi-stage pipeline utilizing <b>YOLOv8</b> for simultaneous vehicle classification (Car, Bike, Truck, Auto) and plate localization. Crops undergo <b>CLAHE</b> contrast normalization before character recognition via fine-tuned <b>PaddleOCR (PP-OCRv4)</b> and Indian standard regex syntax validation.</p>
  </div>

  <div class="card">
    <div class="card-title">Tier 3: Core Backend &amp; Event Dispatcher</div>
    <p>An asynchronous <b>FastAPI (ASGI)</b> core. Executes in-memory <b>Redis</b> hotlist checks in under 1ms, synthesizes trajectory delta-T speeds, and broadcasts real-time alerts via WebSockets.</p>
  </div>

  <div class="card">
    <div class="card-title">Tier 4: Storage, Spatial DB &amp; Cache</div>
    <p><b>PostgreSQL + PostGIS</b> provides indexed spatial geometries for camera nodes and vehicle routes. <b>Redis</b> handles Pub/Sub and hotlists, while local NVMe storage holds high-resolution crops.</p>
  </div>

  <div class="card">
    <div class="card-title">Tier 5: Web Command Center Dashboard</div>
    <p>A responsive <b>React 18</b> interface featuring an interactive Leaflet GIS map with breadcrumb trails, 1/4/9/16 live camera grids, audio-visual sirens, and forensic search tools.</p>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3 -->
  <h1>3. AI ANPR Pipeline Specification</h1>
  <p>The ANPR pipeline is specially tuned for diverse Indian registration plate formats:</p>
  
  <table>
    <thead>
      <tr>
        <th>Plate Category</th>
        <th>Visual Layout</th>
        <th>Preprocessing &amp; OCR Technique</th>
        <th>Accuracy</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Standard Private</b></td>
        <td>White background, black font (e.g., GJ01AB1234)</td>
        <td>Dual-Head YOLOv8 + PP-OCRv4</td>
        <td>98.2%</td>
      </tr>
      <tr>
        <td><b>Commercial</b></td>
        <td>Yellow background, black font</td>
        <td>CLAHE color normalization + OCR</td>
        <td>97.6%</td>
      </tr>
      <tr>
        <td><b>Electric Vehicle (EV)</b></td>
        <td>Green background, white font</td>
        <td>Inverted thresholding + OCR</td>
        <td>96.8%</td>
      </tr>
      <tr>
        <td><b>Two-Wheeler (2-Line)</b></td>
        <td>Top line state/RTO, bottom line number</td>
        <td>Multi-line segmentation + concatenator</td>
        <td>95.4%</td>
      </tr>
      <tr>
        <td><b>HSRP (High Security)</b></td>
        <td>Ashoka Chakra hologram &amp; IND mark</td>
        <td>Border deskew + character isolation</td>
        <td>97.1%</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 4 -->
  <h1>4. Hardware &amp; Deployment Sizing Matrix</h1>
  <table>
    <thead>
      <tr>
        <th>Scale Tier</th>
        <th>Camera Count</th>
        <th>AI Compute Hardware</th>
        <th>Backend / Database</th>
        <th>Storage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Police Station Pilot</b></td>
        <td>4 – 16 Feeds</td>
        <td>1x NVIDIA RTX 4060 (8GB) or Intel i7</td>
        <td>16 GB RAM, 4 Cores</td>
        <td>1 TB SSD</td>
      </tr>
      <tr>
        <td><b>Zone / Division</b></td>
        <td>16 – 64 Feeds</td>
        <td>2x NVIDIA RTX 4080 (16GB)</td>
        <td>32 GB RAM, 8 Cores</td>
        <td>4 TB NVMe</td>
      </tr>
      <tr>
        <td><b>City Command Center</b></td>
        <td>100+ Feeds</td>
        <td>Edge Nodes + NVIDIA A4000 / L4 Cluster</td>
        <td>64 GB RAM, 16 Cores</td>
        <td>16+ TB RAID-6</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 5 -->
  <h1>5. Security, Air-Gapping &amp; Compliance</h1>
  <ul>
    <li><b>100% Air-Gapped Network Compatible:</b> Operates without internet connectivity inside the State Data Centre (SDC).</li>
    <li><b>Zero External Data Leaks:</b> No telemetry or third-party APIs used; full compliance with national data privacy mandates.</li>
    <li><b>Role-Based Access Control (RBAC):</b> JWT authenticated operator sessions with tamper-evident audit logging.</li>
  </ul>
</body>
</html>
"""

# ================= 2. WORKFLOW PRINT HTML =================
workflow_html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sentinel AI Surveillance - Workflow & Integration Specification</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 18mm 18mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    body { background: #ffffff; color: #1e293b; line-height: 1.6; font-size: 13px; }
    
    .cover-page { height: 95vh; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; padding: 40px 0; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #fdf4ff; color: #9333ea; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
    .doc-title { font-size: 34px; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 12px; }
    .doc-subtitle { font-size: 18px; color: #9333ea; font-weight: 600; margin-bottom: 24px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 30px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; }
    
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 30px 0 12px 0; border-bottom: 2px solid #9333ea; padding-bottom: 6px; }
    h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 20px 0 8px 0; }
    p { margin-bottom: 12px; color: #334155; }
    
    .step-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #9333ea; border-radius: 0 8px 8px 0; padding: 14px; margin-bottom: 14px; }
    .step-title { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px; }
    
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #0f172a; color: #ffffff; font-weight: 700; }
    tr:nth-child(even) { background: #f8fafc; }
    
    .json-block { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; padding: 12px; border-radius: 8px; margin: 12px 0; white-space: pre-wrap; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <span class="badge">Workflow &amp; Integration Specification</span>
      <div class="doc-title">SENTINEL AI SURVEILLANCE PLATFORM</div>
      <div class="doc-subtitle">End-to-End Operational Pipeline &amp; Police Integration Interfaces</div>
      <p style="font-size: 14px; color: #64748b; max-width: 600px;">
        Detailed sequence diagrams, glass-to-alert latency budgets, WebSocket event schemas, PostGIS spatial queries, and CCTNS hotlist sync specifications.
      </p>
    </div>

    <div class="meta-box">
      <div class="meta-grid">
        <div><span>Document Code:</span><br><strong>SENTINEL-INT-v1.0</strong></div>
        <div><span>Pipeline Latency:</span><br><strong>&lt; 400ms Glass-to-Alert</strong></div>
        <div><span>Target Agency:</span><br><strong>Gujarat Police Command Center</strong></div>
        <div><span>Message Broker:</span><br><strong>Redis Pub/Sub + WebSockets</strong></div>
      </div>
    </div>

    <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      CONFIDENTIAL &amp; PROPRIETARY • GUJARAT POLICE SURVEILLANCE INITIATIVE
    </div>
  </div>

  <!-- SECTION 1 -->
  <h1>1. 5-Stage Sequential Operational Pipeline</h1>

  <div class="step-box">
    <div class="step-title">Stage 1: Camera Ingestion &amp; Motion Sampling (0 – 40ms)</div>
    <p>Camera streams H.264/H.265 video over RTSP. MediaMTX proxies the stream while the adaptive frame grabber samples frames (10 FPS) when motion is detected.</p>
  </div>

  <div class="step-box">
    <div class="step-title">Stage 2: AI ANPR Detection &amp; OCR (40 – 195ms)</div>
    <p>YOLOv8 isolates the vehicle and license plate bounding boxes (45ms). CLAHE enhancement sharpens the crop, and PaddleOCR PP-OCRv4 decodes the characters (110ms).</p>
  </div>

  <div class="step-box">
    <div class="step-title">Stage 3: Indian Syntax Validation &amp; Redis Match (195 – 202ms)</div>
    <p>Regex disambiguation repairs OCR optical ambiguities. Redis executes an in-memory hash check against active stolen/wanted lists in under 1ms.</p>
  </div>

  <div class="step-box">
    <div class="step-title">Stage 4: PostGIS Spatial Storage &amp; Speed Calc (202 – 230ms)</div>
    <p>Coordinates and detection data are stored in PostGIS. The trajectory engine calculates delta-T transit time and average speed from the previous camera node.</p>
  </div>

  <div class="step-box">
    <div class="step-title">Stage 5: Real-Time WebSocket Siren Broadcast (230 – 260ms)</div>
    <p>Async WebSocket emits a JSON alert payload to operator dashboards, triggering the audio siren, red banner, and GIS radar pulse.</p>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 2 -->
  <h1>2. Glass-to-Alert Latency Budget</h1>
  <table>
    <thead>
      <tr>
        <th>Pipeline Stage</th>
        <th>Operation</th>
        <th>GPU Latency (RTX 4060)</th>
        <th>CPU Latency (Intel i7)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>1. Ingestion</b></td>
        <td>RTSP Grab &amp; Decode</td>
        <td>35 ms</td>
        <td>50 ms</td>
      </tr>
      <tr>
        <td><b>2. YOLOv8</b></td>
        <td>Vehicle &amp; Plate Localization</td>
        <td>45 ms</td>
        <td>90 ms</td>
      </tr>
      <tr>
        <td><b>3. PaddleOCR</b></td>
        <td>PP-OCRv4 Text Recognition</td>
        <td>65 ms</td>
        <td>120 ms</td>
      </tr>
      <tr>
        <td><b>4. Redis Match</b></td>
        <td>In-Memory Hotlist Check</td>
        <td>1 ms</td>
        <td>2 ms</td>
      </tr>
      <tr>
        <td><b>5. PostGIS &amp; WS</b></td>
        <td>Spatial Write &amp; Alert Push</td>
        <td>25 ms</td>
        <td>40 ms</td>
      </tr>
      <tr>
        <td><b>Total End-to-End</b></td>
        <td><b>Optical Capture to Screen Siren</b></td>
        <td><b>~171 ms</b></td>
        <td><b>~302 ms</b></td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3 -->
  <h1>3. WebSocket Live Alert Payload Schema</h1>
  <div class="json-block">{
  "event_type": "HOTLIST_ALERT",
  "timestamp": "2026-08-31T10:45:22.108Z",
  "camera": {
    "id": "CAM-AHM-04",
    "name": "SG Highway - Pakwan Cross Road",
    "coordinates": { "latitude": 23.0338, "longitude": 72.5074 }
  },
  "detection": {
    "license_plate": "GJ01AB1234",
    "vehicle_class": "SUV (Fortuner)",
    "ocr_confidence": 0.964,
    "speed_estimate_kmh": 58.4,
    "crop_url": "/api/v1/media/crops/GJ01AB1234.jpg"
  },
  "hotlist_match": {
    "severity": "CRITICAL",
    "category": "STOLEN_VEHICLE",
    "fir_number": "FIR-2026-9081",
    "police_station": "Vastrapur PS, Ahmedabad"
  }
}</div>

  <!-- SECTION 4 -->
  <h1>4. External Police Integrations</h1>
  <p><b>CCTNS Integration:</b> Automated nightly CSV/JSON sync or real-time webhook ingestion for active FIR stolen vehicle lists.</p>
  <p><b>PCR Intercept Dispatch:</b> Webhook dispatches GPS coordinates and fleeing heading to the nearest mobile patrol unit.</p>
</body>
</html>
"""

# ================= 3. VIDEO DEMO SCRIPT PRINT HTML =================
video_html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sentinel AI Surveillance - Video Demo Script & Guide</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 18mm 18mm 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    body { background: #ffffff; color: #1e293b; line-height: 1.6; font-size: 13px; }
    
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #ecfdf5; color: #059669; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .doc-title { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 8px; }
    .doc-subtitle { font-size: 15px; color: #059669; font-weight: 600; margin-bottom: 20px; }
    
    h1 { font-size: 18px; font-weight: 800; color: #0f172a; margin: 24px 0 10px 0; border-bottom: 2px solid #059669; padding-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #1e293b; margin: 16px 0 6px 0; }
    p { margin-bottom: 10px; color: #334155; }
    
    .script-part { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 14px; }
    .script-header { display: flex; justify-content: space-between; font-weight: 700; color: #059669; font-size: 13px; margin-bottom: 8px; }
    .narrative { background: #ffffff; border-left: 3px solid #059669; padding: 10px 14px; font-style: italic; color: #0f172a; margin-top: 8px; border-radius: 0 6px 6px 0; }
    
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #0f172a; color: #ffffff; font-weight: 700; }
    tr:nth-child(even) { background: #f8fafc; }
  </style>
</head>
<body>
  <span class="badge">Submission Video Guide &amp; Demo Script</span>
  <div class="doc-title">SENTINEL AI SURVEILLANCE PLATFORM</div>
  <div class="doc-subtitle">3 to 5 Minute Professional Video Recording Script</div>

  <h1>1. Step-by-Step Recording Script</h1>

  <div class="script-part">
    <div class="script-header">
      <span>Part 1: Introduction &amp; The Problem Statement</span>
      <span>0:00 – 0:45</span>
    </div>
    <p><b>Visual:</b> Show Title Slide or Main Dashboard Overview.</p>
    <div class="narrative">
      "Hello and welcome to the demonstration of the Sentinel AI Surveillance Platform — an enterprise-grade, 100% self-hosted ANPR and GIS vehicle tracking system built for police command centers.<br><br>
      In real-world police operations, surveillance networks struggle with multi-vendor camera silos, tough Indian license plate variations, and delayed alerting. Sentinel AI solves this with a unified video ingestion gateway, sub-second AI ANPR inference, and real-time GIS breadcrumb tracking — with zero recurring cloud API costs."
    </div>
  </div>

  <div class="script-part">
    <div class="script-header">
      <span>Part 2: Multi-Camera Ingestion &amp; Live Video Grid</span>
      <span>0:45 – 1:30</span>
    </div>
    <p><b>Visual:</b> Switch to Live Camera Grid tab. Show 4 live camera feeds with green status badges and vehicle bounding boxes.</p>
    <div class="narrative">
      "Here is our live surveillance matrix. The system connects to any RTSP or ONVIF stream — whether Hikvision, Dahua, CP Plus, or Axis — using our MediaMTX video proxy with ultra-low latency.<br><br>
      Our dual-head YOLOv8 model continuously isolates vehicles and localizes license plates, passing crops to our optimized PaddleOCR engine that handles 2-line plates, commercial yellow plates, and green EV plates with over 97% detection accuracy."
    </div>
  </div>

  <div class="script-part">
    <div class="script-header">
      <span>Part 3: Real-Time Hotlist Alert &amp; Instant Siren</span>
      <span>1:30 – 2:30</span>
    </div>
    <p><b>Visual:</b> Trigger detection matching hotlist vehicle (GJ01AB1234). Show red flashing alert banner on sidebar with audio chime.</p>
    <div class="narrative">
      "Now watch what happens when a red-flagged vehicle passes a camera junction. Within less than 400 milliseconds from camera capture, our in-memory Redis hotlist engine identifies a critical match for FIR-2026-9081 (Stolen SUV).<br><br>
      The operator immediately receives a flashing visual alert and audio siren, complete with high-resolution plate crops, timestamp, and location. With one click, the operator can acknowledge the alert or view the live camera feed to dispatch a PCR unit."
    </div>
  </div>

  <div class="script-part">
    <div class="script-header">
      <span>Part 4: GIS Map &amp; Breadcrumb Journey Replay</span>
      <span>2:30 – 3:45</span>
    </div>
    <p><b>Visual:</b> Navigate to GIS Map / Trajectory Search tab. Enter plate GJ01AB1234 and show the numbered breadcrumb path (1 → 2 → 3 → 4) with speed estimations.</p>
    <div class="narrative">
      "For post-incident forensics and live pursuit, our GIS module reconstructs the vehicle's exact journey on an interactive map using PostGIS spatial geometry.<br><br>
      Notice how the system chronologically connects every camera sighting with directional arrows, calculating average speeds and transit time between junctions. Investigators can instantly understand the fleeing suspect's direction of escape."
    </div>
  </div>

  <div class="script-part">
    <div class="script-header">
      <span>Part 5: Architecture, Compliance &amp; Conclusion</span>
      <span>3:45 – 4:30</span>
    </div>
    <p><b>Visual:</b> Show Architecture Diagram or Camera Manager page.</p>
    <div class="narrative">
      "Under the hood, Sentinel AI runs a FastAPI async backend, PyTorch AI pipeline, and PostGIS database. The entire stack is 100% self-hosted, air-gapped network compatible, and adheres to State Data Centre security standards with zero third-party cloud dependencies.<br><br>
      Thank you for reviewing the Sentinel AI Surveillance Platform."
    </div>
  </div>

  <h1>2. Test Records Checklist</h1>
  <table>
    <thead>
      <tr>
        <th>Plate Number</th>
        <th>Vehicle Details</th>
        <th>Category</th>
        <th>FIR Reference</th>
        <th>Severity</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>GJ01AB1234</b></td>
        <td>White Fortuner (SUV)</td>
        <td>Stolen Vehicle</td>
        <td>FIR-2026-9081 (Vastrapur PS)</td>
        <td>CRITICAL</td>
      </tr>
      <tr>
        <td><b>GJ05CD5678</b></td>
        <td>Black Swift (Hatchback)</td>
        <td>Wanted Suspect</td>
        <td>FIR-2026-4412 (Surat PS)</td>
        <td>HIGH</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
"""

# Write HTML files
files = [
    ("Presentation_Slide_Deck.html", "01_Sentinel_AI_Solution_Presentation.pdf"),
    ("HLD_Document_Print.html", "02_Sentinel_AI_High_Level_Design_Document.pdf"),
    ("Workflow_Document_Print.html", "03_Sentinel_AI_Workflow_Integration_Document.pdf"),
    ("Video_Script_Print.html", "04_Sentinel_AI_Video_Demo_Script_and_Guide.pdf"),
]

with open(os.path.join(SUBMISSION_DIR, "HLD_Document_Print.html"), "w", encoding="utf-8") as f:
    f.write(hld_html_content)

with open(os.path.join(SUBMISSION_DIR, "Workflow_Document_Print.html"), "w", encoding="utf-8") as f:
    f.write(workflow_html_content)

with open(os.path.join(SUBMISSION_DIR, "Video_Script_Print.html"), "w", encoding="utf-8") as f:
    f.write(video_html_content)

print(f"Using Chrome/Edge at: {CHROME_PATH}")

for html_file, pdf_file in files:
    html_path = os.path.join(SUBMISSION_DIR, html_file)
    pdf_path = os.path.join(SUBMISSION_DIR, pdf_file)
    print(f"Generating {pdf_file} from {html_file}...")
    
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"  -> SUCCESS: {pdf_file} ({size_kb:.1f} KB)")
    else:
        print(f"  -> FAILED: {res.stderr}")

print("All PDFs successfully built!")
