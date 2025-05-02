/**
 * Enhanced API Client with Retry Logic
 * 
 * Wraps the base axios API client with automatic retry capabilities,
 * offline detection, and improved error handling.
 */

import api from '../services/api';
import { checkOnlineStatus, notifyError } from './errorHandler';

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  retries: 3,             // Number of retry attempts
  retryDelay: 1000,       // Initial delay between retries (ms)
  retryBackoff: 1.5,      // Exponential backoff factor
  retryStatusCodes: [408, 429, 500, 502, 503, 504], // Status codes to retry
  retryMethods: ['get', 'head', 'options', 'put', 'delete', 'post', 'patch'],
};

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise} Promise that resolves after ms milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * API client with automatic retry
 */
const apiWithRetry = {
  /**
   * Make an API request with retry capability
   * @param {string} method HTTP method
   * @param {string} url Request URL
   * @param {Object} data Request payload
   * @param {Object} config Axios and retry configuration
   * @returns {Promise} Promise that resolves with the response
   */
  request: async (method, url, data = null, config = {}) => {
    // Extract retry config
    const {
      retries = DEFAULT_RETRY_CONFIG.retries,
      retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
      retryBackoff = DEFAULT_RETRY_CONFIG.retryBackoff,
      retryStatusCodes = DEFAULT_RETRY_CONFIG.retryStatusCodes,
      retryMethods = DEFAULT_RETRY_CONFIG.retryMethods,
      ...axiosConfig
    } = config;

    // Only retry if the method is in retryMethods
    const shouldRetry = retryMethods.includes(method.toLowerCase());
    let lastError = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // Wait for online status if offline
        if (!checkOnlineStatus()) {
          console.log('Device is offline, waiting for connectivity...');
          // Wait until online before continuing
          await new Promise(resolve => {
            const handleOnline = () => {
              window.removeEventListener('online', handleOnline);
              resolve();
            };
            window.addEventListener('online', handleOnline);
          });
        }

        // Make the request
        const response = method.toLowerCase() === 'get' 
          ? await api.get(url, axiosConfig)
          : method.toLowerCase() === 'post'
            ? await api.post(url, data, axiosConfig)
            : method.toLowerCase() === 'put'
              ? await api.put(url, data, axiosConfig)
              : method.toLowerCase() === 'delete'
                ? await api.delete(url, axiosConfig)
                : await api.request({
                    method,
                    url,
                    data,
                    ...axiosConfig
                  });

        return response;
      } catch (error) {
        lastError = error;
        attempt++;

        // Only retry if we have attempts left and should retry for this error
        if (
          attempt <= retries && 
          shouldRetry && 
          (
            // Retry on network errors
            error.message === 'Network Error' ||
            // Retry on specific status codes
            (error.response && retryStatusCodes.includes(error.response.status))
          )
        ) {
          // Calculate delay with exponential backoff
          const delay = retryDelay * Math.pow(retryBackoff, attempt - 1);
          console.log(`API request to ${url} failed, retrying (${attempt}/${retries}) after ${delay}ms...`);
          
          // Wait before retrying
          await sleep(delay);
          continue;
        }

        // If we reach here, we're out of retries or shouldn't retry
        notifyError(error, `API request to ${url}`);
        throw error;
      }
    }
  },

  /**
   * GET request with retry
   * @param {string} url Request URL
   * @param {Object} config Request configuration
   * @returns {Promise} Promise that resolves with the response
   */
  get: (url, config = {}) => apiWithRetry.request('get', url, null, config),

  /**
   * POST request with retry
   * @param {string} url Request URL
   * @param {Object} data Request payload
   * @param {Object} config Request configuration
   * @returns {Promise} Promise that resolves with the response
   */
  post: (url, data, config = {}) => apiWithRetry.request('post', url, data, config),

  /**
   * PUT request with retry
   * @param {string} url Request URL
   * @param {Object} data Request payload
   * @param {Object} config Request configuration
   * @returns {Promise} Promise that resolves with the response
   */
  put: (url, data, config = {}) => apiWithRetry.request('put', url, data, config),

  /**
   * DELETE request with retry
   * @param {string} url Request URL
   * @param {Object} config Request configuration
   * @returns {Promise} Promise that resolves with the response
   */
  delete: (url, config = {}) => apiWithRetry.request('delete', url, null, config),
};

export default apiWithRetry;
