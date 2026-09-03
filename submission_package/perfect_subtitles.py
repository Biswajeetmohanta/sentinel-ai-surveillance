import os
import asyncio
import subprocess
import edge_tts
import imageio_ffmpeg
import shutil

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
TEMP_DIR = os.path.join(SUBMISSION_DIR, "sub_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "en-US-ChristopherNeural"

# ================= EXACT TEXTS FOR EACH SEGMENT =================
SEGMENTS = [
    {
        "id": "seg1_dashboard",
        "title": "Surveillance Dashboard & Live Stats",
        "text": (
            "Welcome to the live demonstration of the Sentinel AI Surveillance Platform for Gujarat Police. "
            "We begin on the main Surveillance dashboard. At the top, our KPI stats bar displays live operational counters "
            "for registered city cameras, active video streams, daily ANPR detections, and suspect hotlist matches. "
            "On the left, we monitor live CCTV camera streams, while the right sidebar displays the real-time alert feed "
            "as vehicles pass through city checkpoints."
        )
    },
    {
        "id": "seg2_cameras",
        "title": "Live Camera Grid & AI ANPR Detections",
        "text": (
            "Here in the Live Camera Grid, the system ingests multi-vendor RTSP streams from Hikvision, Dahua, CP Plus, and Axis "
            "via our low-latency MediaMTX proxy. Operators can view multiple simultaneous streams, such as SG Highway and Ashram Road. "
            "In each feed, our dual-head YOLOv8 and PaddleOCR pipeline runs continuously on-premises, detecting vehicles, "
            "enhancing plate crops with CLAHE contrast filtering, and reading Indian license plates with over 97 percent accuracy."
        )
    },
    {
        "id": "seg3_hotlist",
        "title": "Real-Time Hotlist Alert & Siren Trigger",
        "text": (
            "Now, a red-flagged vehicle passes the SG Highway checkpoint. In less than 400 milliseconds, our in-memory Redis hotlist engine "
            "detects a critical match for FIR-2026-9081, a stolen white SUV. The operator immediately receives an audio-visual siren on the right sidebar, "
            "displaying the vehicle plate GJ 01 AB 1234, high-resolution snapshot crop, and location details. "
            "The operator can click Acknowledge to confirm the incident and alert field PCR patrol units."
        )
    },
    {
        "id": "seg4_gis",
        "title": "Trajectory & GIS Vehicle Tracking",
        "text": (
            "Next, clicking on the Trajectory and GIS tab opens our spatial intelligence module. "
            "We enter the suspect license plate GJ 01 AB 1234 into the search bar and click Search. "
            "The system queries PostGIS and reconstructs the vehicle's chronological journey across Ahmedabad junctions. "
            "The map draws numbered breadcrumbs from stop 1 to stop 4, showing directional heading, transit times, "
            "and average speeds to assist in suspect interception."
        )
    },
    {
        "id": "seg5_watchlist_cameras",
        "title": "Suspect Hotlist & Camera Setup",
        "text": (
            "Moving to the Suspect Hotlist tab, operators can view all active FIR records, including stolen vehicles and wanted suspects, "
            "or perform bulk CSV uploads from CCTNS. Finally, the Cameras tab allows registering new RTSP camera endpoints with GPS coordinates. "
            "Sentinel AI is 100 percent self-hosted, air-gapped network compatible, and operates with zero cloud API costs. Thank you for watching."
        )
    }
]

def format_srt_time(seconds_float):
    hours = int(seconds_float // 3600)
    minutes = int((seconds_float % 3600) // 60)
    seconds = int(seconds_float % 60)
    milliseconds = int(round((seconds_float - int(seconds_float)) * 1000))
    if milliseconds >= 1000:
        milliseconds = 999
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

async def generate_exact_word_aligned_subtitles():
    print("Generating exact neural word-aligned subtitles using Edge-TTS...")
    all_srt_entries = []
    current_time_offset = 0.0
    global_sub_index = 1

    for seg in SEGMENTS:
        text = seg["text"]
        audio_file = os.path.join(TEMP_DIR, f"{seg['id']}.mp3")
        
        submaker = edge_tts.SubMaker()
        communicate = edge_tts.Communicate(text, VOICE)
        
        with open(audio_file, "wb") as f_audio:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f_audio.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    # Offset is in 100-nanosecond units (10^-7 seconds)
                    submaker.feed(chunk)

        # Get exact duration of this segment audio file
        dur_cmd = [FFMPEG_EXE, "-i", audio_file]
        res = subprocess.run(dur_cmd, capture_output=True, text=True)
        seg_duration = 30.0
        for line in res.stderr.split("\n"):
            if "Duration:" in line:
                try:
                    time_str = line.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = time_str.split(":")
                    seg_duration = float(h)*3600 + float(m)*60 + float(s)
                except Exception:
                    seg_duration = 30.0
                break

        # Group words into short, natural subtitle lines (max 8-10 words per caption)
        # submaker.cues contains (start_time_offset_seconds, end_time_offset_seconds, word)
        words_cues = []
        # edge-tts submaker.cues is a list of cues
        # Parse cues or generate cleanly from words
        raw_srt = submaker.get_srt()
        
        # If raw_srt has cues, adjust their timestamps by current_time_offset
        if raw_srt.strip():
            # Parse raw srt blocks
            blocks = raw_srt.strip().split("\n\n")
            for b in blocks:
                lines = b.strip().split("\n")
                if len(lines) >= 3:
                    time_line = lines[1]
                    sub_text = " ".join(lines[2:])
                    # 00:00:00,100 --> 00:00:02,300
                    parts = time_line.split(" --> ")
                    if len(parts) == 2:
                        def parse_time_to_sec(tstr):
                            tstr = tstr.replace(",", ".")
                            hp, mp, sp = tstr.split(":")
                            return float(hp)*3600 + float(mp)*60 + float(sp)
                        
                        start_s = parse_time_to_sec(parts[0]) + current_time_offset
                        end_s = parse_time_to_sec(parts[1]) + current_time_offset
                        
                        all_srt_entries.append((start_s, end_s, sub_text))
        else:
            # Fallback sentence-level cue if word boundaries not captured
            all_srt_entries.append((current_time_offset, current_time_offset + seg_duration, text))

        current_time_offset += seg_duration

    # Write combined master SRT file
    master_srt_path = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_Subtitles.srt")
    with open(master_srt_path, "w", encoding="utf-8") as f:
        for idx, (s_start, s_end, s_text) in enumerate(all_srt_entries, 1):
            f.write(f"{idx}\n")
            f.write(f"{format_srt_time(s_start)} --> {format_srt_time(s_end)}\n")
            f.write(f"{s_text}\n\n")

    print(f"Generated {len(all_srt_entries)} exact subtitle cues: {master_srt_path}")
    return master_srt_path

def burn_subtitles_to_video(master_srt_path):
    input_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Live_Screen_Recording_Demo.mp4")
    output_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_With_Subtitles.mp4")

    escaped_srt = master_srt_path.replace("\\", "/").replace(":", "\\:")
    
    # Modern styling: Clean font, semi-transparent black background box for perfect contrast on any background
    sub_style = (
        "Fontname=Arial,"
        "Fontsize=20,"
        "PrimaryColour=&H00FFFFFF,"
        "BackColour=&H80000000,"
        "BorderStyle=4,"
        "Outline=1,"
        "Shadow=0,"
        "MarginV=36,"
        "Alignment=2"
    )

    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", input_video,
        "-vf", f"subtitles='{escaped_srt}':force_style='{sub_style}'",
        "-c:a", "copy",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        output_video
    ]
    
    print("\nRe-burning exact subtitles onto video...")
    subprocess.run(cmd, capture_output=True)
    
    if os.path.exists(output_video) and os.path.getsize(output_video) > 100000:
        size_mb = os.path.getsize(output_video) / (1024 * 1024)
        print(f"SUCCESS! Subtitled video generated: {output_video} ({size_mb:.2f} MB)")
        shutil.copy2(output_video, input_video)
        print("Updated primary video copy.")
    else:
        print("Error during video rendering.")

async def main():
    srt_path = await generate_exact_word_aligned_subtitles()
    burn_subtitles_to_video(srt_path)

if __name__ == "__main__":
    asyncio.run(main())
