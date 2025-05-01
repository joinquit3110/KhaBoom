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
            style={{ height: '60px', marginRight: '15px', borderRadius: '8px' }} 
          />
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>Kha-Boom!</span>
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
                <span>{user.fullName}</span>
              </span>
              <button 
                onClick={onLogout} 
                className="btn btn-outline logout-btn"
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
