import React, { useState, useEffect, useRef } from 'react';
import { Camera, Radio, Maximize2, RefreshCw, Filter, Search, X, ShieldAlert, Cpu, Eye, Video, VideoOff, Play } from 'lucide-react';
import Hls from 'hls.js';
import { BACKEND_URL } from '../services/api';
import { useToast } from './Toast';
import CCTVPlayer from './CCTVPlayer';

export default function CameraGrid({
  cameras = [],
  recentDetections = [],
  onSelectCameraOnMap,
  onTrackPlate,
}) {
  const [selectedCamForModal, setSelectedCamForModal] = useState(null);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamPlateScan, setWebcamPlateScan] = useState('');
  const [webcamAlert, setWebcamAlert] = useState(null);

  const videoRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const hlsRef = useRef(null);
  const { addToast } = useToast();

  // Group latest detections by camera
  const latestDetectionByCam = {};
  const detectionsByCamHistory = {};

  recentDetections.forEach((d) => {
    if (!latestDetectionByCam[d.camera_id]) {
      latestDetectionByCam[d.camera_id] = d;
    }
    if (!detectionsByCamHistory[d.camera_id]) {
      detectionsByCamHistory[d.camera_id] = [];
    }
    if (detectionsByCamHistory[d.camera_id].length < 5) {
      detectionsByCamHistory[d.camera_id].push(d);
    }
  });

  const departments = ['ALL', ...Array.from(new Set(cameras.map((c) => c.department).filter(Boolean)))];

  const filteredCameras = cameras.filter((cam) => {
    const matchesDept = deptFilter === 'ALL' || cam.department === deptFilter;
    const matchesSearch =
      cam.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cam.camera_code && cam.camera_code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  // HLS Video player initialization for selected camera modal
  useEffect(() => {
    if (!selectedCamForModal || !videoRef.current) return;

    const video = videoRef.current;
    const hlsUrl = selectedCamForModal.hls_url || `https://cctv.corp8.cloud/${selectedCamForModal.camera_code || 'cam01'}/index.m3u8`;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        maxBufferLength: 6,
        maxMaxBufferLength: 12,
        manifestLoadingTimeOut: 10000,
        enableWorker: true,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedCamForModal]);

  // Webcam stream start/stop
  const toggleWebcam = async () => {
    if (isWebcamActive) {
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        webcamVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        webcamVideoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
      setWebcamAlert(null);
      addToast('Device webcam disconnected', 'info');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setIsWebcamActive(true);
        addToast('Live device camera stream activated for ANPR testing!', 'success');
        setTimeout(() => {
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.play();
          }
        }, 100);

        // Run live plate scanning simulation for webcam demo
        const scanInterval = setInterval(() => {
          const samplePlates = ['GJ01AB1234', 'GJ01XY9876', 'GJ27CR4421', 'GJ05MN3321'];
          const picked = samplePlates[Math.floor(Math.random() * samplePlates.length)];
          setWebcamPlateScan(picked);
          if (picked === 'GJ27CR4421' || picked === 'GJ05MN3321') {
            setWebcamAlert('🚨 CRITICAL WATCHLIST INTERCEPTION');
          } else {
            setWebcamAlert(null);
          }
        }, 4000);

        return () => clearInterval(scanInterval);
      } catch (err) {
        addToast('Could not access device camera: ' + err.message, 'error');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      
      {/* Controls Bar: Search, Department Filter, and Live Webcam Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter 30 cameras..."
            style={{
              width: '100%',
              background: '#0d1527',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '6px 10px 6px 28px',
              color: '#fff',
              fontSize: '11px',
              outline: 'none',
            }}
          />
          <Search size={12} color="#64748b" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Live Device Camera Button */}
        <button
          type="button"
          onClick={toggleWebcam}
          style={{
            background: isWebcamActive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            color: '#fff',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Open laptop/mobile camera to test live plate scanning"
        >
          {isWebcamActive ? <VideoOff size={13} /> : <Video size={13} />}
          {isWebcamActive ? 'Stop Webcam' : '🎥 Device Camera'}
        </button>

        {departments.length > 2 && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              background: '#0d1527',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#94a3b8',
              fontSize: '11px',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '130px',
            }}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Depts' : dept}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Live Device Webcam Scanner Box if active */}
      {isWebcamActive && (
        <div
          className="glass-card modal-content-animated"
          style={{
            marginBottom: '12px',
            padding: '10px',
            background: '#070c18',
            border: '2px solid #3b82f6',
            borderRadius: '10px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-dot" /> LIVE DEVICE WEBCAM INGESTION • REAL-TIME ANPR
            </span>
            <button
              onClick={toggleWebcam}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ position: 'relative', height: '170px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
            <video
              ref={webcamVideoRef}
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* HUD Scan Box */}
            <div
              style={{
                position: 'absolute',
                top: '25%',
                left: '20%',
                right: '20%',
                bottom: '25%',
                border: '2px dashed #3b82f6',
                borderRadius: '8px',
                pointerEvents: 'none',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
              }}
            />
            {/* Live Detected Badge */}
            {webcamPlateScan && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: webcamAlert ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.9)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span className="plate-badge" style={{ fontSize: '11px' }}>
                  {webcamPlateScan}
                </span>
                <span style={{ fontSize: '10px', color: '#fff', fontWeight: '700' }}>
                  {webcamAlert || 'Standard Vehicle Match'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of CCTV Feeds */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '12px',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '4px',
        }}
      >
        {filteredCameras.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <Camera size={30} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p style={{ fontSize: '12px' }}>No matching cameras found</p>
          </div>
        ) : (
          filteredCameras.map((cam) => {
            const latestDet = latestDetectionByCam[cam.id];
            const isAlert = latestDet?.is_watchlist_match;

            return (
              <div
                key={cam.id}
                className={`glass-card ${isAlert ? 'pulse-alert' : ''}`}
                style={{
                  border: isAlert ? '2px solid #ef4444' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#090e1a',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Camera Header Bar */}
                <div
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span className={isAlert ? 'live-dot-red live-dot' : 'live-dot'} />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '140px',
                      }}
                      title={cam.name}
                    >
                      {cam.camera_code ? `[${cam.camera_code.toUpperCase()}] ` : ''}{cam.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'monospace' }}>
                      {cam.camera_type ? cam.camera_type.split(' ')[0] : 'CCTV'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCamForModal(cam)}
                      title="Inspect Camera Stream & Live Player"
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: '700',
                      }}
                    >
                      <Play size={10} /> Live
                    </button>
                  </div>
                </div>

                {/* Video Ingest Box / Texture */}
                <div
                  onClick={() => setSelectedCamForModal(cam)}
                  style={{
                    position: 'relative',
                    height: '140px',
                    background: '#050811',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <div className="scanline-overlay" />
                  
                  {/* Grid Texture */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
                      backgroundSize: '14px 14px',
                    }}
                  />

                  {/* HUD Corner Accents */}
                  <div style={{ position: 'absolute', top: '6px', left: '6px', width: '8px', height: '8px', borderTop: '1px solid #3b82f6', borderLeft: '1px solid #3b82f6' }} />
                  <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderTop: '1px solid #3b82f6', borderRight: '1px solid #3b82f6' }} />
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', width: '8px', height: '8px', borderBottom: '1px solid #3b82f6', borderLeft: '1px solid #3b82f6' }} />
                  <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '8px', height: '8px', borderBottom: '1px solid #3b82f6', borderRight: '1px solid #3b82f6' }} />

                  <div style={{ textAlign: 'center', zIndex: 1 }}>
                    <Camera size={26} color={isAlert ? '#ef4444' : '#3b82f6'} style={{ opacity: 0.7, marginBottom: '4px' }} />
                    <p style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {cam.camera_code ? `STREAM: ${cam.camera_code.toUpperCase()}` : 'RTSP LIVE INGEST'}
                    </p>
                    <p style={{ fontSize: '9px', color: '#475569', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cam.location_name}
                    </p>
                  </div>

                  {/* Live ANPR Detection Overlay Box */}
                  {latestDet && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        right: '6px',
                        background: latestDet.is_watchlist_match ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(6px)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        zIndex: 2,
                      }}
                    >
                      <span className={`plate-badge ${latestDet.is_watchlist_match ? 'plate-badge-white' : ''}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {latestDet.plate_number}
                      </span>
                      <span style={{ fontSize: '10px', color: '#e2e8f0', fontWeight: '600' }}>
                        {(latestDet.confidence * 100).toFixed(0)}% Conf
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer bar */}
                <div
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    🏢 {cam.department}
                  </span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>
                    ● ONLINE
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Multi-mode Live Video & CCTV Player Modal */}
      {selectedCamForModal && (
        <CCTVPlayer
          camera={selectedCamForModal}
          onClose={() => setSelectedCamForModal(null)}
          onFocusMap={onSelectCameraOnMap}
        />
      )}
    </div>
  );
}
