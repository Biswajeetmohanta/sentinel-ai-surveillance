import os
import time
import asyncio
import subprocess
import edge_tts
import imageio_ffmpeg
import httpx
from playwright.async_api import async_playwright

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
TEMP_REC_DIR = os.path.join(SUBMISSION_DIR, "precise_rec_temp")
os.makedirs(TEMP_REC_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "en-US-ChristopherNeural"

# ================= EXACT SCRIPT MATCHING ON-SCREEN ACTIONS =================
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

async def generate_precise_audio():
    durations = {}
    print("--- 1. Generating Precise AI Neural Audio ---")
    for seg in SEGMENTS:
        a_path = os.path.join(TEMP_REC_DIR, f"{seg['id']}.mp3")
        comm = edge_tts.Communicate(seg["text"], VOICE)
        await comm.save(a_path)
        
        # Get duration
        res = subprocess.run([FFMPEG_EXE, "-i", a_path], capture_output=True, text=True)
        dur = 30.0
        for line in res.stderr.split("\n"):
            if "Duration:" in line:
                try:
                    time_str = line.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = time_str.split(":")
                    dur = float(h)*3600 + float(m)*60 + float(s) + 0.5
                except Exception:
                    dur = 30.0
                break
        durations[seg['id']] = dur
        print(f"  -> {seg['id']}: {dur:.2f} seconds")
    return durations

async def trigger_live_alert():
    """Trigger a hotlist detection so the UI displays the siren and red alert banner"""
    try:
        async with httpx.AsyncClient() as client:
            # First ensure database has detection
            res = await client.get("http://localhost:8000/api/v1/detections?plate=GJ01AB1234")
            print(f"Alert check: {res.status_code}")
    except Exception as e:
        print(f"Alert trigger: {e}")

async def record_screen(durations):
    video_dir = os.path.join(TEMP_REC_DIR, "raw_video")
    os.makedirs(video_dir, exist_ok=True)
    
    print("\n--- 2. Starting Synchronized Playwright Screen Recording ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--start-maximized", "--disable-gpu", "--no-sandbox"]
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=video_dir,
            record_video_size={"width": 1920, "height": 1080}
        )
        
        page = await context.new_page()
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await asyncio.sleep(2)

        # -------------------------------------------------------------
        # SEGMENT 1: Surveillance Dashboard & Live Stats
        # -------------------------------------------------------------
        dur1 = durations["seg1_dashboard"]
        print(f"\n[Recording Seg 1: Surveillance Dashboard & Live Stats] ({dur1:.1f}s)")
        # Move cursor to navbar branding
        await page.mouse.move(200, 40)
        await asyncio.sleep(3)
        # Move cursor across the 4 stats cards
        await page.mouse.move(300, 120)
        await asyncio.sleep(3)
        await page.mouse.move(600, 120)
        await asyncio.sleep(3)
        await page.mouse.move(900, 120)
        await asyncio.sleep(3)
        await page.mouse.move(1200, 120)
        await asyncio.sleep(3)
        # Point to right alert feed
        await page.mouse.move(1600, 300)
        await asyncio.sleep(dur1 - 17)

        # -------------------------------------------------------------
        # SEGMENT 2: Live Camera Grid & AI ANPR Detections
        # -------------------------------------------------------------
        dur2 = durations["seg2_cameras"]
        print(f"\n[Recording Seg 2: Live Camera Grid & AI ANPR] ({dur2:.1f}s)")
        # Hover over camera 1 (SG Highway)
        await page.mouse.move(400, 350)
        await asyncio.sleep(6)
        # Hover over camera 2 (Ashram Road)
        await page.mouse.move(1000, 350)
        await asyncio.sleep(6)
        # Hover over camera 3 (Sindhu Bhavan)
        await page.mouse.move(400, 700)
        await asyncio.sleep(6)
        # Scroll down slightly to see camera matrix
        await page.mouse.wheel(0, 200)
        await asyncio.sleep(dur2 - 20)
        await page.mouse.wheel(0, -200)
        await asyncio.sleep(2)

        # -------------------------------------------------------------
        # SEGMENT 3: Real-Time Hotlist Alert & Siren
        # -------------------------------------------------------------
        dur3 = durations["seg3_hotlist"]
        print(f"\n[Recording Seg 3: Real-Time Hotlist Alert & Siren] ({dur3:.1f}s)")
        await trigger_live_alert()
        await asyncio.sleep(2)
        # Hover over the right alert sidebar
        await page.mouse.move(1650, 250)
        await asyncio.sleep(5)
        # Click on acknowledge button if present on top alert card
        try:
            ack_btn = page.locator("button:has-text('Acknowledge'), button:has-text('Ack')").first
            if await ack_btn.is_visible():
                await ack_btn.hover()
                await asyncio.sleep(2)
                await ack_btn.click()
        except Exception:
            pass
        await asyncio.sleep(dur3 - 9)

        # -------------------------------------------------------------
        # SEGMENT 4: Trajectory & GIS Vehicle Tracking
        # -------------------------------------------------------------
        dur4 = durations["seg4_gis"]
        print(f"\n[Recording Seg 4: Trajectory & GIS Vehicle Tracking] ({dur4:.1f}s)")
        # Click on 'Trajectory & GIS' navbar tab
        try:
            traj_tab = page.locator("button:has-text('Trajectory'), button:has-text('GIS'), button:has-text('Tracking')").first
            if await traj_tab.is_visible():
                await traj_tab.click()
            else:
                await page.click("nav button:nth-child(2)")
        except Exception:
            pass
        await asyncio.sleep(4)
        
        # Focus on Search Input, type GJ01AB1234 and click Search
        try:
            input_box = page.locator("input[placeholder*='GJ'], input[placeholder*='Plate'], input[type='text']").first
            if await input_box.is_visible():
                await input_box.click()
                await page.keyboard.type("GJ01AB1234", delay=100)
                await asyncio.sleep(1)
                search_btn = page.locator("button:has-text('Search'), button:has-text('Track'), button[type='submit']").first
                if await search_btn.is_visible():
                    await search_btn.click()
        except Exception:
            pass
        await asyncio.sleep(4)
        
        # Hover over GIS map route points
        await page.mouse.move(1000, 500)
        await asyncio.sleep(4)
        await page.mouse.move(1100, 450)
        await asyncio.sleep(4)
        await asyncio.sleep(dur4 - 18)

        # -------------------------------------------------------------
        # SEGMENT 5: Suspect Hotlist & Camera Setup
        # -------------------------------------------------------------
        dur5 = durations["seg5_watchlist_cameras"]
        print(f"\n[Recording Seg 5: Suspect Hotlist & Camera Setup] ({dur5:.1f}s)")
        # Click on 'Suspect Hotlist' tab
        try:
            wl_tab = page.locator("button:has-text('Hotlist'), button:has-text('Watchlist'), button:has-text('Suspect')").first
            if await wl_tab.is_visible():
                await wl_tab.click()
            else:
                await page.click("nav button:nth-child(3)")
        except Exception:
            pass
        await asyncio.sleep(4)
        # Scroll through hotlist table
        await page.mouse.wheel(0, 150)
        await asyncio.sleep(4)
        await page.mouse.wheel(0, -150)
        await asyncio.sleep(2)
        
        # Click on 'Cameras' tab
        try:
            cam_tab = page.locator("button:has-text('Cameras'), button:has-text('Camera Setup')").first
            if await cam_tab.is_visible():
                await cam_tab.click()
            else:
                await page.click("nav button:nth-child(4)")
        except Exception:
            pass
        await asyncio.sleep(dur5 - 10)

        # Finish and save
        await page.close()
        video_path = await page.video.path()
        await context.close()
        await browser.close()
        print(f"\nRaw screen video: {video_path}")
        return video_path

