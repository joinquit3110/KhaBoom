/**
 * KhaBoom Cache Manager
 * 
 * A robust caching system for course content that improves performance and
 * enables offline access through client-side storage.
 */

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  COURSE_LIST: 24 * 60 * 60 * 1000, // 24 hours
  COURSE_CONTENT: 12 * 60 * 60 * 1000, // 12 hours
  USER_PROGRESS: 5 * 60 * 1000 // 5 minutes
};

// Storage mechanisms
const storage = {
  memory: new Map(),
  
  // LocalStorage wrapper with automatic JSON parsing/stringifying
  local: {
    get: (key) => {
      try {
        const item = localStorage.getItem(`khaboom_${key}`);
        if (!item) return null;
        
        const { value, expiry } = JSON.parse(item);
        if (expiry && expiry < Date.now()) {
          localStorage.removeItem(`khaboom_${key}`);
          return null;
        }
        
        return value;
      } catch (err) {
        console.warn('Cache retrieval error:', err);
        return null;
      }
    },
    
    set: (key, value, ttl = null) => {
      try {
        const item = {
          value,
          expiry: ttl ? Date.now() + ttl : null
        };
        localStorage.setItem(`khaboom_${key}`, JSON.stringify(item));
        return true;
      } catch (err) {
        console.warn('Cache storage error:', err);
        return false;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(`khaboom_${key}`);
        return true;
      } catch (err) {
        console.warn('Cache removal error:', err);
        return false;
      }
    }
  }
};

/**
 * Cache Manager API
 */
const cacheManager = {
  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @param {string} storageType - 'memory' or 'local'
   * @returns {any} Cached data or null if not found
   */
  get: (key, storageType = 'memory') => {
    return storage[storageType].get(key);
  },
  
  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   * @param {string} storageType - 'memory' or 'local'
   * @returns {boolean} Success status
   */
  set: (key, data, ttl = null, storageType = 'memory') => {
    return storage[storageType].set(key, data, ttl);
  },
  
  /**
   * Remove data from cache
   * @param {string} key - Cache key
   * @param {string} storageType - 'memory' or 'local'
   * @returns {boolean} Success status
   */
  remove: (key, storageType = 'memory') => {
    return storage[storageType].remove(key);
  },
  
  /**
   * Get or fetch data if not in cache
   * @param {string} key - Cache key 
   * @param {Function} fetchFn - Function to fetch data if not in cache
   * @param {Object} options - Cache options
   * @returns {Promise<any>} Cached or fetched data
   */
  getOrFetch: async (key, fetchFn, options = {}) => {
    const { ttl = null, storageType = 'memory', forceRefresh = false } = options;
    
    if (!forceRefresh) {
      const cachedData = cacheManager.get(key, storageType);
      if (cachedData !== null) {
        return cachedData;
      }
    }
    
    try {
      const freshData = await fetchFn();
      cacheManager.set(key, freshData, ttl, storageType);
      return freshData;
    } catch (error) {
      console.error(`Failed to fetch data for key: ${key}`, error);
      throw error;
    }
  },
  
  /**
   * Clear all caches
   */
  clearAll: () => {
    storage.memory.clear();
    
    // Clear localStorage cache entries
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('khaboom_')) {
        localStorage.removeItem(key);
      }
    });
  },
  
  /**
   * Get cache durations
   */
  DURATIONS: CACHE_DURATIONS
};

export default cacheManager;
