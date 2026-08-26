import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (isAlert) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: ${isAlert ? '#ef4444' : '#3b82f6'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 0 14px ${isAlert ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.7)'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        ${isAlert ? 'animation: radar-pulse 1.5s infinite;' : ''}
      ">
        📹
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
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
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 800;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function GISMap({ cameras = [], activeRoute = null, selectedCamera = null, onSelectCamera }) {
  const defaultCenter = [23.05, 72.56];
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

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

  return (
    <div style={{ height: '100%', minHeight: '480px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Cameras */}
        {cameras.map((cam) => (
          <Marker
            key={cam.id}
            position={[cam.latitude, cam.longitude]}
            icon={createCustomIcon(cam.hasAlert)}
            eventHandlers={{ click: () => onSelectCamera && onSelectCamera(cam) }}
          >
            <Popup>
              <div style={{ padding: '6px', minWidth: '180px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
                  📹 {cam.name}
                </div>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0' }}>📍 {cam.location_name}</p>
                <p style={{ fontSize: '11px', color: '#d1d5db', margin: '2px 0' }}>🏢 {cam.department}</p>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600' }}>● {cam.status}</span>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>{cam.fps_processing} FPS</span>
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
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.9,
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
              <div style={{ padding: '6px', minWidth: '220px' }}>
                <span className="plate-badge" style={{ marginBottom: '6px' }}>
                  {activeRoute.plate_number}
                </span>
                <p style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '700' }}>
                  Checkpoint #{idx + 1}: {wp.camera_name}
                </p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  ⏱️ {new Date(wp.detected_at).toLocaleTimeString('en-IN')}
                </p>
                {wp.estimated_speed_kmh && (
                  <p style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', marginTop: '2px' }}>
                    ⚡ Est. Speed: ~{wp.estimated_speed_kmh} km/h
                  </p>
                )}

                {/* Evidence Snapshot Photo */}
                {wp.snapshot_url && (
                  <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #374151' }}>
                    <img
                      src={`http://localhost:8000${wp.snapshot_url}`}
                      alt="Plate Snapshot"
                      style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
