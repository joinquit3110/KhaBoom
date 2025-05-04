import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * MathigonLoader component
 * This component handles loading Mathigon scripts and initializing the textbook functionality
 * to provide the same interactive experience as the original Mathigon platform.
 */
const MathigonLoader = ({ courseId, language = 'en', onSectionComplete, onInteractionStart, onNotification }) => {
  const containerRef = useRef(null);
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Mathigon scripts and initialize the textbook
  useEffect(() => {
    if (!courseId || initialized.current) return;
    
    const loadMathigonAssets = async () => {
      try {
        setLoading(true);
        
        // Define script sources for Mathigon assets
        const scriptSources = [
          '/mathigon/assets/course.js'
        ];
        
        // Define stylesheet sources for Mathigon assets
        const stylesheetSources = [
          '/mathigon/assets/course.css'
        ];
        
        // Load all required stylesheets
        stylesheetSources.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = src;
          document.head.appendChild(link);
        });
        
        // Load all required scripts
        for (const src of scriptSources) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
          });
        }
        
        // Wait for scripts to be fully available
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Initialize the Mathigon textbook
        if (window.Mathigon && window.Mathigon.TextbookLoader) {
          console.log('Initializing Mathigon textbook for course:', courseId);
          
          // Set global configuration for Mathigon
          window.mathigonConfig = {
            assetsPrefix: '/mathigon/assets/',
            contentPrefix: '/content/',
            language: language
          };
          
          // Create and initialize the textbook
          const textbook = new window.Mathigon.TextbookLoader({
            courseId: courseId,
            language: language,
            sourcePrefix: '/content/',
            container: containerRef.current || '#mathigon-textbook-container',
            animations: true,
            progress: true,
            onSectionOpen: (sectionId) => {
              console.log(`Section opened: ${sectionId}`);
            },
            onSectionComplete: (sectionId) => {
              console.log(`Section completed: ${sectionId}`);
              onSectionComplete && onSectionComplete(sectionId);
              onNotification && onNotification(`Section "${sectionId}" completed!`);
            },
            onInteractionStart: (componentId) => {
              console.log(`Interaction started: ${componentId}`);
              onInteractionStart && onInteractionStart(componentId);
            }
          });
          
          // Initialize the textbook
          await textbook.initialize();
          initialized.current = true;
          
          // Set up event listeners for interactive components
          setupInteractiveListeners();
          
          // Add a notification to welcome the user
          setTimeout(() => {
            onNotification && onNotification('Welcome to this interactive course! Explore by clicking on the various elements.');
          }, 2000);
        } else {
          throw new Error('Mathigon scripts did not load correctly');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading Mathigon assets:', err);
        setError(err.message || 'Failed to load Mathigon assets');
        setLoading(false);
      }
    };
    
    // Set up event listeners for interactive components
    const setupInteractiveListeners = () => {
      if (!containerRef.current) return;
      
      // Listen for step completions
      const stepElements = containerRef.current.querySelectorAll('[step-url]');
      stepElements.forEach(el => {
        el.addEventListener('step-complete', (e) => {
          console.log(`Step completed:`, e.target);
          onNotification && onNotification("Great job! You've completed this step.");
        });
      });
      
      // Listen for popup opening
      document.addEventListener('popup-open', (e) => {
        console.log('Popup opened:', e.detail);
      });
      
      // Listen for popup closing
      document.addEventListener('popup-close', () => {
        console.log('Popup closed');
      });
    };
    
    loadMathigonAssets();
    
    // Cleanup function
    return () => {
      // If needed, can clean up event listeners here
    };
  }, [courseId, language, onSectionComplete, onInteractionStart, onNotification]);
  
  // Handle custom event listening for canvas drawing
  useEffect(() => {
    const handleDrawEvent = (e) => {
      console.log('Drawing event:', e.detail);
      // You can handle custom drawing events here
    };
    
    window.addEventListener('mathigon-draw', handleDrawEvent);
    return () => {
      window.removeEventListener('mathigon-draw', handleDrawEvent);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="mathigon-loading">
        <div className="spinner"></div>
        <p>Loading interactive course...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mathigon-error">
        <h3>Error loading interactive content</h3>
        <p>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div 
      id="mathigon-textbook-container" 
      className="mathigon-container" 
      ref={containerRef}
    >
      {/* Mathigon content will be loaded here */}
    </div>
  );
};

export default MathigonLoader;
