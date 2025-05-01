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
            src="/favicon.svg" 
            alt="Kha-Boom" 
            style={{ height: '30px', marginRight: '8px' }} 
          />
          Kha-Boom!
        </Link>
      </div>
      
      <button 
        className="mobile-menu-button" 
        onClick={toggleMenu}
        style={{
          display: 'none',
          '@media (max-width: 768px)': {
            display: 'block'
          }
        }}
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
            <button 
              onClick={onLogout} 
              className="btn btn-outline navbar-item logout-btn"
              style={{ marginLeft: '8px' }}
            >
              Logout
            </button>
            <span className="navbar-item user-name">
              <img 
                src={user.avatar} 
                alt={user.name} 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%',
                  marginRight: '8px' 
                }} 
              />
              {user.fullName}
            </span>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-item">Login</Link>
            <Link to="/register" className="btn btn-primary navbar-item" style={{ marginLeft: '8px' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
