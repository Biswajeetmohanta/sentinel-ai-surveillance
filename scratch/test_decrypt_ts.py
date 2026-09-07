import asyncio
import os
import sys
import tempfile
import cv2
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

sys.path.insert(0, r"d:\sentinel-ai-surveillance\backend")
from app.api.hls_proxy import session_mgr, BASE_URL

async def test():
    await session_mgr.ensure_login()
    print("Logged in successfully.")
    
    # 1. Fetch encryption key
    key_res = await session_mgr.client.get(f"{BASE_URL}/enc.key")
    key = key_res.content
    print(f"Fetched key: {len(key)} bytes (hex: {key.hex()})")

    # 2. Fetch segment 0 from cam01
    seg_res = await session_mgr.client.get(f"{BASE_URL}/cam01/seg00000.ts")
    encrypted_ts = seg_res.content
    print(f"Fetched encrypted ts: {len(encrypted_ts)} bytes")

    # 3. Decrypt with AES-128-CBC
    iv = b"\x00" * 16
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    decrypted_ts = decryptor.update(encrypted_ts) + decryptor.finalize()
    print(f"Decrypted ts: {len(decrypted_ts)} bytes")

    # 4. Open with OpenCV
    tmp = os.path.join(tempfile.gettempdir(), "test_decrypted.ts")
    with open(tmp, "wb") as f:
        f.write(decrypted_ts)

    cap = cv2.VideoCapture(tmp)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"OpenCV opened TS: {cap.isOpened()}, Total frames: {total_frames}")

    ret, frame = cap.read()
    print(f"Read first frame: {ret}, shape: {frame.shape if ret else None}")
    cap.release()
    try:
        os.remove(tmp)
    except:
        pass

asyncio.run(test())
