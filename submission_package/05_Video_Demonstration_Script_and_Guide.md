# 🎥 Sentinel AI Surveillance Platform
## Video Demonstration Script & Client Submission Guide

This document provides a **step-by-step recording script (3–5 minutes)** and test data checklist to record an impressive, professional video demonstration for your project submission.

---

## ⏱️ Video Breakdown & Demo Script (3 to 5 Minutes)

### **Part 1: Introduction & Problem Context (0:00 – 0:45)**
- **Visual:** Show Title Slide from `Sentinel_AI_Solution_Presentation.pptx` or the main Dashboard.
- **Narrative:**
  > *"Hello and welcome to the demonstration of the Sentinel AI Surveillance Platform — an enterprise-grade, 100% self-hosted ANPR and GIS vehicle tracking system built for police command centers and smart city surveillance.*
  >
  > *In real-world police operations, surveillance networks struggle with multi-vendor camera silos, tough Indian license plate variations, and delayed alerting. Sentinel AI solves this with a unified video ingestion gateway, sub-second AI ANPR inference, and real-time GIS breadcrumb tracking — with zero recurring cloud API costs."*

---

### **Part 2: Multi-Camera Ingestion & Live Video Matrix (0:45 – 1:30)**
- **Visual:** Switch to the **Live Camera Grid** tab on `http://localhost:5173`. Show 4 live camera feeds with green status indicators and bounding boxes detecting passing vehicles.
- **Narrative:**
  > *"Here is our live surveillance matrix. The system connects to any RTSP or ONVIF stream — whether Hikvision, Dahua, CP Plus, or Axis — using our MediaMTX video proxy with ultra-low latency.*
  >
  > *Our dual-head YOLOv8 model continuously isolates vehicles and localizes license plates, passing crops to our optimized PaddleOCR engine that handles 2-line plates, commercial yellow plates, and green EV plates with over 97% detection accuracy."*

---

### **Part 3: Real-Time Hotlist Alert & Instant Siren (1:30 – 2:30)**
- **Visual:** Trigger a test vehicle detection matching a hotlist vehicle (e.g. `GJ01AB1234` or `GJ05CD5678`).
- **Action:** Show the **red flashing alert pop up on the right sidebar** with an audio chime, FIR details, and camera location.
- **Narrative:**
  > *"Now watch what happens when a red-flagged vehicle passes a camera junction. Within less than 400 milliseconds from camera capture, our in-memory Redis hotlist engine identifies a critical match for FIR-2026-9081 (Stolen SUV).*
  >
  > *The operator immediately receives a flashing visual alert and audio siren, complete with high-resolution plate crops, timestamp, and location. With one click, the operator can acknowledge the alert or view the live camera feed to dispatch a PCR unit."*

---

### **Part 4: GIS Map & Vehicle Trajectory Replay (2:30 – 3:45)**
- **Visual:** Navigate to the **GIS Map / Trajectory Search** tab. Enter the license plate number `GJ01AB1234` and hit "Search".
- **Action:** Show the map zoom into the path, drawing the **numbered breadcrumb trail (1 → 2 → 3 → 4)** with speed estimations along the corridor.
- **Narrative:**
  > *"For post-incident forensics and live pursuit, our GIS module reconstructs the vehicle's exact journey on an interactive map using PostGIS spatial geometry.*
  >
  > *Notice how the system chronologically connects every camera sighting with directional arrows, calculating average speeds and transit time between junctions. Investigators can instantly understand the fleeing suspect's direction of escape."*

---

### **Part 5: Architecture, Compliance & Conclusion (3:45 – 4:30)**
- **Visual:** Switch to the **Architecture Diagram** or **Camera Manager** page.
- **Narrative:**
  > *"Under the hood, Sentinel AI runs a FastAPI async backend, PyTorch AI pipeline, and PostGIS database. The entire stack is 100% self-hosted, air-gapped network compatible, and adheres to State Data Centre security standards with zero third-party cloud dependencies.*
  >
  > *Thank you for reviewing the Sentinel AI Surveillance Platform."*

---

## 📋 Recommended Test Data to Showcase

| Field | Test Record 1 (Stolen Vehicle) | Test Record 2 (Wanted Suspect) |
| :--- | :--- | :--- |
| **Plate Number** | `GJ01AB1234` | `GJ05CD5678` |
| **Vehicle Type** | White Fortuner (SUV) | Black Swift (Hatchback) |
| **Category** | Stolen Vehicle | Wanted Suspect |
| **FIR Number** | `FIR-2026-9081` | `FIR-2026-4412` |
| **Police Station** | Vastrapur Police Station | Umra Police Station, Surat |
| **Severity** | CRITICAL | HIGH |
| **Corridor Points** | Iskcon → Sindhu Bhavan → SG Highway | Ring Road → Majura Gate → Athwa |

---

## 🎬 Recording Software Tips
- **Tools:** OBS Studio (free) or Windows Game Bar (`Win + G`).
- **Resolution:** 1080p (1920x1080) at 30 or 60 FPS.
- **Upload:** Upload the MP4 video to **Google Drive**, set sharing permissions to **"Anyone with the link can view"**, and paste the URL into the Google Form.
