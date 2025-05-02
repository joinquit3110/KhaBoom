/**
 * Utility for handling API errors in the frontend
 */

// Convert API error responses to user-friendly messages
export const formatApiError = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle axios error responses
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    const { status, data } = error.response;

    // Handle different status codes
    switch (status) {
      case 400:
        return data.error || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.error || `Error: ${status}`;
    }
  }
  
  // Network errors
  if (error.request) {
    // The request was made but no response was received
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  // Other errors
  return error.message || 'An unexpected error occurred';
};

// Log errors with additional context
export const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    context,
    message: error.message || 'No error message',
    stack: error.stack || 'No stack trace',
  };
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('API Error:', errorDetails);
  }
  
  // In production, we could send this to a logging service
  if (import.meta.env.PROD) {
    // Simplified logging for production - could be replaced with an actual service
    console.error('Error:', errorDetails.message);
  }
  
  return errorDetails;
};

// Retry mechanism for failed API calls
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = error.response?.status >= 500 || error.code === 'ECONNABORTED';
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  
  throw lastError;
};
