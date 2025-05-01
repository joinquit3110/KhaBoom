import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Kha-Boom! - Online Learning Platform</p>
        <p>Designed & Developed by <a href="https://github.com/joinquit3110" target="_blank" rel="noopener noreferrer">joinquit3110</a></p>
      </div>
    </footer>
  );
};

export default Footer;
