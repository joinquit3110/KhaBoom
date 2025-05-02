import axios from 'axios';

// Create axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:10000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (userData) => api.put('/api/auth/profile', userData)
};

// Content services
export const contentService = {
  getCourseList: () => api.get('/api/courses'),
  getCourse: (courseId) => api.get(`/api/courses/${courseId}`),
  getContent: (courseId, section) => api.get(`/api/content/${courseId}/${section}`),
  searchContent: (query) => api.get(`/api/content/search?q=${encodeURIComponent(query)}`)
};

// Progress tracking services
export const progressService = {
  getAllProgress: () => api.get('/api/progress'),
  getCourseProgress: (courseId) => api.get(`/api/progress/${courseId}`),
  updateProgress: (courseId, data) => api.post(`/api/progress/${courseId}`, data)
};

export default api;
