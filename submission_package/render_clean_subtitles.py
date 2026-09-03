import os
import subprocess
import imageio_ffmpeg
import shutil

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# ================= 1. CLEAN SHORT 1-2 LINE SUBTITLE CUES =================
# Small, concise, natural 3-4 second chunks matching the speech pace
SUBTITLES = [
    # Segment 1: Dashboard (0:00 - 0:31.8)
    (0.0, 4.2, "Welcome to the live demonstration of Sentinel AI for Gujarat Police."),
    (4.2, 8.8, "We begin on the main Surveillance command dashboard."),
    (8.8, 14.5, "At the top, our KPI stats bar displays live operational counters:"),
    (14.5, 20.2, "Active city cameras, video streams, daily ANPR detections, and hotlist matches."),
    (20.2, 26.0, "On the left, live CCTV feeds; on the right, real-time incoming alert feeds."),
    (26.0, 31.8, "Running 100% on-premises with zero external cloud API costs."),

    # Segment 2: Cameras (0:31.8 - 1:05.8)
    (31.8, 37.5, "Here in the Live Camera Grid, we ingest multi-vendor RTSP streams"),
    (37.5, 43.2, "via our low-latency MediaMTX proxy: Hikvision, Dahua, CP Plus, and Axis."),
    (43.2, 49.5, "Operators can monitor multiple simultaneous junctions like SG Highway and Ashram Road."),
    (49.5, 55.2, "Our dual-head YOLOv8 and PaddleOCR pipeline runs continuously on-premises,"),
    (55.2, 60.5, "detecting vehicles and enhancing plate crops with CLAHE contrast filtering,"),
    (60.5, 65.8, "reading Indian license plates with over 97% recognition accuracy."),

    # Segment 3: Hotlist Alert (1:05.8 - 1:41.1)
    (65.8, 71.0, "Now, a red-flagged vehicle passes the SG Highway checkpoint."),
    (71.0, 77.2, "In under 400ms, our in-memory Redis hotlist engine detects a critical match"),
    (77.2, 82.5, "for FIR-2026-9081 — a reported stolen white SUV."),
    (82.5, 88.0, "The operator receives an instant audio-visual siren on the right sidebar,"),
    (88.0, 93.5, "displaying plate GJ 01 AB 1234, snapshot crops, and location details."),
    (93.5, 98.5, "The operator can click Acknowledge to confirm the incident"),
    (98.5, 101.1, "and immediately alert field PCR patrol units."),

    # Segment 4: GIS & Trajectory (1:41.1 - 2:12.3)
    (101.1, 106.8, "Next, clicking on Trajectory & GIS opens our spatial tracking module."),
    (106.8, 112.5, "We enter suspect license plate GJ 01 AB 1234 and click Search."),
    (112.5, 118.5, "The system queries PostGIS and reconstructs the vehicle's chronological journey."),
    (118.5, 125.0, "The map draws numbered breadcrumbs from stop 1 to stop 4,"),
    (125.0, 132.3, "showing directional headings, transit times, and average speeds."),

    # Segment 5: Watchlist & Conclusion (2:12.3 - 2:42.6)
    (132.3, 138.0, "On the Suspect Hotlist tab, operators manage active FIR records"),
    (138.0, 143.5, "and perform bulk CSV uploads synchronized with CCTNS."),
    (143.5, 150.0, "The Cameras tab allows registering new RTSP camera endpoints with GPS coordinates."),
    (150.0, 157.0, "Sentinel AI is 100% self-hosted, air-gapped compatible, with zero recurring fees."),
    (157.0, 162.6, "Thank you for watching the Sentinel AI demonstration.")
]

def format_srt_time(seconds_float):
    hours = int(seconds_float // 3600)
    minutes = int((seconds_float % 3600) // 60)
    seconds = int(seconds_float % 60)
    milliseconds = int(round((seconds_float - int(seconds_float)) * 1000))
    if milliseconds >= 1000:
        milliseconds = 999
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

# 1. Write SRT file
srt_file = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_Subtitles.srt")
with open(srt_file, "w", encoding="utf-8") as f:
    for idx, (start_s, end_s, text) in enumerate(SUBTITLES, 1):
        f.write(f"{idx}\n")
        f.write(f"{format_srt_time(start_s)} --> {format_srt_time(end_s)}\n")
        f.write(f"{text}\n\n")

print(f"Created short clean SRT file: {srt_file}")

# 2. Source raw clean video & master audio
raw_video = os.path.join(SUBMISSION_DIR, "precise_rec_temp", "raw_video", "page@427e590189ad8b9fe052559f77ad027f.webm")
master_audio = os.path.join(SUBMISSION_DIR, "precise_rec_temp", "master_narration.mp3")
output_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_With_Subtitles.mp4")
primary_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Live_Screen_Recording_Demo.mp4")

escaped_srt = srt_file.replace("\\", "/").replace(":", "\\:")

# Elegant small subtitle styling:
# - FontSize=13 (Clean, non-intrusive, 1-2 lines)
# - Outline=1.2, Shadow=0.5
# - MarginV=18 (Pinned right at the bottom edge)
# - Alignment=2 (Bottom Center)
sub_style = (
    "Fontname=Arial,"
    "Fontsize=13,"
    "PrimaryColour=&H00FFFFFF,"
    "OutlineColour=&H00000000,"
    "BorderStyle=1,"
    "Outline=1.5,"
    "Shadow=0.8,"
    "MarginV=18,"
    "Alignment=2"
)

cmd = [
    FFMPEG_EXE,
    "-y",
    "-i", raw_video,
    "-i", master_audio,
    "-vf", f"subtitles='{escaped_srt}':force_style='{sub_style}'",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    output_video
]

print("Rendering clean video with compact subtitles...")
subprocess.run(cmd, capture_output=True)

if os.path.exists(output_video) and os.path.getsize(output_video) > 1000000:
    size_mb = os.path.getsize(output_video) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"SUCCESS: Clean Subtitled Video Rendered!")
    print(f"Path: {output_video}")
    print(f"Size: {size_mb:.2f} MB")
    print(f"=======================================================")
    shutil.copy2(output_video, primary_video)
    print(f"Updated: {primary_video}")
else:
    print("Failed to render video.")
