import React, { useState } from 'react';
import { Camera, Radio, Maximize2, RefreshCw } from 'lucide-react';

export default function CameraGrid({ cameras = [], recentDetections = [] }) {
  const [selectedCam, setSelectedCam] = useState(null);

  // Group latest detection by camera
  const latestDetectionByCam = {};
  recentDetections.forEach((d) => {
    if (!latestDetectionByCam[d.camera_id]) {
      latestDetectionByCam[d.camera_id] = d;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Grid of CCTV Feeds */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        overflowY: 'auto',
        flex: 1
      }}>
        {cameras.map((cam) => {
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
                background: '#0d1322'
              }}
            >
              {/* Camera Header Bar */}
              <div style={{
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="live-dot" />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#f3f4f6' }}>
                    {cam.name}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                  {cam.fps_processing} FPS
                </span>
              </div>

              {/* Video Player / Stream Display Box */}
              <div style={{
                position: 'relative',
                height: '160px',
                background: '#070b14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* Simulated CCTV Camera View Texture */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  opacity: 0.6
                }} />

                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <Camera size={32} color="#3b82f6" style={{ opacity: 0.6, marginBottom: '6px' }} />
                  <p style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                    LIVE RTSP INGEST
                  </p>
                  <p style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>
                    {cam.location_name}
                  </p>
                </div>

                {/* Live ANPR Detection Overlay Box */}
                {latestDet && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    background: latestDet.is_watchlist_match ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    zIndex: 2
                  }}>
                    <span className={`plate-badge ${latestDet.is_watchlist_match ? 'plate-badge-white' : ''}`} style={{ fontSize: '11px' }}>
                      {latestDet.plate_number}
                    </span>
                    <span style={{ fontSize: '10px', color: '#e2e8f0', fontWeight: '600' }}>
                      {(latestDet.confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Footer */}
              <div style={{
                padding: '6px 12px',
                background: 'rgba(0, 0, 0, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: 'var(--text-muted)'
              }}>
                <span>🏢 {cam.department}</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>● STREAM ACTIVE</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
