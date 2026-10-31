import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Vehicles
export const vehicleAPI = {
  getMyVehicles: () => api.get('/vehicles/'),
  createVehicle: (data) => api.post('/vehicles/', data),
  updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
};

// Parking Locations
export const parkingAPI = {
  getLocations: (params) => api.get('/parking-locations/', { params }),
  getLocation: (id) => api.get(`/parking-locations/${id}`),
  createLocation: (data) => api.post('/parking-locations/', data),
  updateLocation: (id, data) => api.put(`/parking-locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/parking-locations/${id}`),
};

// Slots
export const slotAPI = {
  getSlotsByLocation: (locationId, params) => api.get(`/slots/location/${locationId}`, { params }),
  getSlot: (id) => api.get(`/slots/${id}`),
  createSlot: (data) => api.post('/slots/', data),
  updateSlot: (id, data) => api.put(`/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/slots/${id}`),
};

// Reservations
export const reservationAPI = {
  createReservation: (data) => api.post('/reservations/', data),
  getMyReservations: () => api.get('/reservations/my'),
  getAllReservations: () => api.get('/reservations/all'),
  getReservation: (id) => api.get(`/reservations/${id}`),
  cancelReservation: (id) => api.put(`/reservations/${id}/cancel`),
};

// Parking Logs
export const parkingLogAPI = {
  checkIn: (data) => api.post('/parking-logs/check-in', data),
  checkOut: (data) => api.post('/parking-logs/check-out', data),
  getLogs: () => api.get('/parking-logs/'),
  getVehicleLogs: (vehicleId) => api.get(`/parking-logs/vehicle/${vehicleId}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getDailyReservations: () => api.get('/admin/charts/daily-reservations'),
  getRevenueTrend: () => api.get('/admin/charts/revenue-trend'),
  getSlotDistribution: () => api.get('/admin/charts/slot-distribution'),
  getPeakHours: () => api.get('/admin/charts/peak-hours'),
  getUsers: () => api.get('/admin/users'),
  getVehicles: () => api.get('/admin/vehicles'),
};

// Predictions
export const predictionAPI = {
  getOccupancyPredictions: () => api.get('/predictions/occupancy'),
};

export default api;
