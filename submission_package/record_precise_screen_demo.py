import os
import time
import asyncio
import subprocess
import edge_tts
import imageio_ffmpeg
from playwright.async_api import async_playwright

SUBMISSION_DIR = r"D:\sentinel-ai-surveillance\submission_package"
TEMP_REC_DIR = os.path.join(SUBMISSION_DIR, "precise_rec_temp")
os.makedirs(TEMP_REC_DIR, exist_ok=True)

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
VOICE = "en-US-ChristopherNeural"
TARGET_URL = "https://sentinel.deventtechnology.com"

# ================= EXACT SCRIPT MATCHING ON-SCREEN ACTIONS =================
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

async def generate_precise_audio():
    durations = {}
    print("--- 1. Generating Precise AI Neural Audio ---")
    for seg in SEGMENTS:
        a_path = os.path.join(TEMP_REC_DIR, f"{seg['id']}.mp3")
        comm = edge_tts.Communicate(seg["text"], VOICE)
        await comm.save(a_path)
        
        # Get duration
        res = subprocess.run([FFMPEG_EXE, "-i", a_path], capture_output=True, text=True)
        dur = 25.0
        for line in res.stderr.split("\n"):
            if "Duration:" in line:
                try:
                    time_str = line.split("Duration:")[1].split(",")[0].strip()
                    h, m, s = time_str.split(":")
                    dur = float(h)*3600 + float(m)*60 + float(s) + 0.5
                except Exception:
                    dur = 25.0
                break
        durations[seg['id']] = dur
        print(f"  -> {seg['id']}: {dur:.2f} seconds")
    return durations

