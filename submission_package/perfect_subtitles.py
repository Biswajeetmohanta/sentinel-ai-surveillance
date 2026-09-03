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
        "id": "seg1_auth",
        "title": "Officer Authentication & Security Gateway",
        "text": (
            "Welcome to the official demonstration of the Sentinel AI Surveillance Platform for Gujarat Police. "
            "We begin at the Officer Authentication Gateway. Every access is secured with Salted SHA-256 encryption and role-based clearance. "
            "We log in as the Surveillance Commander, Superintendent of Police, IT and Cyber, Badge number GP-7829."
        )
    },
    {
        "id": "seg2_dashboard",
        "title": "Statewide Control Room & 30 CCTV Nodes",
        "text": (
            "Here in the main Command Center, Sentinel unifies 30 official Gujarat Police CCTV cameras across Ahmedabad, Gandhinagar, Surat, and Rajkot into a single operational interface. "
            "The top KPI bar tracks live stream health, daily vehicle scans, and hotlist matches. "
            "Operators can seamlessly filter feeds across all 26 state departments, including Traffic Police, Civil Supplies, and RTO."
        )
    },
    {
        "id": "seg3_streaming_anpr",
        "title": "60 FPS HLS Video & Real-Time AI ANPR",
        "text": (
            "Clicking on a live node, such as Chimanbhai Bridge or Janpath, activates our hardware-accelerated HLS video engine, "
            "delivering smooth 60 frames-per-second streaming with GPU decoding. "
            "Operators can click Scan Frame with AI to trigger on-demand vehicle classification and high-accuracy OCR license plate recognition directly from the live feed."
        )
    },
    {
        "id": "seg4_hotlist_alerts",
        "title": "Sub-Second Watchlist Matching & Siren Alerts",
        "text": (
            "When a suspect vehicle passes any camera, Sentinel's in-memory engine executes sub-millisecond cross-referencing against active eGujCop and CCTNS stolen vehicle FIR databases. "
            "The control room receives an instant audio-visual siren, displaying the vehicle plate, high-resolution snapshot crop, GPS location, and one-click PCR intercept dispatch."
        )
    },
    {
        "id": "seg5_trajectory_gis",
        "title": "Chronological GIS Vehicle Trajectory & Route Reconstruction",
        "text": (
            "In the Trajectory and GIS module, entering a suspect registration number reconstructs the vehicle's chronological journey across Gujarat junctions. "
            "The interactive map renders numbered breadcrumbs from point 1 to point 4 with transit time deltas, heading vectors, and speed estimations to assist field officers in setting up roadblocks."
        )
    },
    {
        "id": "seg6_registry_gap",
        "title": "CCTV Asset Registry & Infrastructure Gap Analysis",
        "text": (
            "Finally, fulfilling Model 1 requirements, our Registry and Gap Analysis module provides a centralized inventory of all state surveillance assets, "
            "identifying coverage blind spots and aging cameras to plan future statewide expansion to 80,000 cameras. "
            "Sentinel AI is 100 percent self-hosted, air-gapped compliant, and eliminates recurring cloud SaaS fees. Thank you."
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
