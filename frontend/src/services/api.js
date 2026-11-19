import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? '' : 'http://127.0.0.1:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrovision_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('agrovision_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem('agrovision_access_token', newAccessToken);
          if (res.data.refresh) {
            localStorage.setItem('agrovision_refresh_token', res.data.refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('agrovision_access_token');
          localStorage.removeItem('agrovision_refresh_token');
          localStorage.removeItem('agrovision_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const authService = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (data) => api.patch('/api/auth/profile/', data),
  updateFarmerProfile: (data) => api.patch('/api/auth/farmer-profile/', data),
};

export const farmService = {
  getFarms: () => api.get('/api/farms/records/'),
  getFarm: (id) => api.get(`/api/farms/records/${id}/`),
  createFarm: (farmData) => api.post('/api/v1/farms/', farmData),
  updateFarm: (id, farmData) => api.put(`/api/farms/records/${id}/`, farmData),
  deleteFarm: (id) => api.delete(`/api/farms/records/${id}/`),
  getSummary: () => api.get('/api/farms/summary/'),
  getSoilRecords: (farmId) => api.get(`/api/farms/soil-records/?farm_id=${farmId}`),
  scanSoilCard: (formData) => api.post('/api/farms/soil-card/ocr/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const cropService = {
  getCrops: () => api.get('/api/crops/list/'),
  getCropDetail: (id) => api.get(`/api/crops/detail/${id}/`),
  getSeasons: () => api.get('/api/crops/seasons/'),
  getLocations: (state = '') => api.get(`/api/crops/locations/${state ? `?state=${state}` : ''}`),
};

export const predictionService = {
  getHistory: (farmId = '') => api.get(`/api/predictions/history/${farmId ? `?farm_id=${farmId}` : ''}`),
  predictPreSowing: (data) => api.post('/api/predictions/pre-sowing/', data),
  predictInSeason: (data) => api.post('/api/predictions/in-season/', data),
  getProgression: (farmId = '') => api.get(`/api/predictions/progression/${farmId ? `?farm_id=${farmId}` : ''}`),
  estimatePMFBYClaim: (data) => api.post('/api/predictions/pmfby-claim/', data),
};

export const weatherService = {
  getCurrent: (lat, lon, farmId = '') => {
    let url = '/api/weather/current/';
    const params = [];
    if (farmId) params.push(`farm_id=${farmId}`);
    if (lat !== undefined && lat !== null && !isNaN(lat)) params.push(`lat=${lat}`);
    if (lon !== undefined && lon !== null && !isNaN(lon)) params.push(`lon=${lon}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return api.get(url);
  },
  getForecast: (lat, lon, farmId = '') => {
    let url = '/api/weather/forecast/';
    const params = [];
    if (farmId) params.push(`farm_id=${farmId}`);
    if (lat !== undefined && lat !== null && !isNaN(lat)) params.push(`lat=${lat}`);
    if (lon !== undefined && lon !== null && !isNaN(lon)) params.push(`lon=${lon}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return api.get(url);
  },
  getAlerts: (farmId = '') => api.get(`/api/weather/alerts/${farmId ? `?farm_id=${farmId}` : ''}`),
  syncLocationWeather: () => api.post('/api/weather/sync/'),
};

export const diseaseService = {
  predict: (formData) => api.post('/api/disease/predict/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  predictBase64: (data) => api.post('/api/disease/predict/', data),
  getHistory: () => api.get('/api/disease/history/'),
  getDetail: (id) => api.get(`/api/disease/detail/${id}/`),
  requestConsultation: (id) => api.post(`/api/disease/consult/${id}/`),
  getPrescription: (id) => api.get(`/api/disease/prescription/${id}/`),
  getCatalog: (crop = '') => api.get(`/api/disease/catalog/${crop ? `?crop=${crop}` : ''}`),
  getSamples: () => api.get('/api/disease/samples/'),
};

export const marketService = {
  getPrices: (crop = '', state = '') => api.get(`/api/market/prices/?crop=${crop}&state=${state}`),
  comparePrices: (crop) => api.get(`/api/market/compare/?crop=${crop}`),
  getTrends: (crop, mandi) => api.get(`/api/market/trends/?crop=${crop}&mandi=${mandi}`),
};

export const assistantService = {
  sendMessage: (message, language = 'en') => api.post('/api/assistant/chat/', { message, language }),
  getHistory: () => api.get('/api/assistant/history/'),
};

export const notificationService = {
  getNotifications: () => api.get('/api/notifications/'),
  markAsRead: (id) => api.post(`/api/notifications/${id}/read/`),
  getPlantNutrition: (crop = 'Soybean') => api.get(`/api/notifications/plant-nutrition/?crop=${crop}`),
  sendCropAdvisoryEmail: (data) => api.post('/api/notifications/send-crop-advisory-email/', data),
};

export const systemService = {
  getHealth: () => api.get('/api/health/'),
};

export default api;
