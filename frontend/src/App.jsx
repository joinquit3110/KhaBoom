import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CourseRoutes from './routes/CourseRoutes';
import Login from './components/Login';
import Register from './components/Register';
import NotFound from './components/NotFound';
import AppHeader from './components/AppHeader';
import apiClient from './api/apiClient';
import './App.css';

/**
 * App Component
 * 
 * Main application component that handles routing and authentication state
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check user authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Verify token with backend
          const userData = await apiClient.getUserProfile();
          setUser(userData);
        }
      } catch (error) {
        console.warn('Authentication error:', error);
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/');
  };
  
  // Handle logout
  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
    navigate('/login');
  };
  
  // Show loading state
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="app">
      <AppHeader user={user} onLogout={handleLogout} />
      
      <main className="main-content">
        <Routes>
          {/* Main course routes */}
          <Route path="/*" element={<CourseRoutes userId={user?.id} user={user} />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleLogin} />} />
          
          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>KhaBoom Learning Platform © {new Date().getFullYear()}</p>
          <p className="hosting-info">
            Hosted on Netlify • Backend on Render • Powered by MongoDB
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
