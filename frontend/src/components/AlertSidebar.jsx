import React from 'react';
import { AlertTriangle, Clock, MapPin, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AlertSidebar({ alerts = [], onSelectAlert }) {
  return (
    <div className="glass-card" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} color="#ef4444" />
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
            Live Watchlist Alerts
          </h2>
        </div>
        <span style={{
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '10px',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        }}>
          {alerts.length} INTERCEPTIONS
        </span>
      </div>

      {/* Alert Feed List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '13px' }}>No active watchlist alerts.</p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>System scanning live camera streams 24/7...</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className="glass-card-hover"
              onClick={() => onSelectAlert && onSelectAlert(alert)}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(17, 24, 39, 0.95))',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Top Row: Plate & Priority Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="plate-badge" style={{ fontSize: '13px' }}>
                  {alert.plate_number}
                </span>
                <span style={{
                  background: alert.priority === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px'
                }}>
                  {alert.priority || 'HIGH'}
                </span>
              </div>

              {/* Crime Category & FIR */}
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fca5a5', marginBottom: '4px' }}>
                ⚠️ {alert.crime_category || 'Hotlisted Suspect'}
              </div>
              {alert.fir_number && (
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px' }}>
                  FIR: {alert.fir_number}
                </div>
              )}

              {/* Location & Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#d1d5db', marginBottom: '4px' }}>
                <MapPin size={12} color="#60a5fa" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {alert.camera_name || alert.location_name}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {new Date(alert.detected_at || Date.now()).toLocaleTimeString('en-IN')}
                </span>
                <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '600' }}>
                  Track Route <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
