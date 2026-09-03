import os
import subprocess
import imageio_ffmpeg

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

# ================= CLEAN SHORT 1-2 LINE SUBTITLE CUES =================
# Small, concise, natural 4-5 second chunks matching the speech pace
SUBTITLES = [
    # Segment 1: Officer Authentication & Security (0.0 to 25.34)
    (0.0, 5.5, "Welcome to the official demonstration of the Sentinel AI Surveillance Platform."),
    (5.5, 10.8, "Submitted for the Gujarat Police Innovation Challenge 2026."),
    (10.8, 16.5, "We begin at the secure Officer Authentication Gateway."),
    (16.5, 21.2, "Every access is secured with Salted SHA-256 encryption and role-based clearance."),
    (21.2, 25.3, "Authorizing as Superintendent of Police, IT & Cyber, Badge GP-7829."),

    # Segment 2: Statewide Control Room & 30 CCTV Nodes (25.34 to 53.85)
    (25.3, 31.0, "Here in the main Command Center, Sentinel unifies 30 official Gujarat Police CCTV cameras"),
    (31.0, 36.8, "across Ahmedabad, Gandhinagar, Surat, and Rajkot into a single interface."),
    (36.8, 42.5, "The top KPI bar tracks live stream health, daily vehicle scans, and hotlist matches."),
    (42.5, 48.2, "Operators can seamlessly filter feeds across all 26 state departments,"),
    (48.2, 53.8, "including Traffic Police, Civil Supplies, and RTO checkpoints."),

    # Segment 3: 60 FPS HLS Video & AI ANPR (53.85 to 76.67)
    (53.8, 59.5, "Clicking on a live node activates our hardware-accelerated HLS video engine,"),
    (59.5, 65.2, "delivering smooth 60 frames-per-second streaming with browser GPU decoding."),
    (65.2, 71.0, "Operators can click Scan Frame with AI to trigger on-demand vehicle classification"),
    (71.0, 76.6, "and high-accuracy OCR license plate recognition directly from the live feed."),

    # Segment 4: Watchlist Alerts & Siren (76.67 to 100.91)
    (76.6, 82.2, "When a suspect vehicle passes any camera, Sentinel's in-memory engine"),
    (82.2, 88.0, "executes sub-millisecond cross-referencing against active eGujCop and CCTNS FIR databases."),
    (88.0, 94.2, "The control room receives an instant audio-visual siren with vehicle snapshot,"),
    (94.2, 100.9, "displaying GPS coordinates, FIR details, and one-click PCR intercept dispatch."),

    # Segment 5: Trajectory & GIS Vehicle Tracking (100.91 to 122.10)
    (100.9, 106.5, "In the Trajectory and GIS module, entering a suspect registration number"),
    (106.5, 111.8, "reconstructs the vehicle's chronological journey across Gujarat junctions."),
    (111.8, 117.2, "The interactive map renders numbered breadcrumbs from point 1 to point 4"),
    (117.2, 122.1, "with transit time deltas, heading vectors, and speed estimations for interception."),

    # Segment 6: CCTV Asset Registry & Gap Analysis (122.10 to 148.06)
    (122.1, 128.0, "Finally, fulfilling Model 1 requirements, our Registry and Gap Analysis module"),
    (128.0, 134.5, "provides a centralized inventory of all state surveillance assets,"),
    (134.5, 140.8, "identifying coverage blind spots and aging cameras to scale up to 80,000 cameras."),
    (140.8, 148.0, "Sentinel AI is 100% self-hosted with zero recurring cloud fees. Thank you.")
]

def format_srt_time(seconds_float):
    hours = int(seconds_float // 3600)
    minutes = int((seconds_float % 3600) // 60)
    seconds = int(seconds_float % 60)
    milliseconds = int(round((seconds_float - int(seconds_float)) * 1000))
    if milliseconds >= 1000:
        milliseconds = 999
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def generate_srt():
    srt_file = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_Subtitles.srt")
    with open(srt_file, "w", encoding="utf-8") as f:
        for idx, (start_s, end_s, text) in enumerate(SUBTITLES, 1):
            f.write(f"{idx}\n")
            f.write(f"{format_srt_time(start_s)} --> {format_srt_time(end_s)}\n")
            f.write(f"{text}\n\n")
    print(f"Created short clean SRT file: {srt_file} ({len(SUBTITLES)} cues)")
    return srt_file

def burn_subtitles(srt_file):
    input_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Live_Screen_Recording_Demo.mp4")
    output_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Demo_With_Subtitles.mp4")

    escaped_srt = srt_file.replace("\\", "/").replace(":", "\\:")
    
    # Modern styling: Clean font, semi-transparent black background box for high readability
    sub_style = (
        "Fontname=Arial,"
        "Fontsize=20,"
        "PrimaryColour=&H00FFFFFF,"
        "BackColour=&H80000000,"
        "BorderStyle=4,"
        "Outline=1,"
        "Shadow=0,"
        "MarginV=38,"
        "Alignment=2"
    )

    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", input_video,
        "-vf", f"subtitles='{escaped_srt}':force_style='{sub_style}'",
        "-c:v", "libx264",
        "-crf", "20",
        "-preset", "fast",
        "-c:a", "copy",
        output_video
    ]

    print(f"Burning subtitles onto: {output_video}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(output_video):
        size_mb = os.path.getsize(output_video) / (1024 * 1024)
        print("="*65)
        print("SUCCESS: Subtitled Video Created Successfully!")
        print(f"Output File: {output_video}")
        print(f"File Size: {size_mb:.2f} MB")
        print("="*65)
    else:
        print("Error burning subtitles:", res.stderr)

if __name__ == "__main__":
    srt = generate_srt()
    burn_subtitles(srt)
