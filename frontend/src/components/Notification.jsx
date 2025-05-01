import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Notification = ({ notifications, removeNotification }) => {
  return (
    <div className="notification-container">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div 
            key={notification.id}
            className={`notification ${notification.type}`}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <div className="notification-content">
              {notification.type === 'success' && <span className="notification-icon">✓</span>}
              {notification.type === 'error' && <span className="notification-icon">✗</span>}
              {notification.type === 'info' && <span className="notification-icon">ℹ</span>}
              {notification.type === 'warning' && <span className="notification-icon">⚠</span>}
              
              <p>{notification.message}</p>
            </div>
            
            <button 
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notification;
