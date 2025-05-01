import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img 
              src="/logo.png" 
              alt="Kha-Boom!" 
              style={{ height: '40px', marginRight: '10px', borderRadius: '8px' }} 
            />
            <span>Kha-Boom!</span>
          </Link>
          <p>Unleashing knowledge with creativity and fun!</p>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h3>Company</h3>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/careers">Careers</Link>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <Link to="/blog">Blog</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/support">Support</Link>
          </div>
          
          <div className="footer-section">
            <h3>Legal</h3>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {currentYear} Kha-Boom! All rights reserved.</p>
        <div className="social-links">
          <a href="#" aria-label="Facebook">📱</a>
          <a href="#" aria-label="Twitter">🐦</a>
          <a href="#" aria-label="Instagram">📸</a>
          <a href="#" aria-label="YouTube">🎬</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
