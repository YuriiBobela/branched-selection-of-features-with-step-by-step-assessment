import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AUTH_PATH = '/api/auth';
const FEATURES_PATH = '/api/features';
const DATA_PATH = '/api/data';
const HISTORY_PATH = '/api/history';

export const registerUser = (userData) =>
  API.post(`${AUTH_PATH}/register`, userData);

export const loginUser = (userData) =>
  API.post(`${AUTH_PATH}/login`, userData);


export const analyzeImages = (formData) =>
  API.post(`${DATA_PATH}/analyze`, formData);

export const selectFeatures = () =>
  API.get(`${FEATURES_PATH}/select`);

export const branchedFeatureSelection = (formData) =>
  API.post(`${DATA_PATH}/branched-select`, formData);

export const getHistory = () =>
  API.get(`${HISTORY_PATH}/my`);

export const getHistoryById = (id) =>
  API.get(`${HISTORY_PATH}/item/${id}`);

export const deleteHistoryItem = (id) =>
  API.delete(`${HISTORY_PATH}/item/${id}`);