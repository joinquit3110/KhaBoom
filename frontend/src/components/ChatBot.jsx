import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import './ChatBot.css'; // Import our new CSS styles

// Use memo to prevent unnecessary re-renders of the ChatMessage component
const ChatMessage = memo(({ message, courseColor }) => {
  // Determine message styling based on type
  const getMessageStyle = () => {
    if (message.sender === 'user') {
      return { backgroundColor: courseColor + '22' }; // User message with transparency
    }
    
    // Bot messages with different types
    switch (message.type) {
      case 'correct':
        return { 
          backgroundColor: '#e6f7e6', 
          borderLeft: '3px solid #4CAF50' 
        };
      case 'incorrect':
        return { 
          backgroundColor: '#ffebee',
          borderLeft: '3px solid #F44336' 
        };
      case 'hint':
        return { 
          backgroundColor: '#fff8e1',
          borderLeft: '3px solid #FFC107' 
        };
      default:
        return { backgroundColor: '#f5f5f5' };
    }
  };
  
  return (
    <motion.div
      className={`chat-message ${message.sender === 'user' ? 'user' : 'bot'} ${message.type || ''}`}
      style={getMessageStyle()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {message.type === 'correct' && (
        <div className="message-icon correct">✓</div>
      )}
      
      {message.type === 'incorrect' && (
        <div className="message-icon incorrect">✗</div>
      )}
      
      {message.type === 'hint' && (
        <div className="message-icon hint">💡</div>
      )}
      
      <div className="message-content">
        {message.text}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = 'ChatMessage';

// Main ChatBot component
const ChatBot = ({ 
  courseId, 
  courseColor, 
  initialMessages = [], 
  onSendMessage, 
  newMessage, 
  setNewMessage,
  messagesEndRef 
}) => {
  // Memoize scroll to bottom function to prevent re-creation
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesEndRef]);

  // Efficient messages rendering with memoization
  const renderedMessages = React.useMemo(() => {
    return initialMessages.map((msg, index) => (
      <ChatMessage 
        key={index} 
        message={msg} 
        courseColor={courseColor} 
      />
    ));
  }, [initialMessages, courseColor]);

  // Throttle input changes to reduce rendering burden
  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
  }, [setNewMessage]);

  // Handle form submission with custom event handler
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (newMessage.trim().length === 0) return;
    
    if (onSendMessage) {
      onSendMessage(e);
    }
  }, [newMessage, onSendMessage]);

  // Use requestAnimationFrame for smoother scrolling
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.requestAnimationFrame(scrollToBottom);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [initialMessages, scrollToBottom]);

  return (
    <div className="chat-container hardware-accelerated">
      <div className="chat-header" style={{ backgroundColor: courseColor }}>
        <h3>Learning Assistant</h3>
      </div>
      
      <div className="chat-messages">
        {renderedMessages}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Ask a question..."
          aria-label="Chat message"
        />
        <button 
          type="submit" 
          style={{ backgroundColor: courseColor }}
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default memo(ChatBot);
