import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <img 
            src="/logo.png" 
            alt="Kha-Boom!" 
            style={{ 
              height: '55px', 
              marginRight: '12px', 
              borderRadius: '8px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)', 
              transition: 'transform 0.3s ease', 
              transform: 'rotate(-2deg)' 
            }} 
          />
          <span className="logo-text">
            <span className="kha-text" style={{
              background: 'linear-gradient(45deg, #ff416c, #ff4b2b)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold',
              letterSpacing: '-1px',
              fontSize: '1.8rem'
            }}>
              Kha-
            </span>
            <span className="boom-text" style={{
              color: '#5A49C9',
              fontWeight: 'bold',
              textShadow: '1px 1px 0 rgba(0,0,0,0.2)',
              fontSize: '1.8rem'
            }}>
              Boom!
            </span>
          </span>
        </Link>
      </div>
      
      <button 
        className="mobile-menu-button" 
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <div className={`navbar-menu ${menuOpen ? 'is-active' : ''}`}>
        <Link to="/" className="navbar-item">Home</Link>
        
        {user ? (
          <>
            <Link to="/dashboard" className="navbar-item">Dashboard</Link>
            <div className="navbar-user">
              <span className="user-name">
                {user.avatar && (
                  <img 
                    src={user.avatar} 
                    alt={user.fullName} 
                    className="user-avatar"
                  />
                )}
                <span className="user-full-name">{user.fullName}</span>
              </span>
              <button 
                onClick={onLogout} 
                className="btn btn-sm logout-btn"
                style={{
                  backgroundColor: '#e53935',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(229, 57, 53, 0.3)',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="auth-nav-buttons">
            <Link to="/login" className="navbar-item">Login</Link>
            <Link to="/register" className="btn btn-primary navbar-item">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
