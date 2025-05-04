import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

/**
 * Login Component
 * 
 * Handles user authentication against MongoDB via Render backend
 */
const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if session expired
  const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired';
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { email, password } = credentials;
      
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }
      
      // Authenticate with MongoDB via API
      const userData = await apiClient.login(credentials);
      
      if (userData) {
        // Call the onLogin callback to update app state
        if (onLogin) onLogin(userData);
        
        // Redirect to dashboard
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h1 className="form-title">Log In</h1>
      
      {sessionExpired && (
        <div className="session-expired">
          Your session has expired. Please log in again.
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            value={credentials.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="form-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <div className="form-footer">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
      
      <style jsx>{`
        .session-expired {
          background-color: #fff3e0;
          border-left: 4px solid #ff9800;
          color: #e65100;
          padding: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Login;
