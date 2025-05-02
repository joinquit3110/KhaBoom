import React from 'react';

/**
 * LoadingSpinner component
 * Displays an animated loading spinner with optional message
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'medium', fullPage = false }) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return { width: '30px', height: '30px' };
      case 'large':
        return { width: '80px', height: '80px' };
      case 'medium':
      default:
        return { width: '50px', height: '50px' };
    }
  };

  const spinnerStyle = getSpinnerSize();
  
  const containerClass = fullPage 
    ? 'loading-container loading-fullpage' 
    : 'loading-container';

  return (
    <div className={containerClass}>
      <div className="spinner" style={spinnerStyle}>
        <div className="spinner-inner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
