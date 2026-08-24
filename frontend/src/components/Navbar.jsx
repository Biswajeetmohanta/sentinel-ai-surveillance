import React, { useState, useEffect } from 'react';
import { Shield, Radio, Bell, Video, MapPin, Search, Database, Settings } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, alertCount }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Live Surveillance', icon: Video },
    { id: 'trajectory', label: 'Vehicle Trajectory & GIS', icon: MapPin },
    { id: 'watchlist', label: 'Suspect Hotlist', icon: Shield },
    { id: 'cameras', label: 'Camera Network', icon: Settings },
  ];

  return (
    <header className="glass-card" style={{ padding: '14px 24px', marginBottom: '20px', borderRadius: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
                SENTINEL AI
              </h1>
              <span style={{
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                GUJARAT POLICE
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Unified CCTV ANPR &amp; Real-Time GIS Tracking
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '10px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                {item.label}
                {item.id === 'watchlist' && alertCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    marginLeft: '4px'
                  }}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Health & Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span className="live-dot" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#34d399' }}>AI ENGINE LIVE</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f3f4f6', fontFamily: 'monospace' }}>
              {time.toLocaleTimeString('en-IN', { hour12: false })} IST
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
