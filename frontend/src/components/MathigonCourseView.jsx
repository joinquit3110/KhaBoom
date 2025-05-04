import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MathigonLoader from './MathigonLoader';
import './courseReader.css';

/**
 * MathigonCourseView Component
 * 
 * A streamlined component for displaying Mathigon interactive courses with all features:
 * - Mathematical typesetting
 * - Interactive diagrams and visualizations 
 * - Video and audio elements
 * - Animations and transitions
 * - Drag and drop interactions
 * - Drawing tools
 * - Minigames and puzzles
 * - Notifications
 * - Chatbox interactions
 */
const MathigonCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [progress, setProgress] = useState(0);
  
  // Handle notification display
  const handleNotification = useCallback((message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);
  
  // Handle section completion
  const handleSectionComplete = useCallback((sectionId) => {
    console.log(`Section completed: ${sectionId}`);
    
    // Update progress (simulated for now)
    setProgress(prev => Math.min(prev + 10, 100));
    
    // Show a completion notification
    handleNotification(`You've completed section "${sectionId}"! Great job!`);
    
    // You could save progress to a database here
  }, [handleNotification]);
  
  // Handle interaction start
  const handleInteractionStart = useCallback((componentId) => {
    console.log(`Interaction started with: ${componentId}`);
  }, []);
  
  // Handle back button click
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  useEffect(() => {
    // Set the page title
    document.title = `${courseId.charAt(0).toUpperCase() + courseId.slice(1)} | KHA-BOOM Learning`;
    
    return () => {
      // Reset title on unmount
      document.title = 'KHA-BOOM Learning';
    };
  }, [courseId]);
  
  return (
    <div className="mathigon-course-view">
      {/* Course header */}
      <div className="course-header">
        <button 
          className="back-button" 
          onClick={handleBackToDashboard}
        >
          &larr; Back to Dashboard
        </button>
        
        {/* Progress indicator */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}% complete</span>
        </div>
      </div>
      
      {/* Mathigon content */}
      <div className="course-content">
        <MathigonLoader 
          courseId={courseId}
          language="en"
          onSectionComplete={handleSectionComplete}
          onInteractionStart={handleInteractionStart}
          onNotification={handleNotification}
        />
      </div>
      
      {/* Notifications */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div 
              key={notification.id}
              className="notification"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              {notification.message}
              <button 
                className="close-notification"
                onClick={() => setNotifications(prev => 
                  prev.filter(n => n.id !== notification.id)
                )}
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Support panel */}
      <div className="support-panel">
        <button 
          className="support-button"
          onClick={() => handleNotification("Need help? Click on any interactive element to get started!")}  
        >
          ?
        </button>
      </div>
    </div>
  );
};

export default MathigonCourseView; 