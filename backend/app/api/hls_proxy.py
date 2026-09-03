import logging
import httpx
from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hls", tags=["HLS Stream Proxy"])

BASE_URL = "https://cctv.corp8.cloud"
LOGIN_DATA = {
    "email": "jyoti@deventtechnology.com",
    "password": "CBUB-226S-HMZ9"
}
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://cctv.corp8.cloud/"
}

class HLSSessionManager:
    def __init__(self):
        self.client = httpx.AsyncClient(headers=HEADERS, timeout=10.0, follow_redirects=True)
        self.logged_in = False
        self.cached_key = None

    async def ensure_login(self):
        if not self.logged_in:
            try:
                res = await self.client.post(f"{BASE_URL}/auth/login", data=LOGIN_DATA)
                if res.status_code in [200, 302]:
                    self.logged_in = True
                    logger.info("HLS Proxy: Logged in successfully to sandbox grid.")
                else:
                    logger.warning(f"HLS Proxy login returned status: {res.status_code}")
            except Exception as e:
                logger.error(f"HLS Proxy login error: {e}")

session_mgr = HLSSessionManager()

@router.get("/{camera_code}/index.m3u8")
async def get_hls_manifest(camera_code: str):
    """
    Reverse-proxy camera HLS manifest.
    Provides full CORS and browser hardware decoding capability.
    """
    await session_mgr.ensure_login()
    cid = camera_code.lower()
    if not cid.startswith("cam"):
        cid = f"cam{cid.zfill(2)}"

    url = f"{BASE_URL}/{cid}/index.m3u8"
    try:
        res = await session_mgr.client.get(url)
        if res.status_code == 403:
            session_mgr.logged_in = False
            await session_mgr.ensure_login()
            res = await session_mgr.client.get(url)

        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"Camera manifest unavailable: {res.status_code}")

        # Rewrite URI="/enc.key" to relative URI="enc.key"
        manifest_text = res.text.replace('URI="/enc.key"', 'URI="enc.key"')

        return Response(
            content=manifest_text,
            media_type="application/vnd.apple.mpegurl",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to proxy manifest for {cid}: {e}")
        raise HTTPException(status_code=502, detail="Gateway error loading stream")

@router.get("/{camera_code}/enc.key")
@router.get("/enc.key")
async def get_encryption_key(camera_code: str = "cam01"):
    """
    Reverse-proxy AES-128 decryption key for Hls.js decryption.
    """
    await session_mgr.ensure_login()
    if session_mgr.cached_key:
        return Response(
            content=session_mgr.cached_key,
            media_type="application/octet-stream",
            headers={"Access-Control-Allow-Origin": "*"}
        )

    try:
        res = await session_mgr.client.get(f"{BASE_URL}/enc.key")
        if res.status_code == 200:
            session_mgr.cached_key = res.content
            return Response(
                content=res.content,
                media_type="application/octet-stream",
                headers={"Access-Control-Allow-Origin": "*"}
            )
        raise HTTPException(status_code=res.status_code, detail="Key fetch error")
    except Exception as e:
        logger.error(f"Failed to fetch enc.key: {e}")
        raise HTTPException(status_code=502, detail="Key fetch failed")

@router.get("/{camera_code}/{segment}")
async def get_hls_segment(camera_code: str, segment: str):
    """
    Stream individual .ts video segments with full byte caching and CORS.
    """
    if segment == "enc.key":
        return await get_encryption_key(camera_code)

    await session_mgr.ensure_login()
    cid = camera_code.lower()
    if not cid.startswith("cam"):
        cid = f"cam{cid.zfill(2)}"

    url = f"{BASE_URL}/{cid}/{segment}"
    try:
        req = session_mgr.client.build_request("GET", url)
        r = await session_mgr.client.send(req, stream=True)
        
        if r.status_code != 200:
            await r.aclose()
            raise HTTPException(status_code=r.status_code, detail="Segment fetch failed")

        async def stream_content():
            try:
                async for chunk in r.aiter_bytes(chunk_size=32768):
                    yield chunk
            finally:
                await r.aclose()

        return StreamingResponse(
            stream_content(),
            media_type="video/MP2T",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stream segment {segment}: {e}")
        raise HTTPException(status_code=502, detail="Error streaming segment")
