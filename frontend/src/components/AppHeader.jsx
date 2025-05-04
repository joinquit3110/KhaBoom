import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';
import apiClient from '../api/apiClient';

/**
 * AppHeader Component
 * 
 * Main navigation header with connection status indicators
 */
const AppHeader = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showStatus, setShowStatus] = useState(false);
  
  // Handle logout
  const handleLogout = async () => {
    await apiClient.logout();
    navigate('/login');
  };
  
  // Toggle connection status display
  const toggleStatus = () => {
    setShowStatus(prev => !prev);
  };
  
  // Determine if we're on a course page
  const isCoursePage = location.pathname.match(/^\/[a-zA-Z0-9-_]+\/?/);
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-text">KhaBoom</span>
            <span className="logo-tag">Learning Platform</span>
          </Link>
        </div>
        
        <div className="header-right">
          {/* Only show back button on course pages */}
          {isCoursePage && (
            <Link to="/" className="back-button">
              ← Back to Courses
            </Link>
          )}
          
          {/* User menu or login button */}
          {user ? (
            <div className="user-menu">
              <span className="username">{user.name || user.email}</span>
              <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </div>
          ) : (
            <Link to="/login" className="login-button">
              Log In
            </Link>
          )}
          
          {/* Status indicator toggle */}
          <button 
            className="status-toggle" 
            onClick={toggleStatus}
            title="Toggle connection status"
          >
            •••
          </button>
        </div>
      </div>
      
      {/* Status display - only visible when toggled */}
      <div className={`status-bar ${showStatus ? 'visible' : ''}`}>
        <div className="environment-info">
          <span>Environment: {process.env.NODE_ENV || 'development'}</span>
          <span>Hosting: Netlify</span>
          <span>Backend: Render</span>
          <span>Database: MongoDB</span>
        </div>
        <ConnectionStatus showDetails={true} />
      </div>
      
      <style jsx>{`
        .app-header {
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .logo {
          display: flex;
          align-items: center;
        }
        
        .logo a {
          text-decoration: none;
          display: flex;
          flex-direction: column;
        }
        
        .logo-text {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a1a;
        }
        
        .logo-tag {
          font-size: 12px;
          color: #666;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .back-button {
          text-decoration: none;
          color: #555;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 4px;
          background: #f5f5f5;
          transition: background 0.2s;
        }
        
        .back-button:hover {
          background: #e5e5e5;
        }
        
        .user-menu {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .username {
          font-size: 14px;
          color: #333;
        }
        
        .logout-button {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 8px;
        }
        
        .logout-button:hover {
          color: #555;
          text-decoration: underline;
        }
        
        .login-button {
          text-decoration: none;
          color: #fff;
          background: #5A49C9;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .login-button:hover {
          background: #4A39B9;
        }
        
        .status-toggle {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
          transform: rotate(90deg);
        }
        
        .status-toggle:hover {
          color: #555;
        }
        
        .status-bar {
          background: #f9f9f9;
          padding: 0;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }
        
        .status-bar.visible {
          padding: 8px 20px;
          max-height: 100px;
          border-top: 1px solid #eee;
        }
        
        .environment-info {
          display: flex;
          gap: 15px;
          color: #666;
        }
      `}</style>
    </header>
  );
};

export default AppHeader; 