import asyncio
import os
import sys

sys.path.insert(0, r"d:\sentinel-ai-surveillance\backend")
from app.api.hls_proxy import session_mgr, BASE_URL

async def test():
    await session_mgr.ensure_login()
    print("Logged in:", session_mgr.logged_in)
    res = await session_mgr.client.get(f"{BASE_URL}/cam01/index.m3u8")
    print("M3U8 fetch:", res.status_code, "Length:", len(res.text))
    lines = [line.strip() for line in res.text.split("\n") if line.strip().endswith(".ts")]
    print("Total segments:", len(lines), "Sample segment:", lines[0] if lines else None)

asyncio.run(test())
