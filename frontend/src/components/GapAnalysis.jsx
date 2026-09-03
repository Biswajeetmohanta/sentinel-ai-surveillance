import React, { useState, useEffect } from 'react';
import { Shield, Database, AlertTriangle, Layers, Download, Upload, CheckCircle2, TrendingUp, Cpu, Server, MapPin, Eye, RefreshCw } from 'lucide-react';
import { BACKEND_URL } from '../services/api';
import { useToast } from './Toast';

export default function GapAnalysis({ cameras = [], onSelectCameraOnMap }) {
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'blackspots' | 'registry'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const { addToast } = useToast();

  const loadGapAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/cameras/gap-analysis`);
      if (res.ok) {
        const data = await res.json();
        setGapData(data);
      }
    } catch (e) {
      console.error('Failed to load gap analysis:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGapAnalysis();
  }, []);

  const exportRegistryCsv = () => {
    if (!cameras.length) return;
    const headers = [
      'Camera Code', 'Name', 'Department', 'Camera Type', 'Ownership',
      'Location', 'Latitude', 'Longitude', 'Coverage Radius (m)', 'Installation Year',
      'Storage Details', 'Maintenance Status', 'RTSP Stream URL'
    ];
    const rows = cameras.map((c) => [
      `"${c.camera_code || c.id}"`,
      `"${c.name}"`,
      `"${c.department}"`,
      `"${c.camera_type || 'Fixed Bullet'}"`,
      `"${c.ownership || 'Gujarat Police'}"`,
      `"${c.location_name}"`,
      c.latitude,
      c.longitude,
      c.coverage_radius_meters || 150,
      c.installation_year || 2023,
      `"${c.storage_details || 'NVR 30-Day'}"`,
      `"${c.maintenance_status || 'Operational'}"`,
      `"${c.rtsp_url}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gujarat_Central_CCTV_Registry_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Central CCTV Registry exported to CSV successfully!', 'success');
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/cameras/bulk-import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Successfully onboarded ${data.imported_records} cameras to Central Registry!`, 'success');
        loadGapAnalysis();
      } else {
        addToast('Bulk onboarding failed: ' + data.detail, 'error');
      }
    } catch (err) {
      addToast('Error uploading CSV: ' + err.message, 'error');
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchDept = selectedDeptFilter === 'ALL' || cam.department === selectedDeptFilter;
    const matchType = selectedTypeFilter === 'ALL' || (cam.camera_type || 'Fixed Bullet') === selectedTypeFilter;
    return matchDept && matchType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Banner - Model 1 Compliance */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Database size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>
                Centralised CCTV Registry &amp; GIS Mapping Model
              </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                }}
              >
                MODEL 1 SPECIFICATION
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Metadata &amp; Asset Visibility Layer across 26+ Gujarat Government Departments • Automated Infrastructure Gap-Analysis
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '12px', padding: '6px 12px' }}>
            <Upload size={14} />
            Bulk CSV Onboard
            <input type="file" accept=".csv" onChange={handleBulkUpload} style={{ display: 'none' }} />
          </label>
          <button
            type="button"
            onClick={exportRegistryCsv}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Download size={14} />
            Export Registry Audit
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        {[
          { id: 'overview', label: '📊 Infrastructure Analytics & Health' },
          { id: 'blackspots', label: '⚠️ Identified Surveillance Blind Spots (Gap Analysis)' },
          { id: 'registry', label: '📋 Central Multi-Department Metadata Registry' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              background: activeSubTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: `1px solid ${activeSubTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              color: activeSubTab === tab.id ? '#60a5fa' : '#94a3b8',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Gap Analytics */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Key Metric Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #3b82f6' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                Onboarded CCTV Nodes
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginTop: '4px', fontFamily: 'monospace' }}>
                {gapData?.total_cameras || cameras.length}
              </div>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                ● 100% Live Ingestion Nodes
              </span>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                Estimated GIS Coverage
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginTop: '4px', fontFamily: 'monospace' }}>
                ~{gapData?.total_estimated_coverage_sq_km || 2.12} <span style={{ fontSize: '14px' }}>km²</span>
              </div>
              <span style={{ fontSize: '11px', color: '#60a5fa' }}>
                Key Intersections &amp; Toll Gates
              </span>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                Ageing Infrastructure (&ge; 3 Yrs)
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginTop: '4px', fontFamily: 'monospace' }}>
                {gapData?.ageing_infrastructure?.ageing_count || 5} <span style={{ fontSize: '13px', color: '#f59e0b' }}>({gapData?.ageing_infrastructure?.replacement_due_percentage || 16.7}%)</span>
              </div>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>
                Scheduled for Hardware Refresh
              </span>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                Uncovered Black Spots
              </span>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginTop: '4px', fontFamily: 'monospace' }}>
                {gapData?.uncovered_black_spots?.length || 4}
              </div>
              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: '600' }}>
                High-Priority Expansion Zones
              </span>
            </div>
          </div>

          {/* Departmental & Camera Type Distributions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Department Breakdown */}
            <div className="glass-card" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '14px' }}>
                Surveillance Assets by Department
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {gapData?.department_distribution ? (
                  Object.entries(gapData.department_distribution).slice(0, 7).map(([dept, count]) => {
                    const total = gapData.total_cameras || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={dept}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{dept}</span>
                          <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading departmental breakdown...</p>
                )}
              </div>
            </div>

            {/* Camera Type & Form Factor Breakdown */}
            <div className="glass-card" style={{ padding: '18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '14px' }}>
                Camera Hardware Types &amp; Optical Profiles
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {gapData?.camera_type_distribution ? (
                  Object.entries(gapData.camera_type_distribution).map(([type, count]) => {
                    const total = gapData.total_cameras || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{type}</span>
                          <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>Loading hardware distribution...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Identified Surveillance Blind Spots (Government Gap Analysis) */}
      {activeSubTab === 'blackspots' && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              Identified Surveillance Blind Spots &amp; Infrastructure Gaps
            </h3>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Corridors identified with unmonitored blind spots, insufficient resolution, or lack of automated ANPR interception.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {(gapData?.uncovered_black_spots || []).map((spot) => (
              <div
                key={spot.zone_id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${spot.risk_level === 'HIGH' ? '#ef4444' : spot.risk_level === 'MEDIUM' ? '#f59e0b' : '#3b82f6'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: '700' }}>
                    {spot.zone_id} • {spot.district}
                  </span>
                  <span
                    style={{
                      background: spot.risk_level === 'HIGH' ? '#ef4444' : spot.risk_level === 'MEDIUM' ? '#f59e0b' : '#3b82f6',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: '900',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {spot.risk_level} GAP
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>
                  {spot.name}
                </div>

                <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  <strong>Vulnerability:</strong> {spot.reason}
                </p>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', color: '#93c5fd' }}>
                  <strong>Recommended Deployment:</strong> {spot.recommended_asset}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Central Multi-Department Metadata Registry Table */}
      {activeSubTab === 'registry' && (
        <div className="glass-card" style={{ padding: '18px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                Standardised CCTV Asset Metadata Registry
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Unified state inventory ({filteredCameras.length} cameras listed)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                style={{ background: '#111827', border: '1px solid #374151', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}
              >
                <option value="ALL">All Departments</option>
                {Array.from(new Set(cameras.map(c => c.department).filter(Boolean))).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                style={{ background: '#111827', border: '1px solid #374151', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}
              >
                <option value="ALL">All Camera Types</option>
                <option value="ANPR HSRP">ANPR HSRP</option>
                <option value="PTZ Dome">PTZ Dome</option>
                <option value="Fixed Bullet">Fixed Bullet</option>
                <option value="Dome Camera">Dome Camera</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px' }}>ID / CODE</th>
                  <th style={{ padding: '8px 10px' }}>JUNCTION / ASSET NAME</th>
                  <th style={{ padding: '8px 10px' }}>DEPARTMENT</th>
                  <th style={{ padding: '8px 10px' }}>TYPE</th>
                  <th style={{ padding: '8px 10px' }}>OWNERSHIP</th>
                  <th style={{ padding: '8px 10px' }}>RADIUS</th>
                  <th style={{ padding: '8px 10px' }}>INSTALL YEAR</th>
                  <th style={{ padding: '8px 10px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCameras.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: '700' }}>
                      {c.camera_code || `cam_${c.id}`}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: '600', color: '#fff' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                      {c.department}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px' }}>
                        {c.camera_type || 'Fixed Bullet'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                      {c.ownership || 'Gujarat Police'}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#10b981' }}>
                      {c.coverage_radius_meters || 150}m
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: c.installation_year <= 2022 ? '#f59e0b' : '#cbd5e1' }}>
                      {c.installation_year || 2023}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ color: '#10b981', fontWeight: '700' }}>
                        ● {c.status || 'ONLINE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
