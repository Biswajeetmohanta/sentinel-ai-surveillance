import React from 'react';
import { Camera, Radio, AlertTriangle, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';

export default function DashboardStats({ stats, onCardClick }) {
  const cards = [
    {
      id: 'cameras',
      title: 'Connected Cameras',
      value: stats?.total_cameras || 0,
      sub: `${stats?.active_cameras || 0} Online & Ingesting`,
      icon: Camera,
      color: '#3b82f6',
      badge: '99.8% Uptime',
      badgeColor: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.85))',
      borderColor: 'rgba(59, 130, 246, 0.35)',
    },
    {
      id: 'detections',
      title: "Today's Plates Scanned",
      value: stats?.total_detections_today || 0,
      sub: 'YOLOv8 + PP-OCRv4 Real-Time',
      icon: Radio,
      color: '#06b6d4',
      badge: 'Sub-second AI',
      badgeColor: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(15, 23, 42, 0.85))',
      borderColor: 'rgba(6, 182, 212, 0.35)',
    },
    {
      id: 'alerts',
      title: 'Hotlist Matches Today',
      value: stats?.total_watchlist_alerts_today || 0,
      sub: 'Immediate Police Interceptions',
      icon: AlertTriangle,
      color: '#ef4444',
      badge: (stats?.total_watchlist_alerts_today || 0) > 0 ? 'Action Required' : 'All Clear',
      badgeColor: (stats?.total_watchlist_alerts_today || 0) > 0 ? '#ef4444' : '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.85))',
      borderColor: 'rgba(239, 68, 68, 0.45)',
      isAlert: (stats?.total_watchlist_alerts_today || 0) > 0,
    },
    {
      id: 'watchlist',
      title: 'Active Suspect Watchlist',
      value: stats?.active_hotlist_count || 0,
      sub: 'Stolen, Wanted & Crime FIRs',
      icon: ShieldCheck,
      color: '#10b981',
      badge: 'Redis In-Memory',
      badgeColor: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.85))',
      borderColor: 'rgba(16, 185, 129, 0.35)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`glass-card glass-card-hover ${c.isAlert ? 'pulse-alert' : ''}`}
            onClick={() => onCardClick && onCardClick(c.id)}
            style={{
              padding: '18px 20px',
              background: c.bgGradient,
              border: `1px solid ${c.borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: onCardClick ? 'pointer' : 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar with Title and Icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  {c.title}
                </p>
                <h3
                  style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    color: '#ffffff',
                    marginTop: '4px',
                    fontFamily: 'monospace',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {c.value.toLocaleString()}
                </h3>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: `1px solid ${c.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={22} color={c.color} />
              </div>
            </div>

            {/* Bottom Info & Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <p style={{ fontSize: '11px', color: c.color, fontWeight: '600' }}>
                {c.sub}
              </p>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: c.badgeColor,
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${c.borderColor}`,
                }}
              >
                {c.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
