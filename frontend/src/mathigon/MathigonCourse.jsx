import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './mathigon.css';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to determine correct base path for assets
  const getBasePath = () => {
    // Check if we're in a deployed environment (Netlify/Render)
    const hostname = window.location.hostname;
    if (hostname.includes('netlify.app') || 
        hostname.includes('render.com') || 
        hostname !== 'localhost') {
      // In deployed environments, ensure we use absolute paths
      return '/';
    }
    // In local dev, use relative paths
    return '/';
  };
  
  // Function to inject CSS with specific CSP content
  const injectCSPMetaTag = () => {
    // Remove any existing CSP meta tag
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }
    
    // Add a new CSP meta tag that allows Google Analytics and backend access
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://kha-boom-backend.onrender.com";
    document.head.appendChild(meta);
  };
  
  // Function to initialize the Mathigon textbook
  const initializeTextbook = () => {
    // Create a global textbook context for Mathigon
    if (window.Mathigon) {
      // Check directly for TextbookLoader
      let TextbookLoaderClass = window.Mathigon.TextbookLoader;
      
      // If not found, try to locate it in other properties
      if (!TextbookLoaderClass) {
        console.warn('TextbookLoader not directly available, searching for it');
        
        // Look through all Mathigon properties
        for (const prop in window.Mathigon) {
          if (typeof window.Mathigon[prop] === 'function') {
            try {
              // Check if this function is likely the TextbookLoader
              const fnString = window.Mathigon[prop].toString();
              if (fnString.includes('TextbookLoader') || 
                  fnString.includes('initialize') && fnString.includes('load')) {
                console.log(`Potential TextbookLoader found in Mathigon.${prop}`);
                TextbookLoaderClass = window.Mathigon[prop];
                // Add it to the TextbookLoader property for future use
                window.Mathigon.TextbookLoader = TextbookLoaderClass;
                break;
              }
            } catch (e) {
              // Ignore errors when stringifying functions
            }
          }
        }
      }
      
      // If we found a potential TextbookLoader, try to use it
      if (TextbookLoaderClass) {
        try {
          console.log('Creating Mathigon TextbookLoader for course:', courseId);
          
          const basePath = getBasePath();
          
          // Set additional global config values that Mathigon might need
          window.steps = sectionId || null;
          
          // Important - ensure content format is correctly set
          if (!window.mathigonConfig) {
            window.mathigonConfig = {};
          }
          window.mathigonConfig.contentFormat = 'md'; // Use markdown instead of JSON
          
          const textbook = new TextbookLoaderClass({
            courseId,
            sectionId: sectionId || undefined,
            container: '#mathigon-textbook',
            sourcePrefix: `${basePath}mathigon/content/`,
            assetsPrefix: `${basePath}mathigon/assets/`,
            language: 'en',
            progress: true,
            contentFormat: 'md', // Important: specify we're using markdown files
            onSectionComplete: (sectionId) => {
              console.log(`Completed section ${sectionId}`);
            },
            onInteraction: (step, action) => {
              console.log(`Interaction: ${step} - ${action}`);
            }
          });
          
          // Initialize the textbook
          console.log('Initializing textbook...');
          textbook.initialize().then(() => {
            console.log('Textbook initialized successfully');
            setLoading(false);
          }).catch(err => {
            console.error('Error initializing textbook:', err);
            setError('Failed to initialize textbook: ' + (err.message || 'Unknown error'));
            setLoading(false);
          });
          
          return textbook;
        } catch (err) {
          console.error('Error creating textbook:', err);
          setError('Error creating textbook: ' + (err.message || 'Unknown error'));
          setLoading(false);
          return null;
        }
      } else {
        // If we still don't have TextbookLoader, try to use the Mathigon.load method
        if (typeof window.Mathigon.load === 'function') {
          console.log('TextbookLoader not found, trying Mathigon.load method');
          
          try {
            window.Mathigon.load()
              .then(() => {
                console.log('Mathigon loaded using load() method');
                setLoading(false);
              })
              .catch(err => {
                console.error('Error in Mathigon.load method:', err);
                setError('Error loading Mathigon: ' + (err.message || 'Unknown error'));
                setLoading(false);
              });
            
            return true; // Return something truthy to indicate we're handling it
          } catch (err) {
            console.error('Error using Mathigon.load:', err);
            setError('Error using Mathigon.load: ' + (err.message || 'Unknown error'));
            setLoading(false);
            return null;
          }
        } else {
          console.error('Mathigon TextbookLoader not available and no load method found');
          if (window.Mathigon) {
            console.log('Available Mathigon objects:', Object.keys(window.Mathigon));
          } else {
            console.log('Mathigon global object not found');
          }
          setError('Mathigon TextbookLoader not available. Try refreshing the page.');
          setLoading(false);
          return null;
        }
      }
    } else {
      console.error('Mathigon global object not available');
      setError('Mathigon global object not available. Try refreshing the page.');
      setLoading(false);
      return null;
    }
  };
  
  // Check if any required scripts are already loaded
  const checkScriptsLoaded = () => {
    return document.querySelector('script[src*="mathigon/assets/course.js"]');
  };
  
  useEffect(() => {
    // Inject CSP meta tag to allow Google Analytics
    injectCSPMetaTag();
    
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
        container.className = 'textbook-container';
        containerRef.current.appendChild(container);
        
        const mainElement = document.createElement('main');
        mainElement.className = 'textbook-container-main';
        container.appendChild(mainElement);
        
        const basePath = getBasePath();
        
        // Create a global configuration object for Mathigon before loading scripts
        window.mathigonConfig = {
          assetsPrefix: `${basePath}mathigon/assets/`,
          contentPrefix: `${basePath}mathigon/content/`,
          language: 'en', // Default language
          downloadMode: false
        };
        
        // Add Mathigon stylesheet first
        const addStylesheet = () => {
          return new Promise((resolve) => {
            if (document.querySelector('link[href*="mathigon/assets/course.css"]')) {
              resolve();
              return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${basePath}mathigon/assets/course.css`;
            link.onload = () => resolve();
            link.onerror = (e) => {
              console.error('Failed to load Mathigon CSS', e);
              // Try a fallback path
              link.href = `/mathigon/assets/course.css`;
              resolve(); // Continue anyway
            };
            document.head.appendChild(link);
          });
        };
        
        // Load Mathigon script with proper error handling
        const loadScript = () => {
          return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (checkScriptsLoaded()) {
              console.log('Mathigon course.js already loaded');
              resolve();
              return;
            }
            
            // First load diagnostic script to help with debugging
            const diagnosticScript = document.createElement('script');
            diagnosticScript.src = `/mathigon-test.js`;
            
            // Then load the main Mathigon script
            const script = document.createElement('script');
            script.src = `${basePath}mathigon/assets/course.js`;
            script.async = false; // Important! Load in order
            script.onload = () => {
              console.log('Mathigon course.js loaded successfully');
              
              // Small delay to ensure script initialization
              setTimeout(() => {
                // Inject a helper script to force initialization if needed
                const helperScript = document.createElement('script');
                helperScript.textContent = `
                  console.log("Helper initialization script running");
                  if (window.Mathigon && !window.Mathigon.TextbookLoader) {
                    console.warn("TextbookLoader not found, attempting to find or create it");
                    // Check if it's available in another property
                    for (const prop in window.Mathigon) {
                      if (typeof window.Mathigon[prop] === 'function' && 
                          window.Mathigon[prop].toString().includes('TextbookLoader')) {
                        console.log("Found potential TextbookLoader in", prop);
                        window.Mathigon.TextbookLoader = window.Mathigon[prop];
                        break;
                      }
                    }
                  }
                `;
                document.body.appendChild(helperScript);
                resolve();
              }, 300);
            };
            script.onerror = (e) => {
              console.error('Failed to load Mathigon course.js', e);
              // Try a fallback path
              script.src = `/mathigon/assets/course.js`;
              script.onload = () => {
                console.log('Mathigon course.js loaded using fallback path');
                resolve();
              };
              script.onerror = () => {
                reject(new Error('Failed to load required scripts'));
              };
            };
            
            // Add diagnostic script first
            document.body.appendChild(diagnosticScript);
            
            // Then add main script
            document.body.appendChild(script);
          });
        };
        
        // Load assets in the correct order
        addStylesheet()
          .then(() => loadScript())
          .then(() => {
            // Give a bit of time for the script to initialize
            console.log('All Mathigon assets loaded, waiting for initialization...');
            setTimeout(() => {
              // Initialize the Mathigon textbook
              const textbook = initializeTextbook();
              
              if (!textbook) {
                // If initialization fails, try a fallback approach
                console.log('Trying fallback initialization method...');
                if (window.Mathigon && window.Mathigon.load) {
                  window.Mathigon.load()
                    .then(() => {
                      console.log('Mathigon loaded using fallback method');
                      setLoading(false);
                    })
                    .catch(err => {
                      console.error('Error in fallback method:', err);
                      setError('Failed to load with fallback method: ' + (err.message || 'Unknown error'));
                      setLoading(false);
                      
                      // Navigate to fallback view as last resort
                      console.log('Navigating to fallback view');
                      navigate(`/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}`, { replace: true });
                    });
                } else {
                  console.error('No fallback method available');
                  setLoading(false);
                  
                  // If all else fails, try a page refresh
                  if (!error) {
                    const shouldReload = window.confirm(
                      'Could not initialize the course. Would you like to refresh the page and try again?'
                    );
                    if (shouldReload) {
                      window.location.reload();
                    } else {
                      navigate(`/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}`, { replace: true });
                    }
                  }
                }
              }
            }, 500); // Increase timeout for slower connections
            
            // Listen for section changes to update the URL
            window.addEventListener('section-change', (e) => {
              if (e.detail && e.detail.id) {
                navigate(`/${courseId}/${e.detail.id}`, { replace: true });
              }
            });
          })
          .catch(err => {
            console.error('Asset loading error:', err);
            setError('Failed to load required resources: ' + (err.message || 'Unknown error'));
            setLoading(false);
          });
          
      } catch (err) {
        console.error('Setup error:', err);
        setError('Setup error: ' + (err.message || 'Unknown error'));
        setLoading(false);
      }
    }
    
    // Cleanup on unmount
    return () => {
      // Remove event listeners
      window.removeEventListener('section-change', () => {});
    };
  }, [courseId, sectionId]);
  
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
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}`)}
          >
            Alternative View
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