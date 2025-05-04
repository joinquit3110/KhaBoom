import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * MathigonCourse Component
 * 
 * This component directly integrates and renders the original Mathigon course
 * using their custom implementation.
 */
const MathigonCourse = () => {
  const { courseId, sectionId } = useParams();
  const containerRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load Mathigon scripts
    if (typeof window !== 'undefined' && containerRef.current) {
      // Start with a clean container
      containerRef.current.innerHTML = '';
      
      // Add Mathigon stylesheet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/mathigon/assets/course.css';
      document.head.appendChild(link);
      
      try {
        // Load Mathigon script
        window.courseId = courseId || 'circles';
        window.steps = sectionId || null;
        
        const script = document.createElement('script');
        script.src = '/mathigon/assets/course.js';
        script.onload = () => {
          console.log('Mathigon course.js loaded successfully');
          // Mathigon's course.js will handle the content loading and rendering
        };
        script.onerror = (err) => {
          console.error('Failed to load Mathigon script:', err);
          containerRef.current.innerHTML = '<div class="error">Failed to load Mathigon course.</div>';
        };
        
        document.body.appendChild(script);
        
        // Set up event listener for section navigation
        window.addEventListener('section-change', (e) => {
          if (e.detail && e.detail.id) {
            navigate(`/courses/${courseId}/${e.detail.id}`, { replace: true });
          }
        });
      } catch (err) {
        console.error('Error setting up Mathigon:', err);
      }
    }
    
    // Cleanup function
    return () => {
      // Remove any global variables or event listeners when component unmounts
      if (typeof window !== 'undefined') {
        window.removeEventListener('section-change', () => {});
      }
    };
  }, [courseId, sectionId, navigate]);
  
  return (
    <div className="mathigon-wrapper">
      <div id="mathigon-container" ref={containerRef} />
    </div>
  );
};

export default MathigonCourse;