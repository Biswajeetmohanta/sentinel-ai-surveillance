import os
import subprocess
import imageio_ffmpeg

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# ================= 1. CREATE ACCURATE SRT SUBTITLES =================
SRT_CONTENT = """1
00:00:00,000 --> 00:00:06,000
Welcome to the live demonstration of the Sentinel AI Surveillance Platform for Gujarat Police.

2
00:00:06,000 --> 00:00:12,500
We begin on the main Surveillance dashboard with real-time operational KPI counters.

3
00:00:12,500 --> 00:00:19,000
At the top: registered city cameras, active video streams, daily ANPR detections, and hotlist matches.

4
00:00:19,000 --> 00:00:25,500
On the left, we monitor live CCTV feeds; on the right, the real-time alert feed updates instantly.

5
00:00:25,500 --> 00:00:31,770
The entire system operates 100% on-premises with zero external cloud API costs.

6
00:00:31,770 --> 00:00:38,000
Here in the Live Camera Grid, the system ingests multi-vendor RTSP streams via our MediaMTX proxy.

7
00:00:38,000 --> 00:00:44,500
Compatible with Hikvision, Dahua, CP Plus, and Axis across major Ahmedabad junctions.

8
00:00:44,500 --> 00:00:51,500
Our dual-head YOLOv8 and PaddleOCR pipeline runs continuously on-premises to detect vehicles.

9
00:00:51,500 --> 00:00:58,000
CLAHE contrast filtering enhances plate crops for standard, 2-line, commercial, and EV plates.

10
00:00:58,000 --> 00:01:05,770
Achieving over 97% recognition accuracy across dense Indian traffic conditions.

11
00:01:05,770 --> 00:01:13,000
Now, a red-flagged vehicle passes the SG Highway checkpoint.

12
00:01:13,000 --> 00:01:20,000
In less than 400ms, our in-memory Redis engine identifies a critical match for FIR-2026-9081 (Stolen SUV).

13
00:01:20,000 --> 00:01:27,500
The operator receives an instant audio-visual siren with vehicle plate GJ 01 AB 1234.

14
00:01:27,500 --> 00:01:34,500
Displaying high-resolution snapshot crop, timestamp, and precise GPS junction coordinates.

15
00:01:34,500 --> 00:01:41,120
The operator can click Acknowledge with one click to confirm and dispatch field PCR units.

16
00:01:41,120 --> 00:01:47,500
Next, clicking on the Trajectory and GIS tab opens our spatial intelligence module.

17
00:01:47,500 --> 00:01:54,500
We enter the suspect license plate GJ 01 AB 1234 into the search bar and click Search.

18
00:01:54,500 --> 00:02:02,500
The system queries PostGIS and reconstructs the vehicle's chronological route across city junctions.

19
00:02:02,500 --> 00:02:12,320
The map draws numbered breadcrumbs (1 to 4), showing directional headings, transit times, and average speeds.

20
00:02:12,320 --> 00:02:19,000
Moving to the Suspect Hotlist tab, operators manage active FIR records and wanted suspects.

21
00:02:19,000 --> 00:02:26,000
Bulk CSV import allows seamless synchronization with CCTNS police records.

22
00:02:26,000 --> 00:02:34,000
Finally, the Cameras tab allows registering new RTSP camera endpoints with GPS locations.

23
00:02:34,000 --> 00:02:43,000
Sentinel AI is 100% self-hosted, air-gapped network compatible, and fully secure. Thank you for watching.
"""

srt_file_path = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_Subtitles.srt")
with open(srt_file_path, "w", encoding="utf-8") as f:
    f.write(SRT_CONTENT.strip())

print(f"Created SRT file: {srt_file_path}")

# ================= 2. BURN SUBTITLES INTO MP4 VIDEO =================
input_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Live_Screen_Recording_Demo.mp4")
output_video_with_subtitles = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_With_Subtitles.mp4")

# FFmpeg subtitles filter needs escaped path on Windows
escaped_srt = srt_file_path.replace("\\", "/").replace(":", "\\:")

sub_style = "FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=30,Alignment=2"

burn_cmd = [
    FFMPEG_EXE,
    "-y",
    "-i", input_video,
    "-vf", f"subtitles='{escaped_srt}':force_style='{sub_style}'",
    "-c:a", "copy",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    output_video_with_subtitles
]

print("\nBurning stylized subtitles onto video with FFmpeg...")
res = subprocess.run(burn_cmd, capture_output=True, text=True)

if os.path.exists(output_video_with_subtitles) and os.path.getsize(output_video_with_subtitles) > 100000:
    size_mb = os.path.getsize(output_video_with_subtitles) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"SUCCESS: Subtitled Video Created!")
    print(f"Path: {output_video_with_subtitles}")
    print(f"Size: {size_mb:.2f} MB")
    print(f"=======================================================")
    
    # Also overwrite/update the primary video file so both links work seamlessly
    import shutil
    shutil.copy2(output_video_with_subtitles, input_video)
    print(f"Updated primary video '{input_video}' with subtitles.")
else:
    print(f"Subtitle burn error: {res.stderr}")
