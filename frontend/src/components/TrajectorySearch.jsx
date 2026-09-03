import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Gauge, ShieldAlert, History, Navigation, Eye, Play, Pause, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchVehicleTrajectory, BACKEND_URL } from '../services/api';
import GISMap from './GISMap';

export default function TrajectorySearch({ initialPlate = '', cameras = [] }) {
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState(48);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const samplePlates = ['GJ01AB1234', 'GJ05CD5678', 'MH12DE3344', 'DL01EF9988'];

  useEffect(() => {
    if (initialPlate) {
      setPlateInput(initialPlate);
      executeSearch(initialPlate, hours);
    }
  }, [initialPlate]);

  // Route playback timer
  useEffect(() => {
    let timer;
    if (isPlaying && trajectoryData?.waypoints?.length > 0) {
      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= trajectoryData.waypoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, trajectoryData]);

  const executeSearch = async (plate, h) => {
    if (!plate.trim()) return;
    setIsLoading(true);
    setIsPlaying(false);
    setPlaybackIndex(0);

    try {
      const data = await fetchVehicleTrajectory(plate.trim().toUpperCase(), h);
      setTrajectoryData(data);
    } catch (err) {
      console.error('Error fetching trajectory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    executeSearch(plateInput, hours);
  };

  const handleSampleClick = (plate) => {
    setPlateInput(plate);
    executeSearch(plate, hours);
  };

  // Trajectory with animated playback slice
  const displayedTrajectory = trajectoryData
    ? {
        ...trajectoryData,
        waypoints: isPlaying
          ? trajectoryData.waypoints.slice(0, playbackIndex + 1)
          : trajectoryData.waypoints,
      }
    : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 420px) 1fr',
        gap: '20px',
        height: 'calc(100vh - 160px)',
        minHeight: '600px',
      }}
      className="trajectory-container"
    >
      {/* Left Column: Search Form & Timeline */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px' }}>
            <Navigation size={20} color="#60a5fa" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
              Vehicle Route Reconstruction
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Historical GIS breadcrumbs &amp; speed estimation
            </p>
          </div>
        </div>

        {/* Search Input & Quick Samples */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>
              VEHICLE NUMBER PLATE (HSRP)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                placeholder="e.g. GJ01AB1234"
                style={{
                  flex: 1,
                  background: '#0d1424',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  letterSpacing: '1.5px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ minWidth: '90px' }}
              >
                <Search size={15} />
                {isLoading ? '...' : 'Track'}
              </button>
            </div>
          </div>

          {/* Quick Demo Plates */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Quick Demo:</span>
            {samplePlates.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSampleClick(sample)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: '#93c5fd',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Time range chips */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>History:</span>
            {[12, 24, 48, 72].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHours(h);
                  if (plateInput) executeSearch(plateInput, h);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: hours === h ? '1px solid #3b82f6' : '1px solid #1e293b',
                  background: hours === h ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: hours === h ? '#60a5fa' : '#94a3b8',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {h}h
              </button>
            ))}
          </div>
        </form>

        {/* Search Results Summary Banner */}
        {trajectoryData && (
          <div
            style={{
              background: trajectoryData.is_hotlisted ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(15, 23, 42, 0.9))' : 'rgba(30, 41, 59, 0.6)',
              border: trajectoryData.is_hotlisted ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid #334155',
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="plate-badge" style={{ fontSize: '13px' }}>
                {trajectoryData.plate_number}
              </span>
              {trajectoryData.is_hotlisted ? (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  🚨 SUSPECT HOTLIST
                </span>
              ) : (
                <span style={{ color: '#34d399', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} /> Standard Vehicle
                </span>
              )}
            </div>

            {trajectoryData.hotlist_info && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#fca5a5', background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '6px' }}>
                <div><strong>Crime Category:</strong> {trajectoryData.hotlist_info.crime_category}</div>
                <div><strong>FIR / Police Station:</strong> {trajectoryData.hotlist_info.fir_number || 'N/A'} • {trajectoryData.hotlist_info.police_station}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
              <span>Checkpoints: <strong style={{ color: '#fff' }}>{trajectoryData.total_detections}</strong></span>
              {trajectoryData.waypoints.length > 0 && (
                <span>Last Seen: <strong style={{ color: '#fff' }}>{new Date(trajectoryData.last_seen).toLocaleTimeString('en-IN')}</strong></span>
              )}
            </div>

            {/* Traversal Playback Control */}
            {trajectoryData.waypoints.length > 1 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    border: `1px solid ${isPlaying ? '#ef4444' : '#3b82f6'}`,
                    color: isPlaying ? '#f87171' : '#60a5fa',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  {isPlaying ? 'Pause Simulation' : '▶ Animate Route'}
                </button>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  {isPlaying ? `Step ${playbackIndex + 1}/${trajectoryData.waypoints.length}` : `${trajectoryData.waypoints.length} checkpoints`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Waypoints Timeline with Evidentiary Photos */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Checkpoint Evidence Timeline
          </h3>

          {!trajectoryData || trajectoryData.waypoints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <History size={36} style={{ opacity: 0.25, marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', fontWeight: '600' }}>No trajectory loaded</p>
              <p style={{ fontSize: '11px', marginTop: '4px', color: '#64748b' }}>
                Enter an Indian vehicle registration number or select a quick demo above to reconstruct route.
              </p>
            </div>
          ) : (
            trajectoryData.waypoints.map((wp, idx) => {
              const isLast = idx === trajectoryData.waypoints.length - 1;
              const isFirst = idx === 0;
              const borderColor = isLast ? '#ef4444' : isFirst ? '#10b981' : '#3b82f6';

              return (
                <div
                  key={wp.detection_id || idx}
                  style={{
                    background: '#0d1527',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '12px',
                    position: 'relative',
                    borderLeft: `4px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#f8fafc' }}>
                      #{idx + 1} {wp.camera_name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {new Date(wp.detected_at).toLocaleTimeString('en-IN')}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    📍 {wp.location_name}
                  </div>

                  {/* Speed telemetry */}
                  {wp.estimated_speed_kmh && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>
                      <Gauge size={12} />
                      <span>Est. Speed: {wp.estimated_speed_kmh} km/h</span>
                    </div>
                  )}

                  {/* Evidence Snapshot Photo */}
                  {wp.snapshot_url && (
                    <div
                      style={{
                        marginTop: '8px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #334155',
                      }}
                    >
                      <img
                        src={`${BACKEND_URL}${wp.snapshot_url}`}
                        alt="CCTV Evidence Crop"
                        style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Interactive GIS Map View */}
      <div className="glass-card" style={{ padding: '12px', height: '100%', minHeight: '440px' }}>
        <GISMap cameras={cameras} activeRoute={displayedTrajectory} />
      </div>
    </div>
  );
}
