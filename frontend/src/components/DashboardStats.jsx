import React from 'react';
import { Camera, Radio, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DashboardStats({ stats }) {
  const cards = [
    {
      title: 'Connected Cameras',
      value: stats?.total_cameras || 0,
      sub: `${stats?.active_cameras || 0} Online & Streaming`,
      icon: Camera,
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 58, 138, 0.05))',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      title: "Today's Plates Scanned",
      value: stats?.total_detections_today || 0,
      sub: 'Real-time YOLOv8 + PaddleOCR',
      icon: Radio,
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 116, 144, 0.05))',
      borderColor: 'rgba(6, 182, 212, 0.3)',
    },
    {
      title: 'Hotlist Matches (Today)',
      value: stats?.total_watchlist_alerts_today || 0,
      sub: 'Urgent Red Flag Interceptions',
      icon: AlertTriangle,
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(153, 27, 27, 0.05))',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      isAlert: (stats?.total_watchlist_alerts_today || 0) > 0,
    },
    {
      title: 'Active Suspect Watchlist',
      value: stats?.active_hotlist_count || 0,
      sub: 'Stolen, Wanted & Crime FIRs',
      icon: ShieldCheck,
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.05))',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className={`glass-card glass-card-hover ${c.isAlert ? 'pulse-alert' : ''}`}
            style={{
              padding: '18px 20px',
              background: c.bgGradient,
              border: `1px solid ${c.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {c.title}
              </p>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '4px 0' }}>
                {c.value.toLocaleString()}
              </h3>
              <p style={{ fontSize: '12px', color: c.color, fontWeight: '500' }}>
                {c.sub}
              </p>
            </div>
            <div style={{
              background: `rgba(255, 255, 255, 0.06)`,
              padding: '12px',
              borderRadius: '12px',
              border: `1px solid ${c.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon size={26} color={c.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
