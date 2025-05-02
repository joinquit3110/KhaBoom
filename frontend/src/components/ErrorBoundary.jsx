import React, { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * ErrorBoundary component for catching and displaying errors gracefully
 * instead of crashing the whole application.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Check if we're in a course renderer context
      const isCourseError = this.props.courseId || window.location.pathname.includes('/courses/');
      
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>Something went wrong</h2>
            
            {isCourseError ? (
              <>
                <p>There was an error loading this course content.</p>
                <div className="error-actions">
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                  <Link to="/courses" className="btn btn-secondary">
                    Return to Courses
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>We encountered an unexpected error. Please try again.</p>
                <div className="error-actions">
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                  >
                    Reload Page
                  </button>
                  <Link to="/" className="btn btn-secondary">
                    Go to Home
                  </Link>
                </div>
              </>
            )}
            
            {/* Show error details in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="error-details">
                <h3>Error Details</h3>
                <p className="error-message">{this.state.error && this.state.error.toString()}</p>
                <div className="error-stack">
                  {this.state.errorInfo && 
                    <pre>{this.state.errorInfo.componentStack}</pre>}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
