import React, { useState } from 'react';
import { AlertTriangle, Clock, MapPin, ShieldAlert, ArrowRight, Filter, Trash2, Shield } from 'lucide-react';

export default function AlertSidebar({ alerts = [], onSelectAlert, onClearAlerts }) {
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (priorityFilter === 'ALL') return true;
    return (a.priority || 'HIGH') === priorityFilter;
  });

  return (
    <div
      className="glass-card alert-column"
      style={{
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={18} color="#ef4444" />
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              Hotlist Interceptions
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              Real-time suspect plate alerts
            </p>
          </div>
        </div>

        <span
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            fontSize: '10px',
            fontWeight: '800',
            padding: '3px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          {alerts.length} ALERTS
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setPriorityFilter(lvl)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: priorityFilter === lvl ? '1px solid #3b82f6' : '1px solid #1e293b',
              background: priorityFilter === lvl ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.5)',
              color: priorityFilter === lvl ? '#60a5fa' : '#94a3b8',
              fontSize: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Alert Feed List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px',
        }}
      >
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
            <Shield size={32} style={{ opacity: 0.25, marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', fontWeight: '600' }}>No active watchlist alerts.</p>
            <p style={{ fontSize: '10px', marginTop: '4px', color: '#64748b' }}>
              System actively cross-referencing all CCTV frames against hotlist...
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className="glass-card-hover"
              onClick={() => onSelectAlert && onSelectAlert(alert)}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(15, 23, 42, 0.95))',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Top Row: Plate & Priority Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="plate-badge" style={{ fontSize: '12px' }}>
                  {alert.plate_number}
                </span>
                <span
                  style={{
                    background: alert.priority === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '900',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {alert.priority || 'HIGH'}
                </span>
              </div>

              {/* Crime Category & FIR */}
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#fca5a5', marginBottom: '2px' }}>
                ⚠️ {alert.crime_category || 'Hotlisted Suspect'}
              </div>
              {alert.fir_number && (
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>
                  FIR: {alert.fir_number} {alert.police_station ? `• ${alert.police_station}` : ''}
                </div>
              )}

              {/* Location & Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                <MapPin size={12} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {alert.camera_name || alert.location_name}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '6px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} />
                  {new Date(alert.detected_at || Date.now()).toLocaleTimeString('en-IN')}
                </span>
                <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '700' }}>
                  Track GIS Route <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
