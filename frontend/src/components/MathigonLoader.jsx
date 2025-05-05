import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * MathigonLoader component
 * This component handles loading Mathigon scripts and initializing the textbook functionality
 * to provide the same interactive experience as the original Mathigon platform.
 * 
 * Supports all interactive features:
 * - Mathematical typesetting
 * - Animations and transitions
 * - Interactive diagrams
 * - Video and audio elements
 * - Drag and drop interactions
 * - Drawing tools
 * - Minigames and puzzles
 * - Notifications
 * - Chatbox interactions
 */
const MathigonLoader = ({ courseId, language = 'en', onSectionComplete, onInteractionStart, onNotification }) => {
  const containerRef = useRef(null);
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [swRegistration, setSwRegistration] = useState(null);

  // Register/handle service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker API not available in this browser');
      return;
    }

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        setSwRegistration(registration);
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Wait for the service worker to be ready
        if (registration.installing) {
          registration.installing.addEventListener('statechange', e => {
            if (e.target.state === 'activated') {
              console.log('Service worker activated and ready');
            }
          });
        }
      } catch (err) {
        console.warn('Unable to register Service Worker.', err);
      }
    };

    registerSW();

    // Clean up on unmount
    return () => {
      if (swRegistration) {
        // We don't unregister to maintain offline capability, but we can remove event listeners
      }
    };
  }, []);

  // Helper function to clear cache if needed
  const clearMathigonCache = (recache = true) => {
    if (swRegistration) {
      swRegistration.active.postMessage({
        type: 'CLEAR_MATHIGON_CACHE',
        reCache: recache
      });
      return true;
    }
    return false;
  };

  // Load Mathigon scripts and initialize the textbook
  useEffect(() => {
    if (!courseId || initialized.current) return;
    
    const loadMathigonAssets = async () => {
      try {
        setLoading(true);
        
        // Define script sources for Mathigon assets
        const scriptSources = [
          '/mathigon/assets/course.js'
          // boost.js is optional and will be loaded only if needed
        ];
        
        // Define stylesheet sources for Mathigon assets
        const stylesheetSources = [
          '/mathigon/assets/course.css'
          // Additional stylesheets are optional
        ];
        
        // Load all required stylesheets
        stylesheetSources.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = src + '?v=' + (new Date().getTime());  // Cache busting
          document.head.appendChild(link);
        });
        
        // First check if scripts are already available
        if (window.Mathigon && window.Mathigon.TextbookLoader) {
          console.log('Mathigon already loaded, skipping script loading');
        } else {
          // Load all required scripts
          for (const src of scriptSources) {
            await loadScriptWithRetry(src, 2);
          }
          
          // Wait for scripts to be fully available
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Initialize the Mathigon textbook
        if (window.Mathigon && window.Mathigon.TextbookLoader) {
          console.log('Initializing Mathigon textbook for course:', courseId);
          
          // Set global configuration for Mathigon
          window.mathigonConfig = {
            assetsPrefix: '/mathigon/assets/',
            contentPrefix: '/mathigon/content/',
            language: language,
            // Enable all interactive features
            interactive: true,
            audio: true,
            animations: true
          };
          
          // Create and initialize the textbook
          const textbook = new window.Mathigon.TextbookLoader({
            courseId: courseId,
            language: language,
            sourcePrefix: '/mathigon/content/',
            container: containerRef.current || '#mathigon-textbook-container',
            // Enable all interactive features
            animations: true,
            progress: true,
            audio: true,
            // Important: set contentFormat to json
            contentFormat: 'json',
            // Enable drawing features
            drawing: true,
            // Event handlers
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
            },
            // New event handlers for all interactive features
            onDrawingComplete: (drawingId) => {
              console.log(`Drawing completed: ${drawingId}`);
            },
            onVideoPlay: (videoId) => {
              console.log(`Video started: ${videoId}`);
            },
            onAudioPlay: (audioId) => {
              console.log(`Audio started: ${audioId}`);
            },
            onGameComplete: (gameId, score) => {
              console.log(`Game completed: ${gameId} with score ${score}`);
              onNotification && onNotification(`Game completed with score: ${score}`);
            },
            onError: (error) => {
              console.error('TextbookLoader error:', error);
              // Try to recover by clearing cache if it's a content error
              if (error.message && error.message.includes('content') && !window.cacheCleared) {
                window.cacheCleared = true;
                if (clearMathigonCache()) {
                  console.log('Cleared mathigon cache due to content error');
                }
              }
            }
          });
          
          // Initialize the textbook
          try {
            await textbook.initialize();
            initialized.current = true;
            
            // Set up event listeners for interactive components
            setupInteractiveListeners();
            
            // Register global handlers for chat interactions
            setupChatHandlers();
            
            // Add a notification to welcome the user
            setTimeout(() => {
              onNotification && onNotification('Welcome to this interactive course! Explore by clicking on the various elements.');
            }, 2000);
          } catch (initError) {
            console.error("Error initializing textbook:", initError);
            // Try to load boost.js which might be needed
            try {
              await loadScriptWithRetry('/mathigon/assets/boost.js', 2);
              // Try to initialize again
              await textbook.initialize();
              initialized.current = true;
              
              setupInteractiveListeners();
              setupChatHandlers();
            } catch (retryError) {
              // If still failing, try clearing the cache and reloading
              if (clearMathigonCache() && !window.reloadingAfterCacheClear) {
                window.reloadingAfterCacheClear = true;
                console.log('Cleared cache and reloading page');
                setTimeout(() => window.location.reload(), 1000);
                return;
              }
              throw new Error(`Failed to initialize textbook: ${retryError.message}`);
            }
          }
        } else {
          throw new Error('Mathigon scripts did not load correctly');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading Mathigon assets:', err);
        setError(err.message || 'Failed to load Mathigon assets');
        setLoading(false);
        
        // Increment retry count and try again if not too many attempts
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          console.log(`Retrying (${retryCount + 1}/3)...`);
          setTimeout(() => {
            setError(null);
            loadMathigonAssets();
          }, 2000);
        }
      }
    };
    
    // Helper function to load a script with retry
    const loadScriptWithRetry = async (src, maxRetries = 1) => {
      let retries = 0;
      
      while (retries <= maxRetries) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src + '?v=' + (new Date().getTime()); // Cache busting
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
          });
          
          // If we reach here, the script loaded successfully
          console.log(`Successfully loaded ${src}`);
          return;
        } catch (err) {
          retries++;
          if (retries > maxRetries) {
            throw err; // Give up after max retries
          }
          console.warn(`Failed to load ${src}, retrying (${retries}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
        }
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
      
      // Listen for drag and drop interactions
      document.addEventListener('drag-start', (e) => {
        console.log('Drag started:', e.detail);
      });
      
      document.addEventListener('drop', (e) => {
        console.log('Drop event:', e.detail);
      });
      
      // Listen for minigame events
      document.addEventListener('game-start', (e) => {
        console.log('Game started:', e.detail);
      });
      
      document.addEventListener('game-end', (e) => {
        console.log('Game ended:', e.detail);
        if (e.detail && e.detail.success) {
          onNotification && onNotification('Game completed successfully!');
        }
      });
      
      // Listen for puzzle completion
      document.addEventListener('puzzle-complete', (e) => {
        console.log('Puzzle completed:', e.detail);
        onNotification && onNotification('Puzzle solved! Great job!');
      });
    };
    
    // Set up chat handlers
    const setupChatHandlers = () => {
      if (!window.Mathigon || !window.Mathigon.Chat) return;
      
      // Initialize chat functionality
      window.Mathigon.Chat.initialize({
        container: containerRef.current,
        onMessage: (message) => {
          console.log('Chat message received:', message);
        },
        onQuestion: async (question) => {
          console.log('Question asked:', question);
          // Here you could integrate with your own backend for AI responses
          return {
            answer: 'I understand your question. This is a placeholder response.',
            confidence: 0.8
          };
        }
      });
    };
    
    loadMathigonAssets();
    
    // Cleanup function
    return () => {
      // Clean up event listeners
      document.removeEventListener('popup-open', () => {});
      document.removeEventListener('popup-close', () => {});
      document.removeEventListener('drag-start', () => {});
      document.removeEventListener('drop', () => {});
      document.removeEventListener('game-start', () => {});
      document.removeEventListener('game-end', () => {});
      document.removeEventListener('puzzle-complete', () => {});
    };
  }, [courseId, language, onSectionComplete, onInteractionStart, onNotification, retryCount]);
  
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

  // Retry function for the user to manually retry
  const handleRetry = () => {
    // Clear cache and try again
    clearMathigonCache();
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  // Handle course switching to clear any cached data
  useEffect(() => {
    return () => {
      // Cleanup when course changes
      initialized.current = false;
    };
  }, [courseId]);
  
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
        <p className="mathigon-error-details">
          This may be due to network issues or missing resources.
          Try refreshing the page or clicking the button below.
        </p>
        <button 
          className="btn btn-primary"
          onClick={handleRetry}
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
