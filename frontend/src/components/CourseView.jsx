import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCourseById, 
  getCourseContent, 
  getGlossaryDefinition, 
  getAssistantResponse,
  getAvailableTranslations,
  loadTranslation,
  parseMathigonMd
} from '../utils/contentLoader';
import Notification from '../components/Notification';
import ChatBot from '../components/ChatBot';
import LazyImage from './LazyImage';
import axios from 'axios';

// Lazy load the InteractiveComponent to reduce initial bundle size
const InteractiveComponent = lazy(() => import('../interactive/InteractiveComponent'));

const CourseView = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState({
    title: 'Loading...',
    description: 'Course content is loading...',
    color: '#6366F1',
    sections: []
  });
  const [courseContent, setCourseContent] = useState(null);
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
  
  // Function to calculate progress percentage based on completed sections
  const calculateProgress = useCallback((completedSecs, totalSections) => {
    if (!totalSections || totalSections === 0) return 0;
    return Math.round((completedSecs.length / totalSections) * 100);
  }, []);

  // Parse course content from Mathigon markdown
  const renderCourseContent = useCallback((rawContent) => {
    if (!rawContent) return '';
    
    // Use the parseMathigonMd function from contentLoader utility
    try {
      // We'll directly render content in the container div
      return { __html: parseMathigonMd(rawContent).html || '' };
    } catch (error) {
      console.error('Error parsing course content:', error);
      setError('Failed to parse course content. Please try again later.');
      return { __html: '<div class="error-message">Failed to load course content</div>' };
    }
  }, []);

  // Memoize the iframe setup to prevent unnecessary re-renders
  const setupIframe = useCallback(() => {
    // No iframe setup needed
  }, []);

  useEffect(() => {
    // Fetch course data when component mounts or courseId changes
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get course info
        const courseInfo = getCourseById(courseId);
        if (!courseInfo) {
          throw new Error(`Course not found: ${courseId}`);
        }
        
        // Update course state
        setCourse({
          ...courseInfo,
          sections: courseInfo.sections || []
        });
        
        // Get language availability
        const langs = await getAvailableTranslations(courseId);
        setAvailableLanguages(langs);
        
        // Fetch course content
        const contentData = await getCourseContent(courseId);
        if (!contentData) {
          throw new Error(`Could not load content for course: ${courseId}`);
        }
        
        // Set the content directly in the state
        setCourseContent(contentData.content);
        setLoading(false);
        
        // Get progress info
        try {
          // Load progress data from localStorage
          const savedProgress = localStorage.getItem(`course-progress-${courseId}`);
          if (savedProgress) {
            const progressData = JSON.parse(savedProgress);
            setCompletedSections(progressData.completedSections || []);
            
            // Calculate and set progress percentage
            const progressPercentage = calculateProgress(
              progressData.completedSections || [], 
              courseInfo.sections?.length || 0
            );
            setProgress(progressPercentage);
            
            // Update course progress in localStorage courses list
            updateCourseProgressInList(courseId, progressPercentage);
          }
          const userId = localStorage.getItem('userId');
          if (userId) {
            const progressResponse = await axios.get(`${import.meta.env.VITE_API_BASE}/api/progress/${userId}/${courseId}`);
            if (progressResponse.data && progressResponse.data.completed) {
              setCompletedSections(progressResponse.data.completed);
              
              // Set progress percentage
              if (courseInfo.sections && courseInfo.sections.length > 0) {
                const percentage = Math.round((progressResponse.data.completed.length / courseInfo.sections.length) * 100);
                setProgress(percentage);
              }
            }
          }
        } catch (progressError) {
          console.warn('Could not fetch progress data:', progressError);
          // Don't fail the whole load due to progress fetch failing
        }
      } catch (err) {
        console.error('Failed to fetch course data:', err);
        setError(err.message || 'Failed to load course data');
        setLoading(false);
        
        // Add retry notification
        addNotification({
          id: 'retry-course-load',
          message: 'Failed to load course. Click to retry.',
          type: 'error',
          action: fetchCourseData
        });
      }
    };
    
    fetchCourseData();
    
    document.title = `${course.title} | Kha-Boom Learning`;
    
    // Set up events when content container is ready
    if (contentRef.current) {
      // Set up listeners for glossary terms
      contentRef.current.addEventListener('click', handleGlossaryClick);
    }
    
    // Clean up event listeners
    return () => {
      if (contentRef.current) {
        contentRef.current.removeEventListener('click', handleGlossaryClick);
      }
    };
  }, [courseId, currentSection]);

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

  // Handle interactions with content elements with error boundaries
  useEffect(() => {
    if (!contentRef.current || !course || !course.sections) return;
    
    try {
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
    } catch (err) {
      console.error("Error handling content interactions:", err);
    }
  }, [currentSection, course, processInteractiveElements, completedSections]);

  // Close glossary popup when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveGlossary(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Update progress when section changes or a section is completed
  useEffect(() => {
    if (!course.sections || course.sections.length === 0) return;
    
    // Calculate new progress based on completed sections
    const newProgress = calculateProgress(completedSections, course.sections.length);
    setProgress(newProgress);
    
    // Save progress to localStorage
    saveProgressToLocalStorage();
    
    // Update the course progress in the courses list
    updateCourseProgressInList(courseId, newProgress);
  }, [completedSections, course.sections, courseId, calculateProgress]);

  // Function to save progress to localStorage
  const saveProgressToLocalStorage = useCallback(() => {
    if (!courseId) return;
    
    const progressData = {
      courseId,
      completedSections,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(`course-progress-${courseId}`, JSON.stringify(progressData));
  }, [courseId, completedSections]);

  // Function to update progress in the courses list
  const updateCourseProgressInList = useCallback((id, progressValue) => {
    // Get courses from localStorage
    const savedCourses = localStorage.getItem('courses-data');
    if (!savedCourses) return;
    
    try {
      const coursesData = JSON.parse(savedCourses);
      
      // Update the progress value for the specific course
      const updatedCourses = coursesData.map(course => {
        if (course.id === id) {
          return { ...course, progress: progressValue };
        }
        return course;
      });
      
      // Save the updated courses back to localStorage
      localStorage.setItem('courses-data', JSON.stringify(updatedCourses));
    } catch (error) {
      console.error('Error updating course progress in list:', error);
    }
  }, []);

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
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setNewMessage(''); // Clear input immediately for better UX
    
    // Generate bot response using the content loader utility
    setTimeout(() => {
      try {
        const response = getAssistantResponse(courseId, userMessage);
        setMessages(prev => [...prev, { sender: 'bot', text: response }]);
      } catch (err) {
        console.error("Error generating assistant response:", err);
        setMessages(prev => [...prev, { sender: 'bot', text: "I'm sorry, I couldn't process your request at this time." }]);
      }
    }, 800);
  };

  if (loading) {
    return (
      <div className="loading-container hardware-accelerated">
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

  if (error) {
    return (
      <motion.div 
        className="error"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Error Loading Course</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.main 
      className="course-view hardware-accelerated" 
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
            {course.level && (
              <span className="level">Level: {course.level}</span>
            )}
            {course.category && (
              <span className="category">Category: {course.category}</span>
            )}
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
                  {Array.isArray(availableLanguages) && availableLanguages.map(lang => (
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
          <div className="section-progress">
            <div className="progress-bar" style={{ width: `${progress}%`, backgroundColor: course.color }}></div>
            <div className="progress-text">{progress}% Complete</div>
          </div>
          <ul className="section-list">
            {course.sections && Array.isArray(course.sections) && course.sections.length > 0 ? (
              course.sections.map((section, index) => (
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
              ))
            ) : (
              <li>No sections available</li>
            )}
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
            className="course-content hardware-accelerated"
            key={currentSection} // This forces re-animation when section changes
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-content">
              <h2>
                {course.sections && 
                 Array.isArray(course.sections) && 
                 course.sections[currentSection] ? 
                 course.sections[currentSection].title : 
                 'Content Loading...'}
              </h2>
              <div className="course-content-container" ref={contentRef}>
                {loading ? (
                  <div className="content-loading-state">
                    <div className="spinner"></div>
                    <p>Loading course content...</p>
                  </div>
                ) : error ? (
                  <div className="content-error-state">
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button 
                      className="btn btn-outline" 
                      onClick={fetchCourseData}
                      style={{ borderColor: course.color, color: course.color }}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div 
                    className="mathigon-content" 
                    dangerouslySetInnerHTML={renderCourseContent(courseContent)}
                  />
                )}
              </div>
              
              {/* Interactive component modal */}
              <AnimatePresence>
                {activeInteractive && (
                  <motion.div 
                    className="interactive-modal hardware-accelerated"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="interactive-modal-content">
                      <button className="close-button" onClick={() => setActiveInteractive(null)}>×</button>
                      <h3>Interactive Demonstration</h3>
                      <Suspense fallback={<div>Loading interactive content...</div>}>
                        <InteractiveComponent 
                          type={activeInteractive.type} 
                          params={activeInteractive.params} 
                          courseId={courseId}
                        />
                      </Suspense>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Glossary tooltip with animation */}
              <AnimatePresence>
                {activeGlossary && (
                  <motion.div 
                    className="glossary-tooltip hardware-accelerated" 
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
                {course.sections && 
                 Array.isArray(course.sections) && 
                 currentSection < course.sections.length - 1 && (
                  <motion.button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Mark current section as completed if it's not already
                      if (!completedSections.includes(currentSection)) {
                        setCompletedSections(prev => [...prev, currentSection]);
                      }
                      // Move to next section
                      setCurrentSection(currentSection + 1);
                    }}
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
                className="course-chat hardware-accelerated"
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
