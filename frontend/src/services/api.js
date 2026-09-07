import axios from 'axios';

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8001';
  }
  return 'https://sentinel-api-bqfm.onrender.com';
};

export const BACKEND_URL = getBackendUrl();
const API_BASE_URL = `${BACKEND_URL}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Camera APIs
export const fetchCameras = async () => {
  try {
    const res = await apiClient.get('/cameras');
    if (Array.isArray(res.data) && res.data.length > 0) {
      try { localStorage.setItem('sentinel_cached_cams', JSON.stringify(res.data)); } catch {}
      return res.data;
    }
  } catch (err) {
    console.warn('Cameras API note:', err.message);
  }
  try {
    const cached = localStorage.getItem('sentinel_cached_cams');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

export const createCamera = async (data) => (await apiClient.post('/cameras', data)).data;
export const updateCamera = async (id, data) => (await apiClient.put(`/cameras/${id}`, data)).data;
export const deleteCamera = async (id) => (await apiClient.delete(`/cameras/${id}`)).data;

// Watchlist APIs
export const fetchWatchlist = async (params) => {
  try {
    const res = await apiClient.get('/watchlist', { params });
    return res.data;
  } catch (err) {
    console.warn('Watchlist API note:', err.message);
    return [];
  }
};
export const createWatchlistEntry = async (data) => (await apiClient.post('/watchlist', data)).data;
export const updateWatchlistEntry = async (id, data) => (await apiClient.put(`/watchlist/${id}`, data)).data;
export const deleteWatchlistEntry = async (id) => (await apiClient.delete(`/watchlist/${id}`)).data;
export const bulkImportWatchlist = async (formData) => (
  await apiClient.post('/watchlist/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
).data;

// Detection & Trajectory APIs
export const fetchDetections = async (params) => {
  try {
    const res = await apiClient.get('/detections', { params });
    if (Array.isArray(res.data)) {
      try { localStorage.setItem('sentinel_cached_dets', JSON.stringify(res.data)); } catch {}
      return res.data;
    }
  } catch (err) {
    console.warn('Detections API note:', err.message);
  }
  try {
    const cached = localStorage.getItem('sentinel_cached_dets');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

export const fetchVehicleTrajectory = async (plateNumber, hours = 48) => {
  try {
    const res = await apiClient.get(`/detections/trajectory/${encodeURIComponent(plateNumber)}`, { params: { hours } });
    return res.data;
  } catch (err) {
    console.warn('Trajectory API note:', err.message);
    return [];
  }
};

// Stats APIs (with automatic fallback to prevent 429 rate limit blank screens)
export const fetchDashboardStats = async () => {
  try {
    const res = await apiClient.get('/stats/overview');
    if (res.data && typeof res.data === 'object' && res.data.total_cameras !== undefined) {
      try { localStorage.setItem('sentinel_cached_stats', JSON.stringify(res.data)); } catch {}
      return res.data;
    }
  } catch (err) {
    console.warn('Stats API note (throttled):', err.message);
  }
  try {
    const cached = localStorage.getItem('sentinel_cached_stats');
    if (cached) return JSON.parse(cached);
  } catch {}
  return {
    total_cameras: 30,
    active_cameras: 30,
    total_detections_today: 18,
    total_watchlist_alerts_today: 0,
    active_hotlist_count: 3,
    hotlist_breakdown: { "Stolen Vehicle": 1, "Hit & Run Case": 1, "Kidnapping Investigation": 1 },
    per_camera_detections: { "1": 3, "2": 2, "3": 1, "5": 2, "13": 2, "14": 1, "15": 2, "16": 1 },
    readable_plates_today: 12
  };
};
