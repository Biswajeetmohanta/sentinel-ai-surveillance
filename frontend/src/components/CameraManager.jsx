import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Globe, Radio, Search, Filter, LayoutGrid, List, AlertTriangle, X, MapPin } from 'lucide-react';
import { fetchCameras, createCamera, deleteCamera } from '../services/api';
import { useToast } from './Toast';

export default function CameraManager() {
  const [cameras, setCameras] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    department: 'Gujarat Traffic Police',
    location_name: '',
    latitude: 23.0286,
    longitude: 72.5068,
    rtsp_url: 'rtsp://localhost:8554/cam_new',
    fps_processing: 5,
  });

  const locationPresets = [
    { name: 'SG Highway - Pakwan Cross Road', dept: 'Gujarat Traffic Police', lat: 23.0489, lng: 72.5186, location: 'SG Highway, Bodakdev, Ahmedabad' },
    { name: 'Ashram Road - Income Tax Circle', dept: 'Gujarat Traffic Police', lat: 23.0375, lng: 72.5714, location: 'Ashram Road, Usmanpura, Ahmedabad' },
    { name: 'Kalupur Central Railway Station Exit', dept: 'Ahmedabad City Police', lat: 23.0285, lng: 72.6009, location: 'Railway Station Road, Kalupur, Ahmedabad' },
    { name: 'Gandhinagar Secretariat Gate 1', dept: 'State Security Branch (SSB)', lat: 23.2156, lng: 72.6369, location: 'Sector 10, Gandhinagar' },
    { name: 'Sarkhej-Sanand Toll Plaza', dept: 'Gujarat Highway Patrol', lat: 22.9842, lng: 72.4578, location: 'Sanand Highway, Ahmedabad' },
  ];

  const loadData = async () => {
    try {
      const data = await fetchCameras();
      setCameras(data);
    } catch (err) {
      console.error('Error fetching cameras:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyPreset = (preset) => {
    setFormData({
      ...formData,
      name: preset.name,
      department: preset.dept,
      location_name: preset.location,
      latitude: preset.lat,
      longitude: preset.lng,
      rtsp_url: `rtsp://localhost:8554/${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rtsp_url.trim()) return;

    setIsSubmitting(true);
    try {
      await createCamera(formData);
      setShowAddModal(false);
      addToast(`Camera "${formData.name}" registered successfully!`, 'success');
      setFormData({
        name: '',
        department: 'Gujarat Traffic Police',
        location_name: '',
        latitude: 23.0286,
        longitude: 72.5068,
        rtsp_url: 'rtsp://localhost:8554/cam_new',
        fps_processing: 5,
      });
      loadData();
    } catch (err) {
      addToast('Error registering camera: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCamera(deleteTargetId);
      addToast('Camera feed deleted.', 'info');
      setDeleteTargetId(null);
      loadData();
    } catch (err) {
      addToast('Error deleting camera: ' + err.message, 'error');
    }
  };

  const departments = ['ALL', ...Array.from(new Set(cameras.map((c) => c.department).filter(Boolean)))];

  const filteredCameras = cameras.filter((cam) => {
    const matchesDept = selectedDept === 'ALL' || cam.department === selectedDept;
    const matchesSearch =
      cam.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        height: 'calc(100vh - 160px)',
        minHeight: '560px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              Multi-Department CCTV Camera Network
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Aggregated RTSP video ingest nodes across Gujarat Police &amp; Municipal Corporations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <List size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Register Camera Feed
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search cameras by name, location..."
            style={{
              width: '100%',
              background: '#0d1527',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '8px 12px 8px 34px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Department filter chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '600px' }}>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: selectedDept === dept ? '1px solid #3b82f6' : '1px solid #1e293b',
                background: selectedDept === dept ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                color: selectedDept === dept ? '#60a5fa' : '#94a3b8',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Table Layout */}
      {viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
            overflowY: 'auto',
            flex: 1,
            paddingRight: '4px',
          }}
        >
          {filteredCameras.map((cam) => (
            <div
              key={cam.id}
              className="glass-card glass-card-hover"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#090e1a',
                border: '1px solid #1e293b',
                borderRadius: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>
                      {cam.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(cam.id)}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  🏢 {cam.department}
                </p>
                <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                  📍 {cam.location_name}
                </p>
              </div>

              <div
                style={{
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                }}
              >
                <span style={{ fontFamily: 'monospace', color: '#a5f3fc' }}>
                  {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                </span>
                <span style={{ color: '#60a5fa', fontWeight: '700', fontFamily: 'monospace' }}>
                  {cam.fps_processing} FPS
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="table-responsive-container"
          style={{
            flex: 1,
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            background: '#090e1a',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid var(--border-color)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>CAMERA NAME</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>DEPARTMENT</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>LOCATION</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>GPS COORDINATES</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>STREAM STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCameras.map((cam) => (
                <tr
                  key={cam.id}
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#60a5fa' }}>
                    {cam.name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {cam.department}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {cam.location_name}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#a5f3fc' }}>
                    {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="live-dot" /> {cam.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(cam.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Camera Feed Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-card modal-content-animated"
            style={{
              width: '560px',
              maxWidth: '100%',
              padding: '24px',
              borderRadius: '14px',
              background: '#0d1527',
              border: '1px solid #334155',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  Register CCTV Camera Stream
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Quick Location Preset Selector */}
            <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                QUICK GUJARAT JUNCTION PRESETS:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {locationPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '4px',
                      color: '#93c5fd',
                      fontSize: '10px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    📍 {p.name.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Camera Name / Junction *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. SG Highway - Pakwan Cross Road"
                  style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Government Department *
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    AI Processing FPS *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.fps_processing}
                    onChange={(e) => setFormData({ ...formData, fps_processing: parseInt(e.target.value) || 5 })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  RTSP Stream URL *
                </label>
                <input
                  required
                  type="text"
                  value={formData.rtsp_url}
                  onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
                  placeholder="rtsp://localhost:8554/live_stream"
                  style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Latitude *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Longitude *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Registering...' : 'Register Camera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3500,
            padding: '16px',
          }}
          onClick={() => setDeleteTargetId(null)}
        >
          <div
            className="glass-card modal-content-animated"
            style={{
              width: '400px',
              padding: '20px',
              borderRadius: '12px',
              background: '#0d1527',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              Delete Camera Stream?
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
              Are you sure you want to remove this camera ingest endpoint from the surveillance platform?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
