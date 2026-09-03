import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import CameraGrid from './components/CameraGrid';
import GISMap from './components/GISMap';
import AlertSidebar from './components/AlertSidebar';
import TrajectorySearch from './components/TrajectorySearch';
import WatchlistManager from './components/WatchlistManager';
import CameraManager from './components/CameraManager';
import GapAnalysis from './components/GapAnalysis';
import Login from './components/Login';
import { ToastProvider, useToast } from './components/Toast';

import { fetchCameras, fetchDashboardStats, fetchDetections } from './services/api';
import { wsService } from './services/websocket';

function MainApp() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sentinel_user') || sessionStorage.getItem('sentinel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [selectedTrajectoryPlate, setSelectedTrajectoryPlate] = useState('');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { addToast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('sentinel_user');
    localStorage.removeItem('sentinel_token');
    sessionStorage.removeItem('sentinel_user');
    sessionStorage.removeItem('sentinel_token');
    setCurrentUser(null);
  };

  // Play audio chime on red alerts if sound is enabled
  const playAlertSound = () => {
    if (!soundEnabled) return;
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
      console.error('Error loading surveillance initial data:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    loadInitialData();
    const interval = setInterval(loadInitialData, 8000);

    // Connect WebSocket for real-time live feeds and alerts
    wsService.connect();
    const unsubscribe = wsService.subscribe((payload) => {
      if (payload.type === 'WATCHLIST_ALERT') {
        playAlertSound();
        addToast(`🚨 HOTLIST MATCH: ${payload.data.plate_number} (${payload.data.crime_category || 'Suspect'}) at ${payload.data.camera_name || 'Camera'}`, 'alert', 6000);
        setAlerts((prev) => [payload.data, ...prev.slice(0, 49)]);
        setStats((prev) =>
          prev
            ? {
                ...prev,
                total_watchlist_alerts_today: (prev.total_watchlist_alerts_today || 0) + 1,
                total_detections_today: (prev.total_detections_today || 0) + 1,
              }
            : prev
        );

        // Highlight camera on map with active alert pulse
        setCameras((prev) =>
          prev.map((c) => (c.id === payload.data.camera_id ? { ...c, hasAlert: true } : c))
        );
      } else if (payload.type === 'LIVE_DETECTION') {
        setRecentDetections((prev) => [payload.data, ...prev.slice(0, 29)]);
        setStats((prev) =>
          prev
            ? {
                ...prev,
                total_detections_today: (prev.total_detections_today || 0) + 1,
              }
            : prev
        );
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      wsService.disconnect();
    };
  }, [soundEnabled, currentUser]);

  const handleSelectAlert = (alert) => {
    setSelectedTrajectoryPlate(alert.plate_number);
    setActiveTab('trajectory');
  };

  const handleQuickSearch = (plate) => {
    setSelectedTrajectoryPlate(plate);
    setActiveTab('trajectory');
  };

  const handleStatCardClick = (cardId) => {
    if (cardId === 'cameras') setActiveTab('cameras');
    else if (cardId === 'watchlist') setActiveTab('watchlist');
    else if (cardId === 'alerts') setActiveTab('watchlist');
    else if (cardId === 'detections') setActiveTab('dashboard');
  };

  // If user is not authenticated, lock application and show secure login gate
  if (!currentUser) {
    return <Login onLoginSuccess={(userData) => setCurrentUser(userData)} />;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '16px 20px', maxWidth: '1880px', margin: '0 auto' }}>
      
      {/* Top Header with Responsive Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alerts.length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onQuickSearch={handleQuickSearch}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Tab Views */}
      {activeTab === 'dashboard' && (
        <div className="modal-content-animated">
          {/* Top Metrics Cards */}
          <DashboardStats stats={stats} onCardClick={handleStatCardClick} />

          {/* 3-Column Surveillance Layout */}
          <div className="surveillance-layout">
            {/* 1. Camera Feeds Grid */}
            <div
              className="glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="live-dot" />
                  <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                    Live CCTV Ingest Grid
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#60a5fa',
                    fontWeight: '700',
                    background: 'rgba(59, 130, 246, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {cameras.length} Active Feeds
                </span>
              </div>
              <CameraGrid
                cameras={cameras}
                recentDetections={recentDetections}
                onSelectCameraOnMap={(cam) => {
                  setSelectedCamera(cam);
                }}
                onTrackPlate={(plate) => {
                  setSelectedTrajectoryPlate(plate);
                  setActiveTab('trajectory');
                }}
              />
            </div>

            {/* 2. GIS Map View */}
            <div className="glass-card" style={{ padding: '12px', minHeight: '400px' }}>
              <GISMap
                cameras={cameras}
                selectedCamera={selectedCamera}
                onSelectCamera={(cam) => setSelectedCamera(cam)}
                onTrackPlate={(plate) => {
                  setSelectedTrajectoryPlate(plate);
                  setActiveTab('trajectory');
                }}
              />
            </div>

            {/* 3. Real-time Watchlist Alerts Sidebar */}
            <AlertSidebar
              alerts={alerts}
              onSelectAlert={handleSelectAlert}
              onClearAlerts={() => setAlerts([])}
            />
          </div>
        </div>
      )}

      {activeTab === 'trajectory' && (
        <div className="modal-content-animated">
          <TrajectorySearch initialPlate={selectedTrajectoryPlate} cameras={cameras} />
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div className="modal-content-animated">
          <WatchlistManager />
        </div>
      )}

      {activeTab === 'gap_analysis' && (
        <div className="modal-content-animated">
          <GapAnalysis
            cameras={cameras}
            onSelectCameraOnMap={(cam) => {
              setSelectedCamera(cam);
              setActiveTab('dashboard');
            }}
          />
        </div>
      )}

      {activeTab === 'cameras' && (
        <div className="modal-content-animated">
          <CameraManager />
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
