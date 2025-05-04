import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './mathigon.css';

/**
 * MathigonCourse Component - Direct integration with original Mathigon
 * 
 * This component directly loads and renders the original Mathigon textbooks
 * implementation, simplified to match the reference implementation exactly.
 */
const MathigonCourse = () => {
  const { courseId, sectionId } = useParams();
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Clean up and prepare container
    if (!containerRef.current) return;
    
    setLoading(true);
    setError(null);
    containerRef.current.innerHTML = '';
    
    try {
      // Create container with Mathigon's expected structure
      const container = document.createElement('div');
      container.id = 'mathigon-textbook';
      container.className = 'textbook-container';
      containerRef.current.appendChild(container);
      
      // Set required global variables
      window.courseId = courseId || 'circles';
      window.steps = sectionId || null;
      
      // Configure Mathigon (CRITICAL: this must be set before loading scripts)
      window.mathigonConfig = {
        assetsPrefix: '/mathigon/assets/',
        contentPrefix: '/mathigon/content/',
        language: 'en',
        downloadMode: false,
        contentFormat: 'json' // IMPORTANT: Must be json, not md
      };
      
      // Load CSS if needed
      if (!document.querySelector('link[href*="mathigon/assets/course.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/mathigon/assets/course.css';
        document.head.appendChild(link);
      }
      
      // Update Content Security Policy to allow blob URLs
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://*.netlify.app https://*.mathigon.org https://*.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.netlify.app https://*.mathigon.org https://*.render.com https://api.dicebear.com https://*.google-analytics.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' blob: data: https://*.netlify.app https://*.mathigon.org https://*.render.com https://kha-boom-backend.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com https://api.dicebear.com https://*.google-analytics.com;";
      document.head.appendChild(meta);
      
      // Load Mathigon script
      const script = document.createElement('script');
      script.src = '/mathigon/assets/course.js';
      script.onload = () => {
        console.log('Mathigon course.js loaded successfully');
        
        // Initialize Mathigon after a short delay
        setTimeout(() => {
          if (window.Mathigon && window.Mathigon.TextbookLoader) {
            try {
              console.log('Initializing TextbookLoader with', courseId);
              
              const textbook = new window.Mathigon.TextbookLoader({
                courseId,
                sectionId: sectionId || undefined,
                container: '#mathigon-textbook',
                sourcePrefix: '/mathigon/content/',
                assetsPrefix: '/mathigon/assets/',
                language: 'en',
                progress: true,
                contentFormat: 'json', // Must be JSON
              });
              
              textbook.initialize()
                .then(() => {
                  console.log('Textbook initialized successfully');
                  setLoading(false);
                })
                .catch(err => {
                  console.error('Initialization error:', err);
                  setError('Error loading course: ' + (err.message || 'Unknown error'));
                  setLoading(false);
                });
              
            } catch (err) {
              console.error('TextbookLoader creation error:', err);
              setError('Error creating textbook: ' + (err.message || 'Unknown error'));
              setLoading(false);
            }
          } else {
            console.error('Mathigon TextbookLoader not available');
            setError('Mathigon components not available');
            setLoading(false);
          }
        }, 100);
      };
      
      script.onerror = (err) => {
        console.error('Failed to load course.js', err);
        setError('Failed to load required scripts');
        setLoading(false);
      };
      
      document.body.appendChild(script);
      
      // Listen for section changes to update the URL
      const handleSectionChange = (e) => {
        if (e.detail && e.detail.id) {
          navigate(`/course/${courseId}/${e.detail.id}`, { replace: true });
        }
      };
      
      window.addEventListener('section-change', handleSectionChange);
      
      return () => {
        window.removeEventListener('section-change', handleSectionChange);
      };
    } catch (err) {
      console.error('Setup error:', err);
      setError('Setup error: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  }, [courseId, sectionId, navigate]);
  
  // Render the component
  if (loading) {
    return (
      <div className="mathigon-loading">
        <div className="spinner"></div>
        <p>Loading interactive course...</p>
        <p className="course-info">{courseId || ""}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mathigon-error">
        <h3>Error loading course</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mathigon-wrapper" ref={containerRef}></div>
  );
};

export default MathigonCourse;