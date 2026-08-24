import React, { useState } from 'react';
import { Search, MapPin, Clock, Gauge, ShieldAlert, History, Navigation } from 'lucide-react';
import { fetchVehicleTrajectory } from '../services/api';
import GISMap from './GISMap';

export default function TrajectorySearch({ initialPlate = '', cameras = [] }) {
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState(48);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!plateInput.trim()) return;

    setIsLoading(true);
    try {
      const data = await fetchVehicleTrajectory(plateInput.trim(), hours);
      setTrajectoryData(data);
    } catch (err) {
      console.error('Error fetching trajectory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', height: 'calc(100vh - 160px)' }}>
      
      {/* Left Column: Search Form & Timeline */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Navigation size={22} color="#3b82f6" />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            Vehicle Route Reconstruction
          </h2>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              INDIAN NUMBER PLATE
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="e.g. GJ01AB1234"
                style={{
                  flex: 1,
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Search size={16} />
                {isLoading ? '...' : 'Track'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scan History:</span>
            {[24, 48, 72].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: hours === h ? '1px solid #3b82f6' : '1px solid #374151',
                  background: hours === h ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: hours === h ? '#60a5fa' : '#9ca3af',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Last {h}h
              </button>
            ))}
          </div>
        </form>

        {/* Search Results Summary */}
        {trajectoryData && (
          <div style={{
            background: trajectoryData.is_hotlisted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.5)',
            border: trajectoryData.is_hotlisted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #334155',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="plate-badge" style={{ fontSize: '14px' }}>
                {trajectoryData.plate_number}
              </span>
              {trajectoryData.is_hotlisted ? (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                  🚨 SUSPECT HOTLIST
                </span>
              ) : (
                <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
                  Standard Vehicle
                </span>
              )}
            </div>

            {trajectoryData.hotlist_info && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#fca5a5' }}>
                <div><strong>Crime:</strong> {trajectoryData.hotlist_info.crime_category}</div>
                <div><strong>FIR:</strong> {trajectoryData.hotlist_info.fir_number}</div>
                <div><strong>PS:</strong> {trajectoryData.hotlist_info.police_station}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#9ca3af' }}>
              <span>Checkpoints: <strong>{trajectoryData.total_detections}</strong></span>
              {trajectoryData.waypoints.length > 0 && (
                <span>Duration: <strong>{new Date(trajectoryData.last_seen).toLocaleDateString('en-IN')}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Waypoints Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Chronological Trajectory Logs
          </h3>

          {!trajectoryData || trajectoryData.waypoints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <History size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '12px' }}>Enter a vehicle number above to reconstruct its movement path across Gujarat Police CCTV network.</p>
            </div>
          ) : (
            trajectoryData.waypoints.map((wp, idx) => (
              <div
                key={wp.detection_id || idx}
                style={{
                  background: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  position: 'relative',
                  borderLeft: `4px solid ${idx === trajectoryData.waypoints.length - 1 ? '#ef4444' : '#3b82f6'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#f3f4f6' }}>
                    #{idx + 1} {wp.camera_name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {new Date(wp.detected_at).toLocaleTimeString('en-IN')}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  📍 {wp.location_name}
                </div>
                {wp.estimated_speed_kmh && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>
                    <Gauge size={12} />
                    <span>Est. Speed: {wp.estimated_speed_kmh} km/h</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Right Column: Interactive GIS Map View */}
      <div className="glass-card" style={{ padding: '12px', height: '100%' }}>
        <GISMap cameras={cameras} activeRoute={trajectoryData} />
      </div>

    </div>
  );
}
