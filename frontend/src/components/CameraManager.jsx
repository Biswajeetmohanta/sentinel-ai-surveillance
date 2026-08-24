import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Globe, Radio } from 'lucide-react';
import { fetchCameras, createCamera, deleteCamera } from '../services/api';

export default function CameraManager() {
  const [cameras, setCameras] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: 'Gujarat Traffic Police',
    location_name: '',
    latitude: 23.0286,
    longitude: 72.5068,
    rtsp_url: 'rtsp://localhost:8554/cam_new',
    fps_processing: 5,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCamera(formData);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Error creating camera: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this camera feed?')) {
      await deleteCamera(id);
      loadData();
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
            Multi-Department CCTV Camera Network
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Aggregated RTSP feeds across 26 Gujarat Government departments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          Register New CCTV Stream
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#111827', borderBottom: '1px solid var(--border-color)', color: '#9ca3af' }}>
              <th style={{ padding: '12px 16px' }}>CAMERA NAME</th>
              <th style={{ padding: '12px 16px' }}>DEPARTMENT</th>
              <th style={{ padding: '12px 16px' }}>LOCATION</th>
              <th style={{ padding: '12px 16px' }}>GPS COORDINATES</th>
              <th style={{ padding: '12px 16px' }}>STREAM STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {cameras.map((cam) => (
              <tr key={cam.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#60a5fa' }}>
                  {cam.name}
                </td>
                <td style={{ padding: '12px 16px', color: '#d1d5db' }}>
                  {cam.department}
                </td>
                <td style={{ padding: '12px 16px', color: '#9ca3af' }}>
                  {cam.location_name}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#a5f3fc' }}>
                  {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="live-dot" /> {cam.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(cam.id)}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div className="glass-card" style={{ width: '480px', padding: '24px', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
              Register CCTV Camera Feed
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af' }}>Camera Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. SG Highway - Pakwan Cross Road"
                  style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af' }}>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af' }}>RTSP Stream URL *</label>
                <input
                  required
                  type="text"
                  value={formData.rtsp_url}
                  onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af' }}>Latitude *</label>
                  <input
                    required
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af' }}>Longitude *</label>
                  <input
                    required
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #4b5563', borderRadius: '6px', color: '#e5e7eb', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', background: '#2563eb', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Save Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
