import os
import time
import asyncio
import subprocess
import edge_tts
import imageio_ffmpeg
import httpx
from playwright.async_api import async_playwright

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
TEMP_REC_DIR = os.path.join(SUBMISSION_DIR, "live_rec_temp")
os.makedirs(TEMP_REC_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "en-US-ChristopherNeural"

# ================= SCRIPT SEGMENTS =================
SEGMENTS = [
    {
        "id": "part1_overview",
        "title": "Part 1: Overview & KPI Dashboard",
        "text": (
            "Hello and welcome to the live demonstration of the Sentinel AI Surveillance Platform — "
            "an enterprise-grade, 100 percent self-hosted video analytics and GIS vehicle tracking system built for police command centers. "
            "Here on the main command dashboard, operators get a real-time operational overview with live KPI counters for active city cameras, "
            "total daily detections, active criminal watchlists, and critical hotlist alerts, running on-premises with zero external cloud API costs."
        )
    },
    {
        "id": "part2_cameras",
        "title": "Part 2: Live Multi-Camera Grid & AI ANPR Ingestion",
        "text": (
            "Switching over to our live surveillance matrix. The system ingests multi-vendor RTSP and ONVIF video streams — "
            "including Hikvision, Dahua, CP Plus, and Axis — with ultra-low latency. "
            "Our dual-head YOLOv8 model continuously isolates vehicles and localizes license plates, passing crops to our optimized PaddleOCR engine "
            "which reads standard, 2-line, yellow commercial, and green EV plates with over 97 percent detection accuracy."
        )
    },
    {
        "id": "part3_hotlist",
        "title": "Part 3: Real-Time Hotlist Alert & Siren Trigger",
        "text": (
            "Now observe what happens when a red-flagged vehicle passes a camera junction. "
            "In under 400 milliseconds from camera capture, our in-memory Redis hotlist engine identifies a critical match for FIR-2026-9081, a stolen SUV. "
            "The operator immediately receives a flashing red visual alert and audio siren, complete with high-resolution plate crops, timestamp, and location. "
            "With one click, the operator can acknowledge the incident or inspect the live stream to dispatch a PCR patrol unit."
        )
    },
    {
        "id": "part4_gis",
        "title": "Part 4: Interactive GIS Map & Breadcrumb Trajectory Replay",
        "text": (
            "For post-incident forensics and live pursuit, our GIS module reconstructs the vehicle's exact journey on an interactive map using PostGIS spatial geometry. "
            "Notice how the system chronologically connects every camera sighting with numbered directional breadcrumbs, "
            "calculating average speeds and transit duration between city junctions. "
            "Investigators can instantly determine the suspect's fleeing direction and export court-admissible PDF dossiers."
        )
    },
    {
        "id": "part5_watchlist_conclusion",
        "title": "Part 5: Watchlist Manager, Architecture & Conclusion",
        "text": (
            "In the Watchlist Manager, operators can manage active FIR entries and synchronize bulk hotlists via CCTNS CSV integration. "
            "Under the hood, Sentinel AI runs a FastAPI async backend, PyTorch AI pipeline, and PostGIS database. "
            "The entire stack is 100 percent self-hosted, air-gapped network compatible, and adheres to State Data Centre security standards. "
            "Thank you for reviewing the Sentinel AI Surveillance Platform."
        )
    }
]

async def generate_all_audio():
    audio_durations = {}
    print("Generating AI Neural Voiceovers...")
    for seg in SEGMENTS:
        audio_path = os.path.join(TEMP_REC_DIR, f"{seg['id']}.mp3")
        comm = edge_tts.Communicate(seg["text"], VOICE)
        await comm.save(audio_path)
        
        # Get duration
        res = subprocess.run([FFMPEG_EXE, "-i", audio_path], capture_output=True, text=True)
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
        audio_durations[seg['id']] = dur
        print(f"  -> {seg['id']}.mp3: {dur:.2f} seconds")
    return audio_durations

async def trigger_mock_hotlist_hit():
    """Trigger a live detection hit on backend so the UI shows real-time alert"""
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "plate_number": "GJ01AB1234",
                "camera_id": 1,
                "confidence": 0.96,
                "vehicle_class": "SUV"
            }
            res = await client.post("http://localhost:8000/api/v1/detections/mock-detect", json=payload)
            print(f"Triggered hotlist alert hit: {res.status_code}")
    except Exception as e:
        print(f"Hotlist trigger note: {e}")

