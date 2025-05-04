/**
 * API Client for KhaBoom Learning Platform
 * 
 * Handles communication with the Render backend and MongoDB database
 * while providing error handling and authentication.
 */

import config from './config';

// Default request options
const DEFAULT_OPTIONS = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
};

/**
 * Get auth token from local storage
 */
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Add auth token to request headers if available
 */
const addAuthHeader = (options = {}) => {
  const token = getAuthToken();
  
  if (!token) return options;
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return { ...options, headers };
};

/**
 * Make API request with proper error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    // Build the full URL
    const url = config.createUrl(endpoint);
    
    // Add auth header if token exists
    const fetchOptions = addAuthHeader({
      ...DEFAULT_OPTIONS,
      ...options
    });
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    // If the response is not ok, throw an error
    if (!response.ok) {
      const errorText = await response.text();
      let error;
      
      try {
        // Try to parse the error as JSON
        error = JSON.parse(errorText);
      } catch (e) {
        // If parsing fails, use the raw text
        error = { message: errorText || `Error: ${response.status}` };
      }
      
      // Handle 401 (Unauthorized) by clearing token
      if (response.status === 401) {
        localStorage.removeItem('token');
        
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
      
      throw error;
    }
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // For non-JSON responses
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API Client
const apiClient = {
  /**
   * Fetch courses from MongoDB via Render backend
   */
  getCourses: async () => {
    return apiRequest(config.routes.COURSES.LIST);
  },
  
  /**
   * Get course details
   */
  getCourse: async (courseId) => {
    return apiRequest(config.routes.COURSES.DETAIL(courseId));
  },
  
  /**
   * Get user progress for a course from MongoDB
   */
  getCourseProgress: async (courseId) => {
    return apiRequest(config.routes.COURSES.PROGRESS(courseId));
  },
  
  /**
   * Update user progress in MongoDB
   */
  updateProgress: async (courseId, progress) => {
    return apiRequest(config.routes.COURSES.PROGRESS(courseId), {
      method: 'POST',
      body: JSON.stringify(progress)
    });
  },
  
  /**
   * Authenticate user with MongoDB
   */
  login: async (credentials) => {
    const response = await apiRequest(config.routes.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // Store the token
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  },
  
  /**
   * Register new user in MongoDB
   */
  register: async (userData) => {
    return apiRequest(config.routes.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  /**
   * Logout user
   */
  logout: async () => {
    // Call logout endpoint if needed
    try {
      await apiRequest(config.routes.AUTH.LOGOUT);
    } catch (e) {
      // Ignore errors
    }
    
    // Clear local token
    localStorage.removeItem('token');
  },
  
  /**
   * Check if MongoDB connection is healthy
   */
  checkDatabaseHealth: async () => {
    try {
      return await apiRequest(config.routes.HEALTH.DB);
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
};

export default apiClient; 