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

  // Load Mathigon scripts and initialize the textbook
  useEffect(() => {
    if (!courseId || initialized.current) return;
    
    const loadMathigonAssets = async () => {
      try {
        setLoading(true);
        
        // Define script sources for Mathigon assets
        const scriptSources = [
          '/mathigon/assets/course.js',
          // Additional scripts for advanced interactions
          '/mathigon/assets/boost.js'
        ];
        
        // Define stylesheet sources for Mathigon assets
        const stylesheetSources = [
          '/mathigon/assets/course.css',
          // Add additional stylesheets for components
          '/mathigon/assets/components.css'
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
            }
          });
          
          // Initialize the textbook
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
