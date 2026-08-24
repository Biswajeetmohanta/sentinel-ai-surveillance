import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Camera APIs
export const fetchCameras = async () => (await apiClient.get('/cameras')).data;
export const createCamera = async (data) => (await apiClient.post('/cameras', data)).data;
export const updateCamera = async (id, data) => (await apiClient.put(`/cameras/${id}`, data)).data;
export const deleteCamera = async (id) => (await apiClient.delete(`/cameras/${id}`)).data;

// Watchlist APIs
export const fetchWatchlist = async (params) => (await apiClient.get('/watchlist', { params })).data;
export const createWatchlistEntry = async (data) => (await apiClient.post('/watchlist', data)).data;
export const updateWatchlistEntry = async (id, data) => (await apiClient.put(`/watchlist/${id}`, data)).data;
export const deleteWatchlistEntry = async (id) => (await apiClient.delete(`/watchlist/${id}`)).data;
export const bulkImportWatchlist = async (formData) => (
  await apiClient.post('/watchlist/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
).data;

// Detection & Trajectory APIs
export const fetchDetections = async (params) => (await apiClient.get('/detections', { params })).data;
export const fetchVehicleTrajectory = async (plateNumber, hours = 48) => (
  await apiClient.get(`/detections/trajectory/${encodeURIComponent(plateNumber)}`, { params: { hours } })
).data;

// Stats APIs
export const fetchDashboardStats = async () => (await apiClient.get('/stats/overview')).data;
