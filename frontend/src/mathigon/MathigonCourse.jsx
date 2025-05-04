import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

/**
 * MathigonCourse Component - Direct integration with original Mathigon
 * 
 * This component directly loads and renders the original Mathigon textbooks
 * implementation without any modification, preserving all original functionality.
 * It also integrates with MongoDB via the Render backend for progress tracking.
 */
const MathigonCourse = () => {
  const { courseId, sectionId } = useParams();
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  
  // Load user progress from MongoDB
  useEffect(() => {
    const loadUserProgress = async () => {
      try {
        if (!courseId) return;
        
        const userProgress = await apiClient.getCourseProgress(courseId);
        setProgress(userProgress);
        
        // Make the progress data available to Mathigon
        if (typeof window !== 'undefined') {
          window.userProgress = userProgress;
        }
      } catch (err) {
        console.warn('Could not load progress data:', err);
        // Don't set error state, this is non-critical
      }
    };
    
    loadUserProgress();
  }, [courseId]);
  
  // Track progress changes in MongoDB
  const trackProgress = async (step, completed = true) => {
    try {
      if (!courseId || !step) return;
      
      await apiClient.updateProgress(courseId, {
        sectionId: step.split('-')[0], // Extract section from step ID
        exerciseId: step,
        completed
      });
    } catch (err) {
      console.warn('Could not track progress:', err);
    }
  };
  
  useEffect(() => {
    // Load Mathigon scripts
    if (typeof window !== 'undefined' && containerRef.current) {
      setLoading(true);
      setError(null);
      
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
        
        // Set up progress tracking functions for Mathigon
        window.trackProgress = trackProgress;
        
        // Add Mathigon script
        const script = document.createElement('script');
        script.src = '/mathigon/assets/course.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Mathigon course.js loaded successfully');
          setLoading(false);
          
          // Listen for section changes to update the URL and MongoDB
          window.addEventListener('section-change', (e) => {
            if (e.detail && e.detail.id) {
              navigate(`/${courseId}/${e.detail.id}`, { replace: true });
              // Track this section change in MongoDB
              trackProgress(e.detail.id);
            }
          });
          
          // Listen for exercise completion
          window.addEventListener('exercise-complete', (e) => {
            if (e.detail && e.detail.id) {
              trackProgress(e.detail.id, true);
            }
          });
        };
        
        script.onerror = (err) => {
          console.error('Failed to load Mathigon script:', err);
          setError('Failed to load course content. Please try again later.');
          setLoading(false);
        };
        
        // Add the script to the body
        document.body.appendChild(script);
      } catch (err) {
        console.error('Error setting up Mathigon:', err);
        setError(`Error setting up course: ${err.message}`);
        setLoading(false);
      }
    }
    
    // Cleanup function
    return () => {
      // Remove any global variables when component unmounts
      if (typeof window !== 'undefined') {
        window.removeEventListener('section-change', () => {});
        window.removeEventListener('exercise-complete', () => {});
        
        // Don't delete window.courseId and window.steps as this can cause problems
        // when the script is still running and expects these variables
        // Let the next render set them to new values instead
      }
    };
  }, [courseId, sectionId, navigate]);
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(0, 0, 0, 0.1)', 
            borderLeft: '4px solid #767676',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading {courseId} course...</p>
          
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#d00', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '100px auto'
      }}>
        <h2>Error loading course</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '8px 16px', marginTop: '20px' }}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MathigonCourse;