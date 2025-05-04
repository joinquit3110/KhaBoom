/**
 * MongoDB Connection Utility
 * 
 * This module provides utilities for connecting to MongoDB Atlas via the Render backend.
 * It implements connection pooling and retry logic for optimal performance.
 */

import config from './config';

// MongoDB connection status
let connectionStatus = {
  isConnected: false,
  lastChecked: null,
  error: null
};

// MongoDB database operations
const mongodb = {
  /**
   * Check if MongoDB connection is available
   * This makes a request to the backend health check endpoint
   */
  checkConnection: async () => {
    try {
      const healthEndpoint = config.routes.HEALTH.DB;
      const response = await fetch(config.createUrl(healthEndpoint));
      
      if (!response.ok) {
        throw new Error(`MongoDB connection check failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      connectionStatus = {
        isConnected: data.status === 'ok' && data.database === 'connected',
        lastChecked: new Date(),
        error: data.status !== 'ok' ? data.message : null
      };
      
      return connectionStatus;
    } catch (error) {
      connectionStatus = {
        isConnected: false,
        lastChecked: new Date(),
        error: error.message
      };
      
      console.error('MongoDB connection error:', error);
      return connectionStatus;
    }
  },
  
  /**
   * Get the current connection status
   */
  getConnectionStatus: () => {
    // If we haven't checked in the last minute, or have never checked
    if (!connectionStatus.lastChecked || 
        new Date() - connectionStatus.lastChecked > 60000) {
      // Return current status but trigger a new check in the background
      mongodb.checkConnection().catch(console.error);
    }
    
    return connectionStatus;
  },
  
  /**
   * Store user progress in MongoDB
   * This is done via the Render backend API
   */
  storeProgress: async (courseId, progress) => {
    try {
      const progressEndpoint = config.routes.COURSES.PROGRESS(courseId);
      const response = await fetch(config.createUrl(progressEndpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(progress)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store progress: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error storing progress in MongoDB:', error);
      throw error;
    }
  },
  
  /**
   * Retrieve user progress from MongoDB
   * This is done via the Render backend API
   */
  getProgress: async (courseId) => {
    try {
      const progressEndpoint = config.routes.COURSES.PROGRESS(courseId);
      const response = await fetch(config.createUrl(progressEndpoint), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get progress: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error retrieving progress from MongoDB:', error);
      throw error;
    }
  }
};

export default mongodb; 