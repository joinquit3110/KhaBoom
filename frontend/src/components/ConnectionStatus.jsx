import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

/**
 * ConnectionStatus Component
 * 
 * Displays the status of connections to MongoDB and Render backend
 */
const ConnectionStatus = ({ showDetails = false }) => {
  const [status, setStatus] = useState({
    mongodb: 'checking',
    backend: 'checking'
  });
  
  // Check connections on mount
  useEffect(() => {
    const checkConnections = async () => {
      try {
        // Check backend connectivity
        const backendStatus = await apiClient.checkDatabaseHealth();
        
        setStatus({
          mongodb: backendStatus.database === 'connected' ? 'connected' : 'disconnected',
          backend: backendStatus.status === 'ok' ? 'connected' : 'disconnected'
        });
      } catch (error) {
        console.error('Failed to check connections:', error);
        setStatus({
          mongodb: 'error',
          backend: 'error'
        });
      }
    };
    
    checkConnections();
    
    // Set up periodic checking every 30 seconds
    const interval = setInterval(checkConnections, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // If we don't want to show details, return null
  if (!showDetails) return null;
  
  // Status indicators
  const getStatusIcon = (connectionStatus) => {
    switch (connectionStatus) {
      case 'connected':
        return <span className="status-indicator connected">●</span>;
      case 'disconnected':
        return <span className="status-indicator disconnected">●</span>;
      case 'error':
        return <span className="status-indicator error">●</span>;
      default:
        return <span className="status-indicator checking">●</span>;
    }
  };
  
  return (
    <div className="connection-status">
      <div className="status-item">
        {getStatusIcon(status.backend)}
        <span className="status-label">Render Backend</span>
      </div>
      <div className="status-item">
        {getStatusIcon(status.mongodb)}
        <span className="status-label">MongoDB</span>
      </div>
      
      <style jsx>{`
        .connection-status {
          display: flex;
          gap: 15px;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .status-indicator {
          font-size: 10px;
        }
        
        .status-indicator.connected {
          color: #4caf50;
        }
        
        .status-indicator.disconnected {
          color: #f44336;
        }
        
        .status-indicator.error {
          color: #ff9800;
        }
        
        .status-indicator.checking {
          color: #9e9e9e;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.5;
          }
        }
        
        .status-label {
          color: #555;
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus; 