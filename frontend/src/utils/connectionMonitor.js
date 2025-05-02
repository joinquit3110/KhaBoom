import api from '../services/api';

/**
 * Utility to monitor and verify API/Backend connection
 */

const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

class ConnectionMonitor {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
    this.retryCount = 0;
    this.maxRetries = 3;
    this.timerId = null;
  }

  /**
   * Start monitoring the connection to the backend
   */
  startMonitoring() {
    // Clear any existing timer
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    // Check connection immediately
    this.checkConnection();

    // Set up periodic checking
    this.timerId = setInterval(() => {
      this.checkConnection();
    }, CONNECTION_CHECK_INTERVAL);
  }

  /**
   * Stop monitoring the connection
   */
  stopMonitoring() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Check the connection to the backend API and MongoDB
   */
  async checkConnection() {
    try {
      // Ping the backend API status endpoint
      const response = await api.get('/api/status');
      
      // If we get here, the API is online
      const newConnectionState = true;
      
      // If state changed from disconnected to connected
      if (!this.isConnected && newConnectionState) {
        this.retryCount = 0;
        console.log('✅ Backend connection restored');
      }
      
      this.isConnected = newConnectionState;
      this.notifyListeners();
    } catch (error) {
      // Failed to connect
      this.retryCount++;
      const newConnectionState = false;
      
      // If state changed from connected to disconnected
      if (this.isConnected && !newConnectionState) {
        console.error('⚠️ Backend connection lost:', error.message);
      }
      
      this.isConnected = newConnectionState;
      this.notifyListeners();
      
      // If we've reached max retries, log a more severe warning
      if (this.retryCount >= this.maxRetries) {
        console.error(`❌ Backend connection failed after ${this.retryCount} attempts`);
      }
    }
  }

  /**
   * Add a listener for connection state changes
   * @param {Function} listener - Callback function that receives isConnected state
   */
  addListener(listener) {
    this.listeners.push(listener);
    // Immediately notify with current state
    listener(this.isConnected);
    return () => this.removeListener(listener);
  }

  /**
   * Remove a connection state listener
   * @param {Function} listener - The listener to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of the current connection state
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  /**
   * Get the current connection state
   * @returns {boolean} True if connected
   */
  getConnectionState() {
    return this.isConnected;
  }
}

// Create a singleton instance
const connectionMonitor = new ConnectionMonitor();

export default connectionMonitor;
