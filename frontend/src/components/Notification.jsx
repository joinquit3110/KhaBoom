import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Notification Component
 * 
 * Displays notifications as toast-style messages in the corner of the screen
 * Supports different types: info (default), success, warning, error
 */
const Notification = ({ notifications, removeNotification }) => {
  if (!notifications || notifications.length === 0) return null;
  
  return (
    <div className="notifications-container">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div 
            key={notification.id}
            className={`notification ${notification.type || 'info'}`}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
          >
            <div className="notification-content">
              {notification.message}
            </div>
            <button 
              className="close-notification"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close notification"
            >
              &times;
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification;
