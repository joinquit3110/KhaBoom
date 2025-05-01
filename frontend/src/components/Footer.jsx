import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer compact-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img 
              src="/logo.png" 
              alt="Kha-Boom!" 
              style={{ 
                height: '45px', 
                marginRight: '10px', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s ease',
              }} 
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
            <span style={{ fontSize: '0.9rem' }}>Kha-Boom!</span>
          </Link>
          <p className="footer-tagline">Unleashing knowledge with creativity and fun!</p>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h4 className="footer-heading">Company</h4>
            <div className="footer-link-group">
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/careers">Careers</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <div className="footer-link-group">
              <Link to="/blog">Blog</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/support">Support</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Legal</h4>
            <div className="footer-link-group">
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="copyright">© {currentYear} Kha-Boom! All rights reserved.</p>
        <div className="social-links">
          <span className="social-icon">📱</span>
          <span className="social-icon">🐦</span>
          <span className="social-icon">📸</span>
          <span className="social-icon">🎬</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