async def record_screen(durations):
    video_dir = os.path.join(TEMP_REC_DIR, "raw_video")
    os.makedirs(video_dir, exist_ok=True)
    
    print("\n--- 2. Starting Synchronized Playwright Screen Recording on Live Site ---")
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
        print(f"Navigating to {TARGET_URL}...", flush=True)
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(3)

        # -------------------------------------------------------------
        # SEGMENT 1: Officer Authentication & Security Gateway
        # -------------------------------------------------------------
        dur1 = durations["seg1_auth"]
        print(f"\n[Recording Seg 1: Officer Authentication & Security Gateway] ({dur1:.1f}s)", flush=True)
        # Check if already logged in or login form visible
        try:
            await page.wait_for_selector("input[type='email']", timeout=5000)
            has_login = True
        except Exception:
            has_login = False

        if has_login:
            print("Found login form, filling officer credentials...", flush=True)
            login_input = page.locator("input[type='email']")
            await page.mouse.move(960, 380)
            await asyncio.sleep(2)
            await login_input.click()
            await page.keyboard.type("jyoti@deventtechnology.com", delay=50)
            await asyncio.sleep(1)
            
            pwd_input = page.locator("input[type='password']")
            await pwd_input.click()
            await page.keyboard.type("123456", delay=50)
            await asyncio.sleep(1)
            
            submit_btn = page.locator("button[type='submit']")
            await submit_btn.hover()
            await asyncio.sleep(1.5)
            await submit_btn.click()
            await asyncio.sleep(3)
        else:
            await page.mouse.move(960, 540)
            await asyncio.sleep(5)
        
        # Remaining time for seg1
        rem1 = max(1.0, dur1 - 10.0)
        await asyncio.sleep(rem1)

        # -------------------------------------------------------------
        # SEGMENT 2: Statewide Control Room & 30 CCTV Nodes
        # -------------------------------------------------------------
        dur2 = durations["seg2_dashboard"]
        print(f"\n[Recording Seg 2: Statewide Control Room & 30 CCTV Nodes] ({dur2:.1f}s)")
        # Move cursor to top stats cards
        await page.mouse.move(200, 110)
        await asyncio.sleep(3)
        await page.mouse.move(500, 110)
        await asyncio.sleep(3)
        await page.mouse.move(800, 110)
        await asyncio.sleep(3)
        await page.mouse.move(1100, 110)
        await asyncio.sleep(3)
        
        # Move down to camera list
        await page.mouse.move(180, 280)
        await asyncio.sleep(2)
        await page.mouse.wheel(0, 180)
        await asyncio.sleep(3)
        await page.mouse.wheel(0, -180)
        await asyncio.sleep(2)
        
        rem2 = max(1.0, dur2 - 19.0)
        await asyncio.sleep(rem2)

        # -------------------------------------------------------------
        # SEGMENT 3: 60 FPS HLS Video & Real-Time AI ANPR
        # -------------------------------------------------------------
        dur3 = durations["seg3_streaming_anpr"]
        print(f"\n[Recording Seg 3: 60 FPS HLS Video & AI ANPR] ({dur3:.1f}s)")
        # Click on the first camera feed
        cam_item = page.locator(".camera-item, div:has-text('Chimanbhai Bridge')").first
        if await cam_item.is_visible():
            await cam_item.click()
            await asyncio.sleep(2)
        
        # Hover over the live video player
        await page.mouse.move(550, 420)
        await asyncio.sleep(5)
        
        # Click or hover on "Scan Frame with AI" button if available
        scan_btn = page.locator("button:has-text('Scan'), button:has-text('ANPR')").first
        if await scan_btn.is_visible():
            await scan_btn.hover()
            await asyncio.sleep(2)
            await scan_btn.click()
            await asyncio.sleep(3)
        
        rem3 = max(1.0, dur3 - 12.0)
        await asyncio.sleep(rem3)

        # -------------------------------------------------------------
        # SEGMENT 4: Sub-Second Watchlist Matching & Siren Alerts
        # -------------------------------------------------------------
        dur4 = durations["seg4_hotlist_alerts"]
        print(f"\n[Recording Seg 4: Watchlist Alerts & Siren] ({dur4:.1f}s)")
        # Move mouse to the right alert sidebar
        await page.mouse.move(1600, 260)
        await asyncio.sleep(4)
        await page.mouse.move(1600, 420)
        await asyncio.sleep(4)
        
        # Click on an alert card or acknowledge button if present
        ack_btn = page.locator("button:has-text('Ack'), button:has-text('Acknowledge')").first
        if await ack_btn.is_visible():
            await ack_btn.hover()
            await asyncio.sleep(2)
            await ack_btn.click()
        
        rem4 = max(1.0, dur4 - 10.0)
        await asyncio.sleep(rem4)

        # -------------------------------------------------------------
        # SEGMENT 5: Chronological GIS Vehicle Trajectory
        # -------------------------------------------------------------
        dur5 = durations["seg5_trajectory_gis"]
        print(f"\n[Recording Seg 5: Trajectory & GIS Vehicle Tracking] ({dur5:.1f}s)")
        # Click on 'Trajectory & GIS' navbar tab
        try:
            traj_tab = page.locator("button:has-text('Trajectory'), button:has-text('GIS')").first
            if await traj_tab.is_visible():
                await traj_tab.click()
            else:
                await page.click("nav button:nth-child(2)")
        except Exception:
            pass
        await asyncio.sleep(3)
        
        # Focus on search input, type GJ01AB1234
        try:
            input_box = page.locator("input[type='text'], input[placeholder*='GJ']").first
            if await input_box.is_visible():
                await input_box.click()
                await page.keyboard.type("GJ01AB1234", delay=80)
                await asyncio.sleep(1)
                search_btn = page.locator("button:has-text('Search'), button:has-text('Track'), button[type='submit']").first
                if await search_btn.is_visible():
                    await search_btn.click()
        except Exception:
            pass
        await asyncio.sleep(4)
        
        # Hover over the GIS map and waypoints
        await page.mouse.move(1000, 480)
        await asyncio.sleep(4)
        await page.mouse.move(1150, 420)
        await asyncio.sleep(3)
        
        rem5 = max(1.0, dur5 - 15.0)
        await asyncio.sleep(rem5)

        # -------------------------------------------------------------
        # SEGMENT 6: CCTV Asset Registry & Infrastructure Gap Analysis
        # -------------------------------------------------------------
        dur6 = durations["seg6_registry_gap"]
        print(f"\n[Recording Seg 6: Asset Registry & Gap Analysis] ({dur6:.1f}s)")
        # Click on 'Registry & Gap Analysis' or 'Cameras'
        try:
            gap_tab = page.locator("button:has-text('Gap'), button:has-text('Registry'), button:has-text('Cameras')").first
            if await gap_tab.is_visible():
                await gap_tab.click()
            else:
                await page.click("nav button:nth-child(4)")
        except Exception:
            pass
        await asyncio.sleep(4)
        
        # Hover over gap analysis cards and camera inventory
        await page.mouse.move(600, 300)
        await asyncio.sleep(4)
        await page.mouse.wheel(0, 150)
        await asyncio.sleep(3)
        await page.mouse.wheel(0, -150)
        await asyncio.sleep(2)
        
        rem6 = max(1.0, dur6 - 13.0)
        await asyncio.sleep(rem6)

        # Finish and save
        await page.close()
        video_path = await page.video.path()
        await context.close()
        await browser.close()
        print(f"\nRaw screen video recorded: {video_path}")
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
        print(f"\nSUCCESS: Live Demonstration Video Created: {final_video} ({size_mb:.2f} MB)")
    return final_video

async def main():
    durations = await generate_precise_audio()
    raw_video = await record_screen(durations)
    await merge_precise_video(raw_video)

if __name__ == "__main__":
    asyncio.run(main())
