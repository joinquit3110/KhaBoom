import React from 'react';
import { motion } from 'framer-motion';

const ChatBot = ({ 
  courseId, 
  courseColor, 
  initialMessages, 
  onSendMessage, 
  newMessage, 
  setNewMessage, 
  messagesEndRef 
}) => {
  // Message animation variants
  const messageVariants = {
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.9,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      }
    }
  };

  return (
    <>
      <div className="chat-header" style={{ backgroundColor: courseColor }}>
        <h3>Learning Assistant</h3>
        <div className="chat-typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className="chat-messages">
        {initialMessages.map((message, index) => (
          <motion.div 
            key={index} 
            className={`message ${message.sender}`}
            variants={messageVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          >
            {message.text}
          </motion.div>
        ))}
        <div ref={messagesEndRef} /> {/* This element will be scrolled into view */}
      </div>
      
      <form className="chat-input" onSubmit={onSendMessage}>
        <input
          type="text"
          placeholder="Ask a question about this course..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <motion.button 
          type="submit" 
          style={{ backgroundColor: courseColor }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!newMessage.trim()}
        >
          Send
        </motion.button>
      </form>
    </>
  );
};

export default ChatBot;
