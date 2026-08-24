import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import CameraGrid from './components/CameraGrid';
import GISMap from './components/GISMap';
import AlertSidebar from './components/AlertSidebar';
import TrajectorySearch from './components/TrajectorySearch';
import WatchlistManager from './components/WatchlistManager';
import CameraManager from './components/CameraManager';

import { fetchCameras, fetchDashboardStats, fetchDetections } from './services/api';
import { wsService } from './services/websocket';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [selectedTrajectoryPlate, setSelectedTrajectoryPlate] = useState('');
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Play audio chime on red alerts
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  const loadInitialData = async () => {
    try {
      const [camsData, statsData, detData] = await Promise.all([
        fetchCameras(),
        fetchDashboardStats(),
        fetchDetections({ limit: 20 }),
      ]);
      setCameras(camsData);
      setStats(statsData);
      setRecentDetections(detData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Connect WebSocket
    wsService.connect();
    const unsubscribe = wsService.subscribe((payload) => {
      if (payload.type === 'WATCHLIST_ALERT') {
        playAlertSound();
        setAlerts((prev) => [payload.data, ...prev.slice(0, 49)]);
        setStats((prev) => prev ? {
          ...prev,
          total_watchlist_alerts_today: prev.total_watchlist_alerts_today + 1,
          total_detections_today: prev.total_detections_today + 1,
        } : prev);

        // Highlight camera on map
        setCameras((prev) =>
          prev.map((c) => (c.id === payload.data.camera_id ? { ...c, hasAlert: true } : c))
        );
      } else if (payload.type === 'LIVE_DETECTION') {
        setRecentDetections((prev) => [payload.data, ...prev.slice(0, 29)]);
        setStats((prev) => prev ? {
          ...prev,
          total_detections_today: prev.total_detections_today + 1,
        } : prev);
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, []);

  const handleSelectAlert = (alert) => {
    setSelectedTrajectoryPlate(alert.plate_number);
    setActiveTab('trajectory');
  };

  return (
    <div style={{ minHeight: '100vh', padding: '16px 24px', maxWidth: '1800px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} alertCount={alerts.length} />

      {/* Main Tab Views */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top Metrics Cards */}
          <DashboardStats stats={stats} />

          {/* 3-Column Surveillance Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.3fr) 340px',
            gap: '20px',
            height: 'calc(100vh - 280px)',
            minHeight: '520px'
          }}>
            {/* 1. Camera Feeds Grid */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                  Live CCTV Ingest Grid
                </h2>
                <span style={{ fontSize: '11px', color: '#60a5fa' }}>{cameras.length} Active Feeds</span>
              </div>
              <CameraGrid cameras={cameras} recentDetections={recentDetections} />
            </div>

            {/* 2. GIS Map View */}
            <div className="glass-card" style={{ padding: '12px' }}>
              <GISMap
                cameras={cameras}
                selectedCamera={selectedCamera}
                onSelectCamera={(cam) => setSelectedCamera(cam)}
              />
            </div>

            {/* 3. Real-time Watchlist Alerts Sidebar */}
            <AlertSidebar alerts={alerts} onSelectAlert={handleSelectAlert} />
          </div>
        </>
      )}

      {activeTab === 'trajectory' && (
        <TrajectorySearch initialPlate={selectedTrajectoryPlate} cameras={cameras} />
      )}

      {activeTab === 'watchlist' && (
        <WatchlistManager />
      )}

      {activeTab === 'cameras' && (
        <CameraManager />
      )}

    </div>
  );
}
