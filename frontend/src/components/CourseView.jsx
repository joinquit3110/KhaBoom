import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCourseById, 
  getCourseContent, 
  getGlossaryDefinition, 
  getAssistantResponse,
  getAvailableTranslations,
  loadTranslation
} from '../utils/contentLoader';
import InteractiveComponent from '../interactive/InteractiveComponent';
import Notification from '../components/Notification';
import ChatBot from '../components/ChatBot';
import axios from 'axios';

const CourseView = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const contentRef = useRef(null);
  const [activeGlossary, setActiveGlossary] = useState(null);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi there! I\'m your learning assistant. Ask me anything about this course!' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  // Language selection state
  const [language, setLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState([{ code: 'en', name: 'English' }]);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  
  // Interactive elements state
  const [interactiveElements, setInteractiveElements] = useState([]);
  const [activeInteractive, setActiveInteractive] = useState(null);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState([]);

  useEffect(() => {
    // Set up Mathigon course content iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${import.meta.env.VITE_API_BASE}/course/${courseId}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.onload = () => setLoading(false);
    iframe.onerror = () => {
      setError("Failed to load course content");
      setLoading(false);
    };
    
    // Clear previous content and append iframe
    const container = document.getElementById('course-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(iframe);
    }
    
    // Fetch course metadata
    axios.get(`${import.meta.env.VITE_API_BASE}/api/courses`)
      .then(res => {
        const foundCourse = res.data.courses.find(c => c.id === courseId);
        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          setError("Course not found");
        }
      })
      .catch(err => {
        console.error("Error fetching course data:", err);
        setError("Failed to load course information");
      });
      
    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [courseId]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Process interactive elements in the course content
  const processInteractiveElements = useCallback(() => {
    if (!contentRef.current) return;
    
    // Find all interactive elements in the content
    const elements = contentRef.current.querySelectorAll('.interactive-element');
    const interactives = [];
    
    elements.forEach((el, index) => {
      const type = el.classList[1]; // geopad, graph, etc.
      const params = el.getAttribute('data-params');
      
      interactives.push({
        id: `${type}-${index}`,
        type,
        params: params ? JSON.parse(params.replace(/'/g, '"')) : {},
        element: el
      });
      
      // Add click event to activate the interactive
      el.addEventListener('click', () => {
        setActiveInteractive({
          id: `${type}-${index}`,
          type,
          params: params ? JSON.parse(params.replace(/'/g, '"')) : {}
        });
      });
    });
    
    setInteractiveElements(interactives);
  }, []);
  
  // Handle interactions with content elements
  useEffect(() => {
    if (!contentRef.current) return;
    
    // Add event listeners to glossary terms
    const glossaryTerms = contentRef.current.querySelectorAll('.term');
    
    const handleGlossaryClick = (e) => {
      const term = e.target.getAttribute('data-gloss');
      if (term) {
        setActiveGlossary({
          term,
          definition: getGlossaryDefinition(term),
          position: {
            top: e.clientY + 10,
            left: e.clientX - 100
          }
        });
        
        // Show a notification that a glossary term was viewed
        addNotification({
          type: 'info',
          message: `Glossary: ${term}`,
          duration: 3000
        });
      }
    };
    
    // Add click handlers to all glossary terms
    glossaryTerms.forEach(term => {
      term.addEventListener('click', handleGlossaryClick);
    });
    
    // Process interactive elements
    processInteractiveElements();
    
    // Mark section as viewed after 10 seconds
    const timer = setTimeout(() => {
      if (!completedSections.includes(currentSection)) {
        setCompletedSections(prev => [...prev, currentSection]);
        const newProgress = Math.floor(((completedSections.length + 1) / (course?.sections?.length || 1)) * 100);
        setProgress(newProgress);
        
        // Show progress notification
        addNotification({
          type: 'success',
          message: `Progress: ${newProgress}% complete`,
          duration: 3000
        });
      }
    }, 10000);
    
    // Remove event listeners on cleanup
    return () => {
      glossaryTerms.forEach(term => {
        term.removeEventListener('click', handleGlossaryClick);
      });
      clearTimeout(timer);
    };
  }, [currentSection, course, processInteractiveElements, completedSections]);
  
  // Close glossary popup when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveGlossary(null);
    };
    
    if (activeGlossary) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeGlossary]);

  // Add notification to the notifications array
  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    setNotificationOpen(true);
    
    // Auto-dismiss after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  };
  
  // Remove notification from the array
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    if (notifications.length <= 1) {
      setNotificationOpen(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = newMessage.trim();
    // Add the user message
    setMessages([...messages, { sender: 'user', text: userMessage }]);
    
    // Generate bot response using the content loader utility
    setTimeout(() => {
      const response = getAssistantResponse(courseId, userMessage);
      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
      setNewMessage('');
    }, 800);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <motion.div 
          className="loading"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360] 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity 
          }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return (
      <motion.div 
        className="error"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Course not found
      </motion.div>
    );
  }

  return (
    <motion.main 
      className="course-view" 
      style={{ "--course-color": course.color }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Notification system */}
      <AnimatePresence>
        {notificationOpen && (
          <Notification 
            notifications={notifications} 
            removeNotification={removeNotification} 
          />
        )}
      </AnimatePresence>
      
      {/* Course header with animation */}
      <motion.div 
        className="course-header" 
        style={{ backgroundColor: course.color }}
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="container">
          <h1>{course.title}</h1>
          <p className="course-description">{course.description}</p>
          
          <div className="course-meta">
            <span className="level">Level: {course.level}</span>
            <span className="category">Category: {course.category}</span>
            <span className="progress">Progress: {progress}%</span>
            
            <div className="language-selector">
              <button 
                className="language-button"
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              >
                {availableLanguages.find(lang => lang.code === language)?.name || 'English'}
              </button>
              
              <AnimatePresence>
                {languageMenuOpen && (
                <motion.div 
                  className="language-dropdown"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {availableLanguages.map(lang => (
                    <button
                      key={lang.code}
                      className={`language-option ${lang.code === language ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLanguageMenuOpen(false);
                      }}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="course-container">
        <motion.div 
          className="course-sidebar"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3>Course Sections</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`,
                backgroundColor: course.color
              }}
            ></div>
          </div>
          <ul className="section-list">
            {course.sections.map((section, index) => (
              <motion.li 
                key={index} 
                className={`${currentSection === index ? 'active' : ''} ${completedSections.includes(index) ? 'completed' : ''}`}
                onClick={() => setCurrentSection(index)}
                whileHover={{ scale: 1.05, x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <span className="section-number">{index + 1}</span>
                <span className="section-title">{section.title}</span>
                {completedSections.includes(index) && (
                  <span className="completion-mark">✓</span>
                )}
              </motion.li>
            ))}
          </ul>
          <motion.button 
            className="chat-toggle" 
            onClick={() => setChatOpen(!chatOpen)}
            style={{ backgroundColor: course.color }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {chatOpen ? 'Close Assistant' : 'Learning Assistant'}
          </motion.button>
          </motion.div>

          <motion.div 
            className="course-content"
            key={currentSection} // This forces re-animation when section changes
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-content">
              <h2>{course.sections[currentSection].title}</h2>
              <div 
                className="content-html"
                ref={contentRef}
                dangerouslySetInnerHTML={{ __html: course.sections[currentSection].content }}
              />
              
              {/* Interactive component modal */}
              <AnimatePresence>
                {activeInteractive && (
                  <motion.div 
                    className="interactive-modal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="interactive-modal-content">
                      <button className="close-button" onClick={() => setActiveInteractive(null)}>×</button>
                      <h3>Interactive Demonstration</h3>
                      <InteractiveComponent 
                        type={activeInteractive.type} 
                        params={activeInteractive.params} 
                        courseId={courseId}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Glossary tooltip with animation */}
              <AnimatePresence>
                {activeGlossary && (
                  <motion.div 
                    className="glossary-tooltip" 
                    style={{
                      top: activeGlossary.position.top,
                      left: activeGlossary.position.left
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4>{activeGlossary.term}</h4>
                    <p>{activeGlossary.definition}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="section-navigation">
                {currentSection > 0 && (
                  <motion.button 
                    className="btn btn-outline"
                    onClick={() => setCurrentSection(currentSection - 1)}
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ← Previous Section
                  </motion.button>
                )}
                {currentSection < course.sections.length - 1 && (
                  <motion.button 
                    className="btn btn-primary"
                    onClick={() => setCurrentSection(currentSection + 1)}
                    style={{ backgroundColor: course.color }}
                    whileHover={{ scale: 1.05, x: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next Section →
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {chatOpen && (
              <motion.div 
                className="course-chat"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChatBot 
                  courseId={courseId} 
                  courseColor={course.color} 
                  initialMessages={messages}
                  onSendMessage={handleSendMessage}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  messagesEndRef={messagesEndRef}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.main>
    );
  };

export default CourseView;
