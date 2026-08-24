import React, { useState, useEffect } from 'react';
import { Shield, Plus, Upload, Trash2, Edit2, Search, Filter } from 'lucide-react';
import { fetchWatchlist, createWatchlistEntry, deleteWatchlistEntry, bulkImportWatchlist } from '../services/api';

export default function WatchlistManager() {
  const [watchlist, setWatchlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '',
    owner_name: '',
    vehicle_make_model: '',
    vehicle_type: 'Car',
    crime_category: 'Stolen Vehicle',
    fir_number: '',
    police_station: 'Ahmedabad Crime Branch',
    priority: 'HIGH',
    notes: '',
  });

  const loadData = async () => {
    try {
      const data = await fetchWatchlist({ q: searchTerm });
      setWatchlist(data);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWatchlistEntry(formData);
      setShowAddModal(false);
      setFormData({
        plate_number: '',
        owner_name: '',
        vehicle_make_model: '',
        vehicle_type: 'Car',
        crime_category: 'Stolen Vehicle',
        fir_number: '',
        police_station: 'Ahmedabad Crime Branch',
        priority: 'HIGH',
        notes: '',
      });
      loadData();
    } catch (err) {
      alert('Error creating watchlist entry: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this vehicle from the hotlist?')) {
      await deleteWatchlistEntry(id);
      loadData();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    try {
      const res = await bulkImportWatchlist(data);
      alert(`Imported ${res.imported_records} entries successfully!`);
      loadData();
    } catch (err) {
      alert('Bulk import failed.');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
            Suspect &amp; Stolen Vehicle Watchlist (Hotlist)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Real-time automatic interception triggers across all connected CCTV cameras
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{
            background: '#1f2937',
            border: '1px solid #374151',
            color: '#e5e7eb',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Upload size={16} />
            Bulk CSV Import
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

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
            Add Suspect Vehicle
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by plate number (e.g. GJ01)..."
          style={{
            width: '320px',
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      {/* Watchlist Table */}
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#111827', borderBottom: '1px solid var(--border-color)', color: '#9ca3af' }}>
              <th style={{ padding: '12px 16px' }}>NUMBER PLATE</th>
              <th style={{ padding: '12px 16px' }}>CRIME CATEGORY</th>
              <th style={{ padding: '12px 16px' }}>PRIORITY</th>
              <th style={{ padding: '12px 16px' }}>FIR / CASE NUMBER</th>
              <th style={{ padding: '12px 16px' }}>POLICE STATION</th>
              <th style={{ padding: '12px 16px' }}>VEHICLE INFO</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span className="plate-badge">{item.plate_number}</span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#fca5a5' }}>
                  {item.crime_category}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: item.priority === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    {item.priority}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#d1d5db' }}>
                  {item.fir_number || 'N/A'}
                </td>
                <td style={{ padding: '12px 16px', color: '#9ca3af' }}>
                  {item.police_station}
                </td>
                <td style={{ padding: '12px 16px', color: '#9ca3af' }}>
                  {item.vehicle_make_model || item.vehicle_type}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(item.id)}
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

      {/* Add Modal */}
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
              Add Suspect Vehicle to Watchlist
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af' }}>Number Plate *</label>
                <input
                  required
                  type="text"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. GJ01XX0000"
                  style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af' }}>Crime Category *</label>
                  <select
                    value={formData.crime_category}
                    onChange={(e) => setFormData({ ...formData, crime_category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="Stolen Vehicle">Stolen Vehicle</option>
                    <option value="Hit & Run Case">Hit &amp; Run Case</option>
                    <option value="Wanted Suspect">Wanted Suspect</option>
                    <option value="Kidnapping Investigation">Kidnapping Investigation</option>
                    <option value="Traffic Violation Hotlist">Traffic Violation Hotlist</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af' }}>Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="CRITICAL">CRITICAL (Red Siren)</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#9ca3af' }}>FIR Number</label>
                <input
                  type="text"
                  value={formData.fir_number}
                  onChange={(e) => setFormData({ ...formData, fir_number: e.target.value })}
                  placeholder="e.g. FIR-2026/102-Sola"
                  style={{ width: '100%', padding: '8px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                />
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
                  Save to Hotlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
