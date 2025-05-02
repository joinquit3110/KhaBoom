import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound Component
 * 
 * Displays a 404 page when routes don't match
 */
const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <div className="not-found-actions">
        <Link to="/" className="button">Return to Home</Link>
        <Link to="/courses" className="button">Browse Courses</Link>
      </div>
    </div>
  );
};

export default NotFound;
