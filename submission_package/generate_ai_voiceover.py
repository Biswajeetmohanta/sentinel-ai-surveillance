import asyncio
import os
import edge_tts

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
AUDIO_DIR = os.path.join(SUBMISSION_DIR, "audio_narration")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Using a natural, authoritative, crystal-clear professional voice
VOICE = "en-US-ChristopherNeural"  # Professional Executive Deep Male Voice
# Alternative: "en-US-JennyNeural", "en-IN-PrabhatNeural"

SCRIPTS = {
    "Slide_1_Intro": (
        "Welcome to the official demonstration of the Sentinel AI Surveillance Platform — "
        "an enterprise-grade, 100 percent self-hosted video analytics and GIS vehicle tracking system "
        "built specifically for Gujarat Police and smart city command centers. "
        "Sentinel AI unifies multi-vendor CCTV cameras, detects Indian license plates with sub-second latency, "
        "and reconstructs vehicle escape routes with zero external cloud dependencies or API costs."
    ),
    "Slide_2_Challenge": (
        "Modern urban surveillance faces three major challenges. "
        "First, camera networks are fragmented across Hikvision, Dahua, CP Plus, and Axis with isolated proprietary software. "
        "Second, foreign OCR engines fail heavily on Indian license plates due to 2-line layouts, regional fonts, yellow commercial plates, and night glare. "
        "Third, delayed alerting allows wanted criminals and stolen vehicles to flee past checkpoints unnoticed, "
        "while commercial cloud platforms charge exorbitant recurring licensing fees."
    ),
    "Slide_3_Architecture": (
        "Sentinel AI solves this through a modular five-tier architecture. "
        "Tier one utilizes MediaMTX as an edge streaming gateway to ingest RTSP and ONVIF streams with under 150 milliseconds latency. "
        "Tier two deploys our dual-head YOLOv8 and PaddleOCR computer vision pipeline. "
        "Tier three is an asynchronous FastAPI core with sub-millisecond Redis hotlist matching. "
        "Tier four provides PostGIS spatial storage, while tier five powers the modern React GIS command dashboard."
    ),
    "Slide_4_AI_ANPR": (
        "Our specialized AI ANPR pipeline is fine-tuned for Indian road conditions. "
        "An adaptive frame sampler throttles idle streams to save compute. "
        "Dual-head YOLOv8 isolates vehicle categories and localizes the license plate. "
        "Next, CLAHE contrast enhancement eliminates headlight glare and shadow distortion, "
        "before PaddleOCR PP-OCRv4 decodes the characters with 97.4 percent accuracy on standard, high-security HSRP, commercial yellow, and green EV plates."
    ),
    "Slide_5_Hotlist_Alerting": (
        "When a stolen or suspect vehicle is spotted, our Redis in-memory match engine executes in under one millisecond. "
        "The command operator receives an instantaneous visual and audio siren on their screen in under 400 milliseconds. "
        "The alert card provides the FIR reference, high-resolution plate crop, timestamp, and one-click live video stream access "
        "to instantly coordinate PCR patrol unit intercept."
    ),
    "Slide_6_GIS_Breadcrumbs": (
        "For forensic investigations and pursuit, the interactive GIS map reconstructs the vehicle's exact journey. "
        "Using PostGIS spatial queries, Sentinel AI chronologically connects camera sightings with numbered breadcrumb markers, "
        "calculates average transit speed in kilometers per hour between junctions, "
        "and allows one-click export of court-admissible PDF investigation dossiers."
    ),
    "Slide_7_Command_Dashboard": (
        "The React 18 command center offers multi-camera grid viewing in 1, 4, 9, or 16-channel layouts, "
        "real-time incident acknowledgement logging, wildcard plate searches, and automated CCTNS FIR hotlist synchronization. "
        "The entire system is air-gapped network compatible and operates entirely on-premises inside the State Data Centre."
    ),
    "Slide_8_Summary_ROI": (
        "In summary, Sentinel AI delivers massive operational return on investment. "
        "It eliminates recurring per-camera SaaS charges, reuses existing legacy camera hardware, "
        "and slashes suspect tracking time from several hours down to seconds, all while ensuring total data sovereignty. "
        "Thank you for reviewing the Sentinel AI Surveillance Platform."
    )
}

# Full 3-minute video narration combining all sections
FULL_VIDEO_SCRIPT = (
    "Hello and welcome to the demonstration of the Sentinel AI Surveillance Platform — "
    "an enterprise-grade, 100 percent self-hosted ANPR and GIS vehicle tracking system built for police command centers.\n\n"
    "In real-world police operations, surveillance networks struggle with multi-vendor camera silos, tough Indian license plate variations, and delayed alerting. "
    "Sentinel AI solves this with a unified video ingestion gateway, sub-second AI ANPR inference, and real-time GIS breadcrumb tracking — with zero recurring cloud API costs.\n\n"
    "Here is our live surveillance matrix. The system connects to any RTSP or ONVIF stream — whether Hikvision, Dahua, CP Plus, or Axis — using our MediaMTX video proxy with ultra-low latency. "
    "Our dual-head YOLOv8 model continuously isolates vehicles and localizes license plates, passing crops to our optimized PaddleOCR engine that handles 2-line plates, commercial yellow plates, and green EV plates with over 97 percent detection accuracy.\n\n"
    "Now watch what happens when a red-flagged vehicle passes a camera junction. Within less than 400 milliseconds from camera capture, our in-memory Redis hotlist engine identifies a critical match for FIR-2026-9081, a stolen SUV. "
    "The operator immediately receives a flashing visual alert and audio siren, complete with high-resolution plate crops, timestamp, and location. With one click, the operator can acknowledge the alert or view the live camera feed to dispatch a PCR unit.\n\n"
    "For post-incident forensics and live pursuit, our GIS module reconstructs the vehicle's exact journey on an interactive map using PostGIS spatial geometry. "
    "Notice how the system chronologically connects every camera sighting with directional arrows, calculating average speeds and transit time between junctions. Investigators can instantly understand the fleeing suspect's direction of escape.\n\n"
    "Under the hood, Sentinel AI runs a FastAPI async backend, PyTorch AI pipeline, and PostGIS database. The entire stack is 100 percent self-hosted, air-gapped network compatible, and adheres to State Data Centre security standards with zero third-party cloud dependencies.\n\n"
    "Thank you for reviewing the Sentinel AI Surveillance Platform."
)

async def generate_audio():
    print(f"Generating AI Voiceovers using voice: {VOICE}...")
    
    # 1. Generate Slide-by-Slide Audio
    for name, text in SCRIPTS.items():
        out_file = os.path.join(AUDIO_DIR, f"{name}.mp3")
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(out_file)
        print(f"  -> Generated: {name}.mp3 ({os.path.getsize(out_file)/1024:.1f} KB)")
        
    # 2. Generate Full Video Demo Narration
    full_out = os.path.join(AUDIO_DIR, "00_Full_Solution_Demo_Voiceover.mp3")
    comm_full = edge_tts.Communicate(FULL_VIDEO_SCRIPT, VOICE)
    await comm_full.save(full_out)
    print(f"\n=======================================================")
    print(f"SUCCESS: Full Video Demo Voiceover saved to:")
    print(f"  -> {full_out} ({os.path.getsize(full_out)/1024:.1f} KB)")
    print(f"=======================================================")

if __name__ == "__main__":
    asyncio.run(generate_audio())
