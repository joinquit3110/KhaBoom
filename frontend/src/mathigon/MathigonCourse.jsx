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
  
  // Function to inject CSS with specific CSP content
  const injectCSPMetaTag = () => {
    // Remove any existing CSP meta tag
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }
    
    // Add a new CSP meta tag that allows Google Analytics
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com";
    document.head.appendChild(meta);
  };
  
  // Function to initialize the Mathigon textbook
  const initializeTextbook = () => {
    // Create a global textbook context for Mathigon
    if (window.Mathigon && window.Mathigon.TextbookLoader) {
      try {
        const textbook = new window.Mathigon.TextbookLoader({
          courseId,
          sectionId: sectionId || undefined,
          container: '#mathigon-textbook',
          sourcePrefix: `/mathigon/content/`,
          assetsPrefix: `/mathigon/assets/`,
          language: 'en',
          progress: true,
          onSectionComplete: (sectionId) => {
            console.log(`Completed section ${sectionId}`);
          },
          onInteraction: (step, action) => {
            console.log(`Interaction: ${step} - ${action}`);
          }
        });
        
        // Initialize the textbook
        textbook.initialize().then(() => {
          console.log('Textbook initialized successfully');
          setLoading(false);
        }).catch(err => {
          console.error('Error initializing textbook:', err);
          setError('Failed to initialize textbook: ' + err.message);
          setLoading(false);
        });
        
        return textbook;
      } catch (err) {
        console.error('Error creating textbook:', err);
        setError('Error creating textbook: ' + err.message);
        setLoading(false);
        return null;
      }
    } else {
      console.error('Mathigon TextbookLoader not available');
      setError('Mathigon TextbookLoader not available. Try refreshing the page.');
      setLoading(false);
      return null;
    }
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
        
        // Add Mathigon stylesheet
        const linkElements = [
          { rel: 'stylesheet', href: '/mathigon/assets/course.css' }
        ];
        
        linkElements.forEach(linkData => {
          if (!document.querySelector(`link[href="${linkData.href}"]`)) {
            const link = document.createElement('link');
            link.rel = linkData.rel;
            link.href = linkData.href;
            document.head.appendChild(link);
          }
        });
        
        // Create a global configuration object for Mathigon
        window.mathigonConfig = {
          assetsPrefix: '/mathigon/assets/',
          contentPrefix: '/mathigon/content/',
          language: 'en', // Default language
          downloadMode: false
        };
        
        // Add Mathigon script
        const loadScript = (src) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        };
        
        loadScript('/mathigon/assets/course.js')
          .then(() => {
            console.log('Mathigon course.js loaded successfully');
            
            // Listen for section changes to update the URL
            window.addEventListener('section-change', (e) => {
              if (e.detail && e.detail.id) {
                navigate(`/courses/${courseId}/${e.detail.id}`, { replace: true });
              }
            });
            
            // Initialize the Mathigon textbook
            setTimeout(() => {
              const textbook = initializeTextbook();
              if (!textbook) {
                // If initialization fails, fallback to the original approach
                if (window.Mathigon && window.Mathigon.load) {
                  window.Mathigon.load()
                    .then(() => {
                      console.log('Mathigon loaded using fallback method');
                      setLoading(false);
                    })
                    .catch(err => {
                      console.error('Error in fallback method:', err);
                      setError('Failed to load with fallback method: ' + err.message);
                      setLoading(false);
                      // Navigate to fallback view as last resort
                      navigate(`/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}`, { replace: true });
                    });
                } else {
                  setLoading(false);
                }
              }
            }, 300);
            
            // Add a MutationObserver to fix any script loading issues
            const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                  // Find any inline scripts added by Mathigon and execute them
                  mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT' && !node.src) {
                      const script = document.createElement('script');
                      script.textContent = node.textContent;
                      document.body.appendChild(script);
                    }
                  });
                }
              }
            });
            
            observer.observe(containerRef.current, { 
              childList: true, 
              subtree: true 
            });
          })
          .catch((err) => {
            console.error('Failed to load Mathigon script:', err);
            setError('Failed to load course content: ' + err.message);
            setLoading(false);
            containerRef.current.innerHTML = `
              <div class="mathigon-error-message">
                <h2>Failed to load course content</h2>
                <p>${err.message}</p>
                <button onclick="window.location.href='/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}'" class="fallback-button">Try Alternative View</button>
                <button onclick="window.location.reload()" class="retry-button">Reload</button>
              </div>
            `;
          });
      } catch (err) {
        console.error('Error setting up Mathigon:', err);
        setError('Error setting up course: ' + err.message);
        setLoading(false);
        containerRef.current.innerHTML = `
          <div class="mathigon-error-message">
            <h2>Error setting up course</h2>
            <p>${err.message}</p>
            <button onclick="window.location.href='/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}'" class="fallback-button">Try Alternative View</button>
            <button onclick="window.location.reload()" class="retry-button">Reload</button>
          </div>
        `;
      }
    }
    
    // Cleanup function
    return () => {
      // Remove any global variables when component unmounts
      if (typeof window !== 'undefined') {
        window.removeEventListener('section-change', () => {});
      }
    };
  }, [courseId, sectionId, navigate]);
  
  return (
    <div className="mathigon-wrapper">
      {loading && (
        <div className="mathigon-loading">
          <div className="spinner"></div>
          <p>Loading course content...</p>
        </div>
      )}
      
      {error && (
        <div className="mathigon-error-banner">
          <p>{error}</p>
          <button onClick={() => navigate(`/fallback/${courseId}${sectionId ? `/${sectionId}` : ''}`, { replace: true })}>
            Alternative View
          </button>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="mathigon-container"
        style={{ opacity: loading ? 0 : 1 }}
      />
    </div>
  );
};

export default MathigonCourse;