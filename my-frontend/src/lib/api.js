import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Інтерцептор для підстановки токена в кожен запит
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

const AUTH_PATH     = '/api/auth';
const DATA_PATH     = '/api/data';
const FEATURES_PATH = '/api/features';

export const registerUser = userData =>
  API.post(`${AUTH_PATH}/register`, userData);

export const loginUser = userData =>
  API.post(`${AUTH_PATH}/login`, userData);

export const analyzeImages = formData =>
  // прибрали блок headers
  API.post('/api/data/analyze', formData);

export const calculateFeatures = payload =>
  API.post(`${FEATURES_PATH}/calculate`, payload);
