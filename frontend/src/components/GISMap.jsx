import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BACKEND_URL } from '../services/api';
import { Layers, Maximize, RotateCcw, Eye, ShieldAlert, Navigation, X } from 'lucide-react';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (isAlert, name) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${isAlert ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 16px ${isAlert ? 'rgba(239, 68, 68, 0.95)' : 'rgba(37, 99, 235, 0.75)'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        ${isAlert ? 'animation: radar-pulse 1.6s infinite;' : ''}
      ">
        📹
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

const createWaypointIcon = (index, total) => {
  const isStart = index === 0;
  const isEnd = index === total - 1;
  const color = isEnd ? '#ef4444' : isStart ? '#10b981' : '#f59e0b';
  return L.divIcon({
    className: 'waypoint-pin',
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 900;
        box-shadow: 0 4px 14px rgba(0,0,0,0.65);
        font-family: 'Inter', sans-serif;
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapController({ onFitBounds, cameras, activeRoute }) {
  const map = useMap();

  useEffect(() => {
    if (activeRoute && activeRoute.waypoints?.length > 1) {
      const bounds = activeRoute.waypoints.map((wp) => [wp.latitude, wp.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activeRoute, map]);

  return null;
}

export default function GISMap({
  cameras = [],
  activeRoute = null,
  selectedCamera = null,
  onSelectCamera,
  onTrackPlate,
}) {
  const defaultCenter = [23.03, 72.58]; // Ahmedabad Center
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'voyager' | 'osm'
  const [showCoverageCircles, setShowCoverageCircles] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);

  const tileUrls = {
    dark: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    voyager: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  useEffect(() => {
    if (selectedCamera) {
      setCenter([selectedCamera.latitude, selectedCamera.longitude]);
      setZoom(15);
    } else if (activeRoute && activeRoute.waypoints?.length > 0) {
      const firstWp = activeRoute.waypoints[0];
      setCenter([firstWp.latitude, firstWp.longitude]);
      setZoom(13);
    }
  }, [selectedCamera, activeRoute]);

  const polylineCoords = activeRoute?.waypoints
    ? activeRoute.waypoints.map((wp) => [wp.latitude, wp.longitude])
    : [];

  const handleResetView = () => {
    setCenter(defaultCenter);
    setZoom(12);
  };

  return (
    <div
      style={{
        height: '100%',
        minHeight: '440px',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <ChangeView center={center} zoom={zoom} />
        <MapController cameras={cameras} activeRoute={activeRoute} />

        <TileLayer url={tileUrls[mapStyle]} maxZoom={19} />

        {/* Coverage Radius Layers (Model 1 Compliance) */}
        {showCoverageCircles && cameras.map((cam) => (
          <Circle
            key={`cov-${cam.id}`}
            center={[cam.latitude, cam.longitude]}
            radius={cam.coverage_radius_meters || 180}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.12,
              weight: 1,
              dashArray: '3, 4',
            }}
          />
        ))}

        {/* Cameras */}
        {cameras.map((cam) => (
          <Marker
            key={cam.id}
            position={[cam.latitude, cam.longitude]}
            icon={createCustomIcon(cam.hasAlert, cam.name)}
            eventHandlers={{ click: () => onSelectCamera && onSelectCamera(cam) }}
          >
            <Popup>
              <div style={{ padding: '6px 4px', minWidth: '220px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#60a5fa', marginBottom: '4px' }}>
                  📹 {cam.camera_code ? `[${cam.camera_code.toUpperCase()}] ` : ''}{cam.name}
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0' }}>📍 {cam.location_name}</p>
                <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '2px 0' }}>🏢 {cam.department}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '1px 5px', borderRadius: '3px' }}>
                    {cam.camera_type || 'Fixed Bullet'}
                  </span>
                  <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '1px 5px', borderRadius: '3px' }}>
                    Coverage: {cam.coverage_radius_meters || 150}m
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>● {cam.status}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{cam.fps_processing} FPS</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Trajectory Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#ef4444',
              weight: 5,
              dashArray: '10, 8',
              opacity: 0.95,
            }}
          />
        )}

        {/* Checkpoint Pins with Evidentiary Image Popups */}
        {activeRoute?.waypoints?.map((wp, idx) => (
          <Marker
            key={`wp-${idx}`}
            position={[wp.latitude, wp.longitude]}
            icon={createWaypointIcon(idx, activeRoute.waypoints.length)}
          >
            <Popup>
              <div style={{ padding: '6px 4px', minWidth: '230px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="plate-badge" style={{ fontSize: '11px' }}>
                    {activeRoute.plate_number}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#f59e0b' }}>
                    Step #{idx + 1}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '700', margin: '2px 0' }}>
                  {wp.camera_name}
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                  ⏱️ {new Date(wp.detected_at).toLocaleTimeString('en-IN')}
                </p>

                {wp.estimated_speed_kmh && (
                  <p style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', marginTop: '3px' }}>
                    ⚡ Est. Speed: ~{wp.estimated_speed_kmh} km/h
                  </p>
                )}

                {/* Evidence Snapshot Photo */}
                {wp.snapshot_url && (
                  <div
                    style={{
                      marginTop: '8px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid #374151',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={() => setZoomedImage(`${BACKEND_URL}${wp.snapshot_url}`)}
                  >
                    <img
                      src={`${BACKEND_URL}${wp.snapshot_url}`}
                      alt="Plate Snapshot"
                      style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Eye size={10} /> Click to zoom
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Tactical Map Controls Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '4px 6px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <button
          type="button"
          onClick={() => setMapStyle(mapStyle === 'dark' ? 'voyager' : mapStyle === 'voyager' ? 'osm' : 'dark')}
          title="Switch Map Theme"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Layers size={13} color="#60a5fa" />
          <span style={{ textTransform: 'capitalize' }}>{mapStyle}</span>
        </button>

        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '2px 0' }} />

        <button
          type="button"
          onClick={() => setShowCoverageCircles(!showCoverageCircles)}
          title="Toggle Surveillance Coverage Cones"
          style={{
            background: showCoverageCircles ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: 'none',
            color: showCoverageCircles ? '#60a5fa' : '#94a3b8',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>📡 Cones: {showCoverageCircles ? 'ON' : 'OFF'}</span>
        </button>

        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '2px 0' }} />

        <button
          type="button"
          onClick={handleResetView}
          title="Reset View to Gujarat"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Trajectory Banner Overlay if active */}
      {activeRoute && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="plate-badge" style={{ fontSize: '12px' }}>
              {activeRoute.plate_number}
            </span>
            <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '600' }}>
              {activeRoute.waypoints?.length || 0} Checkpoints Mapped
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {activeRoute.last_seen && (
              <span>Last detected: {new Date(activeRoute.last_seen).toLocaleTimeString('en-IN')}</span>
            )}
          </div>
        </div>
      )}

      {/* Snapshot Zoom Modal */}
      {zoomedImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
            padding: '20px',
          }}
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="modal-content-animated"
            style={{
              maxWidth: '800px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #334155',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '12px 16px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Evidentiary CCTV Image Capture
              </span>
              <button
                onClick={() => setZoomedImage(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#090e17' }}>
              <img
                src={zoomedImage}
                alt="Zoomed Plate Evidence"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '6px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
