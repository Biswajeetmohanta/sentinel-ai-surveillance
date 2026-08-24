import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, AlertCircle, Navigation } from 'lucide-react';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Camera Marker Icons
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
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
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
  // Default map center: Ahmedabad & Gandhinagar Region
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
        
        {/* Dark Matter CartoDB Open-Source Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Render CCTV Camera Markers */}
        {cameras.map((cam) => {
          const isAlert = cam.hasAlert || false;
          return (
            <Marker
              key={cam.id}
              position={[cam.latitude, cam.longitude]}
              icon={createCustomIcon(isAlert)}
              eventHandlers={{
                click: () => onSelectCamera && onSelectCamera(cam),
              }}
            >
              <Popup>
                <div style={{ padding: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#60a5fa' }}>{cam.name}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0' }}>📍 {cam.location_name}</p>
                  <p style={{ fontSize: '11px', color: '#d1d5db', margin: '2px 0' }}>🏢 {cam.department}</p>
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600' }}>● {cam.status}</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>{cam.fps_processing} FPS</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Historical Trajectory Polyline */}
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

        {/* Render Trajectory Waypoint Pins */}
        {activeRoute?.waypoints?.map((wp, idx) => (
          <Marker
            key={`wp-${idx}`}
            position={[wp.latitude, wp.longitude]}
            icon={createWaypointIcon(idx, activeRoute.waypoints.length)}
          >
            <Popup>
              <div style={{ padding: '6px' }}>
                <span className="plate-badge" style={{ marginBottom: '6px' }}>
                  {activeRoute.plate_number}
                </span>
                <p style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '600' }}>
                  Checkpoint #{idx + 1}: {wp.camera_name}
                </p>
                <p style={{ fontSize: '10px', color: '#9ca3af' }}>
                  ⏱️ {new Date(wp.detected_at).toLocaleTimeString('en-IN')}
                </p>
                {wp.estimated_speed_kmh && (
                  <p style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>
                    ⚡ Speed: ~{wp.estimated_speed_kmh} km/h
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '14px',
          fontSize: '11px',
          color: '#d1d5db',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />
          Active Camera
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
          Suspect Spotted
        </div>
        {activeRoute && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '2px', background: '#ef4444', display: 'inline-block' }} />
            Vehicle Trajectory
          </div>
        )}
      </div>
    </div>
  );
}
