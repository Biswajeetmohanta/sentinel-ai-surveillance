import React, { useState, useEffect } from 'react';
import { Shield, Plus, Upload, Trash2, Search, Filter, Download, AlertTriangle, X, Check } from 'lucide-react';
import { fetchWatchlist, createWatchlistEntry, deleteWatchlistEntry, bulkImportWatchlist } from '../services/api';
import { useToast } from './Toast';

export default function WatchlistManager() {
  const [watchlist, setWatchlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();

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
    if (!formData.plate_number.trim()) return;

    setIsSubmitting(true);
    try {
      await createWatchlistEntry(formData);
      setShowAddModal(false);
      addToast(`Vehicle ${formData.plate_number} added to suspect hotlist!`, 'success');
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
      addToast('Error: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteWatchlistEntry(deleteTargetId);
      addToast('Vehicle removed from hotlist successfully.', 'info');
      setDeleteTargetId(null);
      loadData();
    } catch (err) {
      addToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    try {
      const res = await bulkImportWatchlist(data);
      addToast(`Successfully imported ${res.imported_records} watchlist records!`, 'success');
      loadData();
    } catch (err) {
      addToast('Bulk CSV import failed: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,plate_number,crime_category,priority,fir_number,police_station,vehicle_type,vehicle_make_model\n' +
      'GJ01AB9999,Stolen Vehicle,CRITICAL,FIR-2026/088,Ahmedabad Crime Branch,Car,Hyundai Creta\n' +
      'GJ27CD1122,Hit & Run Case,HIGH,FIR-2026/102,Gandhinagar Traffic PS,Truck,Tata 407\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sentinel_hotlist_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredWatchlist = watchlist.filter((item) => {
    const matchesCategory = categoryFilter === 'ALL' || item.crime_category === categoryFilter;
    const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
    return matchesCategory && matchesPriority;
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
      {/* Header & Action Toolbar */}
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
            <Shield size={22} color="#ef4444" />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              Suspect &amp; Stolen Vehicle Watchlist (Hotlist)
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Automated instantaneous red-flag interception across all CCTV cameras
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="btn-secondary"
            title="Download CSV template format"
          >
            <Download size={15} />
            CSV Template
          </button>

          <label
            className="btn-secondary"
            style={{ cursor: 'pointer' }}
          >
            <Upload size={15} />
            Bulk CSV Import
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            Add Suspect Vehicle
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by plate number (e.g. GJ01)..."
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

        {/* Priority Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setPriorityFilter(lvl)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: priorityFilter === lvl ? '1px solid #3b82f6' : '1px solid #1e293b',
                background: priorityFilter === lvl ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                color: priorityFilter === lvl ? '#60a5fa' : '#94a3b8',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              {lvl === 'ALL' ? 'All Priorities' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Table */}
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
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>NUMBER PLATE</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>CRIME CATEGORY</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>PRIORITY</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>FIR / CASE NUMBER</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>POLICE STATION</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>VEHICLE MODEL</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredWatchlist.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                  <Shield size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px' }}>No suspect vehicles match current filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredWatchlist.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span className="plate-badge">{item.plate_number}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#fca5a5' }}>
                    {item.crime_category}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: item.priority === 'CRITICAL' ? '#ef4444' : item.priority === 'HIGH' ? '#f59e0b' : '#3b82f6',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                    {item.fir_number || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {item.police_station}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {item.vehicle_make_model || item.vehicle_type}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(item.id)}
                      title="Remove from hotlist"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Suspect Vehicle Modal */}
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
              width: '520px',
              maxWidth: '100%',
              padding: '24px',
              borderRadius: '14px',
              background: '#0d1527',
              border: '1px solid #334155',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="#ef4444" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  Add Vehicle to Suspect Hotlist
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Live Plate Preview Card */}
            {formData.plate_number && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>LIVE ANPR TARGET PREVIEW</span>
                <span className="plate-badge" style={{ fontSize: '16px' }}>
                  {formData.plate_number}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Vehicle Plate Number (HSRP) *
                </label>
                <input
                  required
                  type="text"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  placeholder="e.g. GJ01AB9999"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontWeight: '700',
                    fontSize: '14px',
                    letterSpacing: '1px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Crime Category *
                  </label>
                  <select
                    value={formData.crime_category}
                    onChange={(e) => setFormData({ ...formData, crime_category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="Stolen Vehicle">Stolen Vehicle</option>
                    <option value="Hit & Run Case">Hit &amp; Run Case</option>
                    <option value="Wanted Suspect">Wanted Suspect</option>
                    <option value="Kidnapping Investigation">Kidnapping Investigation</option>
                    <option value="Illegal Sand/Liquor Smuggling">Illegal Sand/Liquor Smuggling</option>
                    <option value="Traffic Violation Hotlist">Traffic Violation Hotlist</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Interception Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="CRITICAL">CRITICAL (Red Siren)</option>
                    <option value="HIGH">HIGH (Urgent Alert)</option>
                    <option value="MEDIUM">MEDIUM (Standard Flag)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    FIR / Case Number
                  </label>
                  <input
                    type="text"
                    value={formData.fir_number}
                    onChange={(e) => setFormData({ ...formData, fir_number: e.target.value })}
                    placeholder="e.g. FIR-2026/088-Navrangpura"
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Police Station / Branch
                  </label>
                  <input
                    type="text"
                    value={formData.police_station}
                    onChange={(e) => setFormData({ ...formData, police_station: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Vehicle Model / Color / Make
                </label>
                <input
                  type="text"
                  value={formData.vehicle_make_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_make_model: e.target.value })}
                  placeholder="e.g. White Maruti Swift DZire"
                  style={{ width: '100%', padding: '9px 12px', background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
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
                  {isSubmitting ? 'Saving...' : 'Save to Hotlist'}
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
              Remove from Hotlist?
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
              Are you sure you want to remove this vehicle from active surveillance alerts?
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
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
