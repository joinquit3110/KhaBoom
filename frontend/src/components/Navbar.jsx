import React from 'react';

const Navbar = ({ user, setUser }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <a href="/" className="navbar-logo">Kha-Boom!</a>
      </div>
      <div className="navbar-menu">
        <a href="/" className="navbar-item">Home</a>
        {user ? (
          <>
            <a href="/dashboard" className="navbar-item">Dashboard</a>
            <button onClick={handleLogout} className="navbar-item logout-btn">
              Logout
            </button>
            <span className="navbar-item user-name">Hello, {user.name}</span>
          </>
        ) : (
          <>
            <a href="/login" className="navbar-item">Login</a>
            <a href="/register" className="navbar-item">Register</a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
