import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * MathigonCourse Component - Direct integration with original Mathigon
 * 
 * This component directly loads and renders the original Mathigon textbooks
 * implementation without any modification, preserving all original functionality.
 */
const MathigonCourse = () => {
  const { courseId, sectionId } = useParams();
  const containerRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load Mathigon scripts
    if (typeof window !== 'undefined' && containerRef.current) {
      // Clean the container
      containerRef.current.innerHTML = '';
      
      try {
        // IMPORTANT: First set global variables that Mathigon course.js expects
        window.courseId = courseId || 'circles';
        window.steps = sectionId || null;
        
        // Create a container for the content that matches Mathigon's structure
        const container = document.createElement('div');
        container.id = 'mathigon-textbook';
        containerRef.current.appendChild(container);
        
        // Add Mathigon stylesheet
        if (!document.querySelector('link[href="/mathigon/assets/course.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/mathigon/assets/course.css';
          document.head.appendChild(link);
        }
        
        // Add Mathigon script
        const script = document.createElement('script');
        script.src = '/mathigon/assets/course.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Mathigon course.js loaded successfully');
          
          // Listen for section changes to update the URL
          window.addEventListener('section-change', (e) => {
            if (e.detail && e.detail.id) {
              navigate(`/${courseId}/${e.detail.id}`, { replace: true });
            }
          });
        };
        
        script.onerror = (err) => {
          console.error('Failed to load Mathigon script:', err);
          containerRef.current.innerHTML = `
            <div style="padding: 20px; color: #d00; text-align: center;">
              <h2>Failed to load course content</h2>
              <p>Please check the console for more details.</p>
            </div>
          `;
        };
        
        // Add the script to the body
        document.body.appendChild(script);
      } catch (err) {
        console.error('Error setting up Mathigon:', err);
        containerRef.current.innerHTML = `
          <div style="padding: 20px; color: #d00; text-align: center;">
            <h2>Error setting up course</h2>
            <p>${err.message}</p>
          </div>
        `;
      }
    }
    
    // Cleanup function
    return () => {
      // Remove any global variables when component unmounts
      if (typeof window !== 'undefined') {
        window.removeEventListener('section-change', () => {});
        
        // Don't delete window.courseId and window.steps as this can cause problems
        // when the script is still running and expects these variables
        // Let the next render set them to new values instead
      }
    };
  }, [courseId, sectionId, navigate]);
  
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MathigonCourse;