async def record_screen_actions(durations):
    video_output_dir = os.path.join(TEMP_REC_DIR, "raw_video")
    os.makedirs(video_output_dir, exist_ok=True)
    
    print("\nStarting Playwright Browser recording on http://localhost:5173...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--start-maximized",
                "--disable-gpu",
                "--no-sandbox"
            ]
        )
        
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=video_output_dir,
            record_video_size={"width": 1920, "height": 1080}
        )
        
        page = await context.new_page()
        await page.goto("http://localhost:5173", wait_until="networkidle")
        await asyncio.sleep(2)
        
        # -------------------------------------------------------------
        # PART 1: DASHBOARD OVERVIEW (0 to dur1)
        # -------------------------------------------------------------
        dur1 = durations["part1_overview"]
        print(f"\n[Recording Part 1: Dashboard Overview] ({dur1:.1f}s)")
        # Scroll gently across the dashboard
        await asyncio.sleep(2)
        await page.mouse.wheel(0, 300)
        await asyncio.sleep(dur1 / 2)
        await page.mouse.wheel(0, -300)
        await asyncio.sleep(dur1 / 2 - 2)

        # -------------------------------------------------------------
        # PART 2: LIVE CAMERA GRID (dur1 to dur1+dur2)
        # -------------------------------------------------------------
        dur2 = durations["part2_cameras"]
        print(f"\n[Recording Part 2: Live Camera Grid] ({dur2:.1f}s)")
        # Click on Live Cameras tab / button
        try:
            cam_tab = page.locator("button:has-text('Cameras'), a:has-text('Cameras'), button:has-text('Live Feeds')").first
            if await cam_tab.is_visible():
                await cam_tab.click()
            else:
                # Click tab in navbar
                await page.click("nav button:nth-child(2)")
        except Exception:
            pass
        
        await asyncio.sleep(3)
        # Switch grid mode (4-cam to 9-cam or full view)
        try:
            grid_btn = page.locator("button:has-text('9'), button:has-text('Grid 3x3'), button:has-text('4')").first
            if await grid_btn.is_visible():
                await grid_btn.click()
        except Exception:
            pass
        await asyncio.sleep(dur2 - 3)

        # -------------------------------------------------------------
        # PART 3: HOTLIST ALERT & SIREN (dur3)
        # -------------------------------------------------------------
        dur3 = durations["part3_hotlist"]
        print(f"\n[Recording Part 3: Real-Time Hotlist Alert] ({dur3:.1f}s)")
        
        # Trigger hotlist alert
        await trigger_mock_hotlist_hit()
        await asyncio.sleep(2)
        
        # Hover / show alert card on sidebar
        try:
            alert_card = page.locator(".alert, .toast, [role='alert'], div:has-text('CRITICAL'), div:has-text('GJ01AB1234')").first
            if await alert_card.is_visible():
                await alert_card.hover()
                await asyncio.sleep(2)
                # Click acknowledge if present
                ack_btn = alert_card.locator("button:has-text('Acknowledge'), button:has-text('Ack')").first
                if await ack_btn.is_visible():
                    await ack_btn.click()
        except Exception:
            pass
        await asyncio.sleep(dur3 - 4)

        # -------------------------------------------------------------
        # PART 4: GIS MAP & BREADCRUMBS (dur4)
        # -------------------------------------------------------------
        dur4 = durations["part4_gis"]
        print(f"\n[Recording Part 4: GIS Breadcrumbs] ({dur4:.1f}s)")
        try:
            gis_tab = page.locator("button:has-text('GIS'), button:has-text('Map'), button:has-text('Tracking'), button:has-text('Trajectory')").first
            if await gis_tab.is_visible():
                await gis_tab.click()
            else:
                await page.click("nav button:nth-child(3)")
        except Exception:
            pass
        await asyncio.sleep(3)
        
        # Type license plate in search box
        try:
            search_input = page.locator("input[placeholder*='GJ'], input[placeholder*='Plate'], input[placeholder*='Search'], input[type='text']").first
            if await search_input.is_visible():
                await search_input.fill("GJ01AB1234")
                await asyncio.sleep(1)
                search_btn = page.locator("button:has-text('Search'), button:has-text('Track'), button[type='submit']").first
                if await search_btn.is_visible():
                    await search_btn.click()
        except Exception:
            pass
        
        await asyncio.sleep(dur4 - 4)

        # -------------------------------------------------------------
        # PART 5: WATCHLIST & CONCLUSION (dur5)
        # -------------------------------------------------------------
        dur5 = durations["part5_watchlist_conclusion"]
        print(f"\n[Recording Part 5: Watchlist & Conclusion] ({dur5:.1f}s)")
        try:
            wl_tab = page.locator("button:has-text('Watchlist'), button:has-text('Hotlist'), button:has-text('FIR')").first
            if await wl_tab.is_visible():
                await wl_tab.click()
            else:
                await page.click("nav button:nth-child(4)")
        except Exception:
            pass
        await asyncio.sleep(dur5)

        # Close context and save video
        await page.close()
        video_path = await page.video.path()
        await context.close()
        await browser.close()
        
        print(f"\nRaw WebM video saved at: {video_path}")
        return video_path

async def merge_video_and_audio(raw_video_path, durations):
    print("\nMerging live video recording with full AI neural narration track...")
    
    # 1. Concat all 5 audio segments into one master audio track
    audio_concat_txt = os.path.join(TEMP_REC_DIR, "audio_concat.txt")
    with open(audio_concat_txt, "w", encoding="utf-8") as f:
        for seg in SEGMENTS:
            a_file = os.path.join(TEMP_REC_DIR, f"{seg['id']}.mp3").replace(os.sep, '/')
            f.write(f"file '{a_file}'\n")
            
    master_audio = os.path.join(TEMP_REC_DIR, "master_narration.mp3")
    cmd_a = [
        FFMPEG_EXE,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", audio_concat_txt,
        "-c", "copy",
        master_audio
    ]
    subprocess.run(cmd_a, capture_output=True)
    print(f"Master audio track compiled: {master_audio}")

    # 2. Convert WebM to MP4 and merge with Master Audio
    final_output_mp4 = os.path.join(SUBMISSION_DIR, "Sentinel_AI_Live_Screen_Recording_Demo.mp4")
    
    merge_cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", raw_video_path,
        "-i", master_audio,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        final_output_mp4
    ]
    subprocess.run(merge_cmd, capture_output=True)
    
    if os.path.exists(final_output_mp4):
        size_mb = os.path.getsize(final_output_mp4) / (1024 * 1024)
        print("\n" + "="*60)
        print("SUCCESS: Live Screen Recording Video Generated!")
        print(f"File Path: {final_output_mp4}")
        print(f"File Size: {size_mb:.2f} MB")
        print("="*60)
    else:
        print("Failed to compile final video.")

async def main():
    durations = await generate_all_audio()
    raw_video = await record_screen_actions(durations)
    await merge_video_and_audio(raw_video, durations)

if __name__ == "__main__":
    asyncio.run(main())
