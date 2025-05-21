import axios from 'axios';

// Створення інстансу Axios з базовим URL (беремо з .env змінної VITE_API_URL)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Інтерцептор: додаємо токен авторизації до кожного запиту, якщо він є в localStorage
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

// Шлях для різних груп API
const AUTH_PATH = '/api/auth';
const FEATURES_PATH = '/api/features';
const DATA_PATH = '/api/data';

// Функції для виклику відповідних ендпоінтів бекенду:
export const registerUser = (userData) =>
  API.post(`${AUTH_PATH}/register`, userData);

export const loginUser = (userData) =>
  API.post(`${AUTH_PATH}/login`, userData);

// Аналіз зображень: очікується FormData з полями images[] та labels
export const analyzeImages = (formData) =>
  API.post(`${DATA_PATH}/analyze`, formData);

// Обчислення ознак (може не знадобитися окремо, якщо /analyze виконує і розрахунок MI)
// export const calculateFeatures = (payload) =>
//   API.post(`${FEATURES_PATH}/calculate`, payload);

// Покроковий вибір ознак
export const selectFeatures = () =>
  API.get(`${FEATURES_PATH}/select`);

// Тренування моделі
export const trainModel = (formData) =>
  API.post('/api/train', formData);

// Класифікація нового зображення
export const classifyImage = (formData) =>
  API.post(`${FEATURES_PATH}/predict`, formData);
