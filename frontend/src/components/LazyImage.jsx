import React, { useState, useEffect } from 'react';

const LazyImage = ({ src, alt, className, width, height }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Use a placeholder while the image loads
  const placeholderSrc = `/images/placeholder.svg`;
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
    console.warn(`Failed to load image: ${src}`);
  };

  return (
    <div className={`lazy-image-container ${className || ''}`} style={{ width, height }}>
      {!isLoaded && !error && (
        <div className="image-placeholder" style={{ width, height }}></div>
      )}
      {error ? (
        <div className="image-error" style={{ width, height }}>
          <span>⚠️</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt || ""}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{ width, height, opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  );
};

export default LazyImage;