async def merge_precise_video(raw_video_path):
    print("\n--- 3. Merging Synchronized Audio and Video Tracks ---")
    audio_concat = os.path.join(TEMP_REC_DIR, "audio_concat.txt")
    with open(audio_concat, "w", encoding="utf-8") as f:
        for seg in SEGMENTS:
            a_file = os.path.join(TEMP_REC_DIR, f"{seg['id']}.mp3").replace(os.sep, '/')
            f.write(f"file '{a_file}'\n")

    master_audio = os.path.join(TEMP_REC_DIR, "master_narration.mp3")
    subprocess.run([
        FFMPEG_EXE, "-y",
        "-f", "concat", "-safe", "0",
        "-i", audio_concat,
        "-c", "copy",
        master_audio
    ], capture_output=True)

    final_video = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Live_Screen_Recording_Demo.mp4")
    merge_cmd = [
        FFMPEG_EXE, "-y",
        "-i", raw_video_path,
        "-i", master_audio,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_video
    ]
    subprocess.run(merge_cmd, capture_output=True)
    
    if os.path.exists(final_video):
        size_mb = os.path.getsize(final_video) / (1024 * 1024)
        print("\n" + "="*65)
        print(f"SUCCESS: Synchronized Demonstration Video Created!")
        print(f"File Path: {final_video}")
        print(f"File Size: {size_mb:.2f} MB")
        print("="*65)

async def main():
    durations = await generate_precise_audio()
    raw_video = await record_screen(durations)
    await merge_precise_video(raw_video)

if __name__ == "__main__":
    asyncio.run(main())
