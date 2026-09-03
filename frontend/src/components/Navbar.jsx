import React, { useState, useEffect } from 'react';
import { Shield, Video, MapPin, Search, Settings, Volume2, VolumeX, Menu, X, Database, LogOut } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  alertCount,
  soundEnabled,
  setSoundEnabled,
  onQuickSearch,
  currentUser,
  onLogout,
}) {
  const [time, setTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickPlate, setQuickPlate] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Surveillance', icon: Video },
    { id: 'trajectory', label: 'Trajectory & GIS', icon: MapPin },
    { id: 'watchlist', label: 'Suspect Hotlist', icon: Shield },
    { id: 'gap_analysis', label: 'Registry & Gap Analysis', icon: Database },
    { id: 'cameras', label: 'Cameras', icon: Settings },
  ];

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (quickPlate.trim() && onQuickSearch) {
      onQuickSearch(quickPlate.trim().toUpperCase());
      setQuickPlate('');
      setMobileMenuOpen(false);
    }
  };

  // Bulletproof logout: cleans storage and invokes callback or reloads
  const doLogout = () => {
    try {
      localStorage.removeItem('sentinel_user');
      localStorage.removeItem('sentinel_token');
      sessionStorage.removeItem('sentinel_user');
      sessionStorage.removeItem('sentinel_token');
    } catch (e) {
      console.error(e);
    }
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  // Officer display name
  const officerEmail = currentUser?.email || 'jyoti@deventtechnology.com';

  return (
    <header
      className="glass-card"
      style={{
        padding: '10px 14px',
        marginBottom: '16px',
        position: 'sticky',
        top: '10px',
        zIndex: 1000,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
        }}
      >
        {/* Left: Branding */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setActiveTab('dashboard')}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              padding: '7px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Shield size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.3px', color: '#fff', whiteSpace: 'nowrap' }}>
                SENTINEL AI
              </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                GUJARAT POLICE
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs (Desktop only) */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            gap: '3px',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            flexShrink: 1,
          }}
        >
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
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={13} />
                <span>{item.label}</span>
                {item.id === 'watchlist' && alertCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '8px',
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Controls + Prominent Red Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Quick Search (Large desktop only) */}
          <form onSubmit={handleQuickSearchSubmit} className="desktop-search" style={{ position: 'relative' }}>
            <input
              type="text"
              value={quickPlate}
              onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
              placeholder="Search Plate..."
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '4px 8px 4px 24px',
                color: '#fff',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: '600',
                width: '100px',
                outline: 'none',
              }}
            />
            <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)' }} />
          </form>

          {/* Audio Alert Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Siren Alerts: Active' : 'Siren Alerts: Muted'}
            style={{
              background: soundEnabled ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${soundEnabled ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              padding: '5px 7px',
              color: soundEnabled ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Officer Info (Desktop only) */}
          <div
            className="desktop-status"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              background: 'rgba(15, 23, 42, 0.9)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              lineHeight: '1.2',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#60a5fa', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {officerEmail}
            </span>
            <span style={{ fontSize: '9px', color: '#34d399', fontWeight: '700' }}>
              ● {currentUser?.badge_number || 'GP-7829'}
            </span>
          </div>

          {/* Logout Button (Desktop only - in mobile it is inside hamburger menu) */}
          <button
            type="button"
            onClick={doLogout}
            title="Sign Out of Sentinel AI"
            id="sentinel-logout-btn"
            className="desktop-logout-btn"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: '1px solid #f87171',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: '800',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '6px',
              color: '#fff',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="modal-content-animated"
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Officer Tag inside Mobile Menu */}
          <div style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '11px', color: '#93c5fd', display: 'flex', justifyContent: 'space-between' }}>
            <span>Logged in as: <strong>{officerEmail}</strong></span>
            <span>Badge: <strong>{currentUser?.badge_number || 'GP-7829'}</strong></span>
          </div>

          <form onSubmit={handleQuickSearchSubmit} style={{ marginBottom: '4px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={quickPlate}
                onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                placeholder="Search Plate (e.g. GJ01AB1234)..."
                style={{
                  width: '100%',
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '7px 10px 7px 28px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </form>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255, 255, 255, 0.03)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'watchlist' && alertCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '8px',
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Large Red Mobile Logout Button */}
          <button
            onClick={doLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '800',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              marginTop: '6px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out / Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
