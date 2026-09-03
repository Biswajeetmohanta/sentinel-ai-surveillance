import os
import asyncio
import subprocess
import edge_tts
import imageio_ffmpeg

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
TEMP_DIR = os.path.join(SUBMISSION_DIR, "video_build_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# ================= 1. DEFINE EXACT SCRIPT SECTIONS =================
SECTIONS = [
    {
        "id": "part1",
        "slide_num": 1,
        "title": "Part 1: Introduction & The Problem Statement",
        "text": (
            "Hello and welcome to the demonstration of the Sentinel AI Surveillance Platform — "
            "an enterprise-grade, 100 percent self-hosted ANPR and GIS vehicle tracking system built for police command centers. "
            "In real-world police operations, surveillance networks struggle with multi-vendor camera silos, tough Indian license plate variations, "
            "and delayed alerting. Sentinel AI solves this with a unified video ingestion gateway, sub-second AI ANPR inference, "
            "and real-time GIS breadcrumb tracking — with zero recurring cloud API costs."
        )
    },
    {
        "id": "part2",
        "slide_num": 4,
        "title": "Part 2: Multi-Camera Ingestion & AI ANPR Grid",
        "text": (
            "Here is our live surveillance matrix. The system connects to any RTSP or ONVIF stream — "
            "whether Hikvision, Dahua, CP Plus, or Axis — using our MediaMTX video proxy with ultra-low latency. "
            "Our dual-head YOLOv8 model continuously isolates vehicles and localizes license plates, "
            "passing crops to our optimized PaddleOCR engine that handles 2-line plates, commercial yellow plates, "
            "and green EV plates with over 97 percent detection accuracy."
        )
    },
    {
        "id": "part3",
        "slide_num": 5,
        "title": "Part 3: Real-Time Hotlist Alert & Instant Siren",
        "text": (
            "Now watch what happens when a red-flagged vehicle passes a camera junction. "
            "Within less than 400 milliseconds from camera capture, our in-memory Redis hotlist engine identifies a critical match for FIR-2026-9081, a stolen SUV. "
            "The operator immediately receives a flashing visual alert and audio siren, complete with high-resolution plate crops, timestamp, and location. "
            "With one click, the operator can acknowledge the alert or view the live camera feed to dispatch a PCR unit."
        )
    },
    {
        "id": "part4",
        "slide_num": 6,
        "title": "Part 4: GIS Map & Breadcrumb Journey Replay",
        "text": (
            "For post-incident forensics and live pursuit, our GIS module reconstructs the vehicle's exact journey on an interactive map using PostGIS spatial geometry. "
            "Notice how the system chronologically connects every camera sighting with directional arrows, calculating average speeds and transit time between junctions. "
            "Investigators can instantly understand the fleeing suspect's direction of escape."
        )
    },
    {
        "id": "part5",
        "slide_num": 3,
        "title": "Part 5: Architecture, Compliance & Conclusion",
        "text": (
            "Under the hood, Sentinel AI runs a FastAPI async backend, PyTorch AI pipeline, and PostGIS database. "
            "The entire stack is 100 percent self-hosted, air-gapped network compatible, and adheres to State Data Centre security standards "
            "with zero third-party cloud dependencies. Thank you for reviewing the Sentinel AI Surveillance Platform."
        )
    }
]

VOICE = "en-US-ChristopherNeural"

async def build_video():
    print(f"Using FFmpeg at: {FFMPEG_EXE}")
    print(f"Using Chrome at: {CHROME_PATH}")
    
    part_clips = []
    
    # 1. Generate Voice Audio & Render Visual Slides for each Part
    for idx, sec in enumerate(SECTIONS):
        part_id = sec["id"]
        slide_num = sec["slide_num"]
        print(f"\n--- Processing {sec['title']} ---")
        
        # Audio
        audio_file = os.path.join(TEMP_DIR, f"{part_id}.mp3")
        comm = edge_tts.Communicate(sec["text"], VOICE)
        await comm.save(audio_file)
        print(f"  -> Generated audio: {audio_file}")
        
        # Get audio duration using ffprobe/ffmpeg
        dur_cmd = [
            FFMPEG_EXE,
            "-i", audio_file
        ]
        res = subprocess.run(dur_cmd, capture_output=True, text=True)
        # Parse Duration: 00:00:25.40
        duration_sec = 25.0
        for line in res.stderr.split("\n"):
            if "Duration:" in line:
                try:
                    time_str = line.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = time_str.split(":")
                    duration_sec = float(h)*3600 + float(m)*60 + float(s) + 0.8
                except Exception:
                    duration_sec = 25.0
                break
        print(f"  -> Audio duration: {duration_sec:.2f} seconds")
        
        # Slide image capture
        slide_html = os.path.join(SUBMISSION_DIR, "slides_temp", f"slide_{slide_num}.html")
        img_file = os.path.join(TEMP_DIR, f"{part_id}.png")
        cmd_img = [
            CHROME_PATH,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--window-size=1920,1080",
            "--hide-scrollbars",
            f"--screenshot={img_file}",
            f"file:///{slide_html.replace(os.sep, '/')}"
        ]
        subprocess.run(cmd_img, capture_output=True)
        print(f"  -> Captured slide image: {img_file}")
        
        # Create individual video clip for this part using FFmpeg
        clip_file = os.path.join(TEMP_DIR, f"{part_id}.mp4")
        cmd_clip = [
            FFMPEG_EXE,
            "-y",
            "-loop", "1",
            "-i", img_file,
            "-i", audio_file,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            "-t", str(duration_sec),
            clip_file
        ]
        subprocess.run(cmd_clip, capture_output=True)
        if os.path.exists(clip_file):
            print(f"  -> Built video segment: {clip_file}")
            part_clips.append(clip_file)
        else:
            print(f"  -> FAILED to build clip for {part_id}")

    # 2. Concat all video segments into Final MP4 Video
    concat_list_file = os.path.join(TEMP_DIR, "concat_list.txt")
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for clip in part_clips:
            f.write(f"file '{clip.replace(os.sep, '/')}'\n")

    final_output_mp4 = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Solution_Demonstration_Video.mp4")
    
    concat_cmd = [
        FFMPEG_EXE,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_file,
        "-c", "copy",
        final_output_mp4
    ]
    subprocess.run(concat_cmd, capture_output=True)
    
    if os.path.exists(final_output_mp4):
        size_mb = os.path.getsize(final_output_mp4) / (1024 * 1024)
        print(f"\n=======================================================")
        print(f"🎉 SUCCESS: Final Solution Video Generated!")
        print(f"File Path: {final_output_mp4}")
        print(f"File Size: {size_mb:.2f} MB")
        print(f"=======================================================")
    else:
        print("Concat failed.")

if __name__ == "__main__":
    asyncio.run(build_video())
