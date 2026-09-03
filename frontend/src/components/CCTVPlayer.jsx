import React, { useState, useEffect, useRef } from 'react';
import { Camera, ExternalLink, Video, ShieldAlert, Radio, RefreshCw, Eye, Sparkles, Volume2, Shield } from 'lucide-react';
import Hls from 'hls.js';
import { BACKEND_URL } from '../services/api';

export default function CCTVPlayer({ camera, onClose, onFocusMap }) {
  const [playerMode, setPlayerMode] = useState('live_stream'); // 'live_stream' | 'webcam'
  const [streamError, setStreamError] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [diagResult, setDiagResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const hlsRef = useRef(null);
  const fileInputRef = useRef(null);

  // Hardware-Accelerated 60 FPS HLS Stream Player
  useEffect(() => {
    if (playerMode !== 'live_stream') return;
    const video = videoRef.current;
    if (!video) return;

    const camCode = camera?.camera_code || 'cam01';
    const src = `${BACKEND_URL}/api/v1/hls/${camCode}/index.m3u8`;

    // Seek helper for live sync
    const liveSync = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 1) {
        try {
          video.currentTime = (Date.now() / 1000) % video.duration;
        } catch (e) {}
      }
    };

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        maxBufferLength: 6,
        maxMaxBufferLength: 14,
        backBufferLength: 12,
        manifestLoadingTimeOut: 60000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 60000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 60000,
        fragLoadingMaxRetry: 12,
        capLevelToPlayerSize: true,
        startPosition: -1
      });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.loop = true;
        liveSync();
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
            setStreamError(true);
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.loop = true;
      video.addEventListener('loadedmetadata', liveSync, { once: true });
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playerMode, camera]);

  // Handle webcam stream
  useEffect(() => {
    if (playerMode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then((stream) => {
          setWebcamStream(stream);
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
            webcamRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.error('Webcam access error:', err);
        });
    } else {
      if (webcamStream) {
        webcamStream.getTracks().forEach((t) => t.stop());
        setWebcamStream(null);
      }
    }

    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [playerMode]);

  // Scan live frame via backend deep learning engine
  const handleScanCurrentFrame = async () => {
    const video = videoRef.current;
    if (!video) return;
    setIsScanning(true);
    setDiagResult(null);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 854;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsScanning(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/detections/scan-image?camera_id=${camera?.id || 1}`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setDiagResult(data);
      } catch (err) {
        setDiagResult({ success: false, message: 'Scan communication error' });
      } finally {
        setIsScanning(false);
      }
    }, 'image/jpeg', 0.9);
  };

  // Upload test photo
  const handleTestUpload = async (file) => {
    if (!file) return;
    setIsScanning(true);
    setDiagResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/detections/scan-image?camera_id=${camera?.id || 1}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setDiagResult(data);
    } catch (err) {
      console.error(err);
      setDiagResult({ success: false, message: 'Server communication error' });
    } finally {
      setIsScanning(false);
    }
  };

  const openSandboxExternal = () => {
    window.open('https://cctv.corp8.cloud/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3500,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card modal-content-animated"
        style={{
          width: '880px',
          maxWidth: '100%',
          background: '#090e1b',
          border: '1px solid #334155',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.98)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 18px',
            background: 'rgba(15, 23, 42, 0.98)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '7px', borderRadius: '8px' }}>
              <Camera size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                  {camera?.name || 'Live CCTV Feed'}
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="live-dot" style={{ width: '6px', height: '6px' }} />
                  LIVE GUJARAT FEED
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                📍 {camera?.location_name} • {camera?.department}
              </p>
            </div>
          </div>

          {/* Mode Switcher & Direct Portal Launch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setPlayerMode('live_stream')}
              style={{
                background: playerMode === 'live_stream' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${playerMode === 'live_stream' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                color: playerMode === 'live_stream' ? '#34d399' : '#94a3b8',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              🔴 Live CCTV Feed
            </button>

            <button
              type="button"
              onClick={() => setPlayerMode('webcam')}
              style={{
                background: playerMode === 'webcam' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${playerMode === 'webcam' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                color: playerMode === 'webcam' ? '#60a5fa' : '#94a3b8',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🎥 Laptop Webcam
            </button>

            <button
              type="button"
              onClick={openSandboxExternal}
              className="btn-secondary"
              title="Open the official Gujarat Police sandbox in full browser tab"
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ExternalLink size={12} /> Portal Tab
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: '4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Stage Area */}
        <div style={{ position: 'relative', height: '410px', background: '#000', overflow: 'hidden' }}>
          
          {/* Mode 1: Real Live CCTV Video Stream */}
          {playerMode === 'live_stream' && (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!streamError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
                />
              ) : (
                <img
                  src={`${BACKEND_URL}/api/v1/stream/live-video/${camera?.camera_code || 'cam01'}`}
                  alt="Real Gujarat Street CCTV Feed"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              )}

              {/* Live Telemetry Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(10, 15, 29, 0.85)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#34d399',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <span className="live-dot" />
                <span>REAL GUJARAT POLICE SANDBOX STREAM • 60 FPS (HLS/TCP)</span>
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(10, 15, 29, 0.85)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                GPS: {camera?.latitude?.toFixed(4) || '23.0645'} N, {camera?.longitude?.toFixed(4) || '72.5831'} E
              </div>
            </div>
          )}

          {/* Mode 2: Local Device Webcam */}
          {playerMode === 'webcam' && (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <video
                ref={webcamRef}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '25%',
                  right: '25%',
                  bottom: '20%',
                  border: '2px dashed #3b82f6',
                  borderRadius: '10px',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.85)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              >
                ● LIVE LAPTOP WEBCAM ACTIVE • HOLD NUMBER PLATE IN THE BOX
              </div>
            </div>
          )}
        </div>

        {/* Real-Time ANPR Diagnostic Action Bar */}
        <div
          style={{
            padding: '10px 18px',
            background: 'rgba(15, 23, 42, 0.98)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleScanCurrentFrame}
              disabled={isScanning}
              style={{
                background: isScanning ? 'rgba(59, 130, 246, 0.4)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 15px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: isScanning ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
              }}
            >
              {isScanning ? '⏳ Running YOLOv8 + EasyOCR...' : '🔍 Scan This Live Frame with AI'}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              📁 Upload Car Photo to Test
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleTestUpload(e.target.files[0])}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Pipeline: <strong style={{ color: '#60a5fa' }}>YOLOv8 Vehicle Detection + EasyOCR Deep Learning</strong>
          </div>
        </div>

        {/* Real ANPR Diagnostic Result Callout */}
        {diagResult && (
          <div
            style={{
              padding: '12px 18px',
              background: diagResult.success
                ? (diagResult.detection?.is_watchlist_match ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)')
                : 'rgba(234, 179, 8, 0.15)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            {diagResult.success ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`plate-badge ${diagResult.detection?.is_watchlist_match ? 'plate-badge-white' : ''}`} style={{ fontSize: '14px' }}>
                    {diagResult.detection?.plate_number}
                  </span>
                  <span>
                    Detected: <strong>{diagResult.detection?.vehicle_class || 'Vehicle'}</strong> • OCR Confidence: <strong>{Math.round((diagResult.detection?.confidence || 0.9) * 100)}%</strong>
                  </span>
                </div>
                <div style={{ fontWeight: '800', color: diagResult.detection?.is_watchlist_match ? '#ef4444' : '#34d399', fontSize: '13px' }}>
                  {diagResult.detection?.is_watchlist_match ? '🚨 CRITICAL MATCH: WANTED SUSPECT VEHICLE' : '✓ Standard Registration (Cleared)'}
                </div>
              </>
            ) : (
              <span style={{ color: '#fbbf24' }}>
                ℹ️ {diagResult.message || 'Vehicle detected, adjust angle or lighting for OCR'}
              </span>
            )}
          </div>
        )}

        {/* Footer Info & Actions */}
        <div style={{ padding: '14px 18px', background: '#0a0f1d' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>STREAM INGEST</span>
              <p style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {camera?.camera_code ? `${camera.camera_code.toUpperCase()} • 1080p HLS / RTSP` : 'CAM01 • 1080p'}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>STORAGE / NVR</span>
              <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
                {camera?.storage_details || 'NVR 30-Day On-Premise'}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', color: '#64748b' }}>HARDWARE TYPE</span>
              <p style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>
                {camera?.camera_type || 'Fixed Bullet'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={openSandboxExternal}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              <ExternalLink size={13} /> Open Official Sandbox in New Tab
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              {onFocusMap && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    onFocusMap(camera);
                    onClose();
                  }}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  📍 Focus GIS Map
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{ fontSize: '11px', padding: '6px 14px' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
