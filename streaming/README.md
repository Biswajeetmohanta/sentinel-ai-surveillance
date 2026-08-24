# 📡 MediaMTX Streaming Aggregator

MediaMTX is an ultra-fast, zero-dependency, open-source video streaming server that ingests RTSP streams from multi-vendor CCTV cameras and transforms them into low-latency **WebRTC / HLS** for browser display.

## Download & Run Instructions

1. Download the latest binary for your operating system from:
   👉 **https://github.com/bluenviron/mediamtx/releases**

2. Place the extracted `mediamtx` (or `mediamtx.exe` on Windows) executable in this `streaming/` folder.

3. Start MediaMTX with the provided configuration:
   ```bash
   # On Windows:
   .\mediamtx.exe mediamtx.yml

   # On Linux:
   ./mediamtx mediamtx.yml
   ```

4. MediaMTX will now listen on:
   - **RTSP Ingest:** `rtsp://localhost:8554/<camera_stream_name>`
   - **WebRTC Browser Playback:** `http://localhost:8889/<camera_stream_name>`
   - **HLS Playback:** `http://localhost:8888/<camera_stream_name>`
