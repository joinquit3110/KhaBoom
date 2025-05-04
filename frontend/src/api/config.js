/**
 * API Configuration
 * 
 * This file configures API endpoints for different environments (development, production)
 * and provides unified access to backend services on Render with MongoDB integration.
 */

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // First check for environment variables
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // Check for window.ENV if it's been injected
  if (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE) {
    return window.ENV.API_BASE;
  }
  
  // Fallbacks based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production on Netlify
    if (hostname.includes('netlify.app') || hostname === 'khaboom.netlify.app') {
      return 'https://kha-boom-backend.onrender.com';
    }
    
    // Staging or branch deploys
    if (hostname.includes('deploy-preview') || hostname.includes('branch-deploy')) {
      return 'https://kha-boom-backend-staging.onrender.com';
    }
  }
  
  // Local development default
  return 'http://localhost:3001';
};

// API Routes
const API_ROUTES = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY: '/api/auth/verify'
  },
  
  // User endpoints
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
    SETTINGS: '/api/user/settings'
  },
  
  // Course endpoints
  COURSES: {
    LIST: '/api/courses',
    DETAIL: (id) => `/api/courses/${id}`,
    PROGRESS: (id) => `/api/progress/${id}`,
    CONTENT: (id) => `/api/content/${id}`
  },
  
  // Content endpoints
  CONTENT: {
    MATHIGON: '/mathigon',
    ASSETS: '/mathigon/assets',
    COURSE_CONTENT: (id) => `/mathigon/content/${id}`
  },
  
  // MongoDB health check
  HEALTH: {
    CHECK: '/api/health',
    DB: '/api/health/db'
  }
};

// Create full URLs with base
const createUrl = (path) => {
  const base = getApiBaseUrl();
  
  // If path is already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }
  
  // Otherwise join with base
  return `${base}${path}`;
};

// Export configuration
export default {
  getBaseUrl: getApiBaseUrl,
  routes: API_ROUTES,
  createUrl
};

// Helper to create a full API URL
export const apiUrl = (path) => createUrl(path); 