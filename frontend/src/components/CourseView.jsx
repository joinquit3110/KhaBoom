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

  // Parse course content from Mathigon markdown or JSON structure
  const renderCourseContent = useCallback((courseData) => {
    if (!courseData || !courseData.content) {
      console.error('No valid course content provided');
      setError('Failed to load course content. Please try again later.');
      return { __html: '<div class="error-message">Failed to load course content</div>' };
    }
    
    try {
      console.log('Course content data structure:', Object.keys(courseData.content).join(', '));
      
      // Set course sections for navigation if available
      if (courseData.course && courseData.course.sections) {
        console.log(`Course has ${courseData.course.sections.length} sections`);
      }
      
      // Handle different content formats
      if (courseData.content.html) {
        // We already have HTML content from structured JSON data
        console.log('Using pre-generated HTML content');
        return { __html: courseData.content.html };
      } else if (typeof courseData.content === 'string') {
        // If we somehow still have a raw string, use parseMathigonMd
        console.log('Using raw string content');
        return { __html: parseMathigonMd(courseData.content).html || '' };
      } else if (courseData.content.sections && Array.isArray(courseData.content.sections)) {
        // If we have sections, construct HTML
        console.log(`Constructing HTML from ${courseData.content.sections.length} sections`);
        
        // Start with the course title
        let html = `<h1>${courseData.course?.title || 'Course Content'}</h1>\n`;
        
        // If we're looking at a specific section
        if (currentSection >= 0 && courseData.content.sections[currentSection]) {
          const section = courseData.content.sections[currentSection];
          html = `<div class="current-section">${section.content}</div>`;
        } else {
          // Otherwise show all sections
          courseData.content.sections.forEach(section => {
            // Content might already be HTML if it came from the JSON data
            html += section.content;
          });
        }
        
        console.log('Generated HTML from sections successfully');
        return { __html: html };
      }
      
      // Fallback for empty content
      return { __html: `<h1>${courseData.course.title || 'Course Content'}</h1><p>This course is currently under development.</p>` };
    } catch (error) {
      console.error('Error parsing course content:', error);
      setError('Failed to parse course content. Please try again later.');
      return { __html: '<div class="error-message">Failed to parse course content</div>' };
    }
  }, []);

  // Memoize the iframe setup to prevent unnecessary re-renders
  const setupIframe = useCallback(() => {
    // No iframe setup needed
  }, []);

  // Function to generate correct icon and content URLs
  const getResourceUrl = useCallback((path) => {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  }, []);

  // Fetch course data with improved error handling
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get course info
      const courseInfo = getCourseById(courseId);
      if (!courseInfo) {
        throw new Error(`Course not found: ${courseId}`);
      }
      
      console.log('Course info found:', courseInfo);
      
      // Update course state with properly formatted hero image URL
      setCourse({
        ...courseInfo,
        sections: courseInfo.sections || [],
        thumbnail: getResourceUrl(courseInfo.thumbnail || `/content/${courseId}/hero.jpg`)
      });
      
      // Get language availability
      const langs = await getAvailableTranslations(courseId);
      setAvailableLanguages(langs);
      
      try {
        // Skip direct file loading and use our improved getCourseContent which handles fallbacks
        console.log(`Loading content for course: ${courseId}`);
        
        // Use the improved content loader which has multiple fallback strategies
        const contentData = await getCourseContent(courseId);
        
        if (!contentData || !contentData.content) {
          throw new Error(`Could not load content for course: ${courseId}`);
        }
        
        console.log('Content loaded successfully:', 
          Object.keys(contentData.content).join(', '), 
          'with course:', contentData.course?.title);
          
        // Store the full contentData
        setCourseContent(contentData);
        setLoading(false);
        
        // Try to load progress data
        loadProgressData(courseInfo);
      } catch (err) {
        console.error(`Error fetching course content: ${err.message}`);
        
        // Create a minimal fallback content object for graceful degradation
        const fallbackContent = {
          course: courseInfo,
          content: {
            html: `<div class="error-fallback">
              <h1>${courseInfo.title}</h1>
              <p>${courseInfo.description}</p>
              <p>Full content is currently unavailable. Please try again later.</p>
            </div>`,
            sections: [{ id: 'introduction', title: 'Introduction', content: courseInfo.description }]
          }
        };
        
        setCourseContent(fallbackContent);
        setLoading(false);
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
  
  // Helper function to load progress data
  const loadProgressData = async (courseInfo) => {
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
        const apiBase = import.meta.env.VITE_API_BASE || '';
        const progressResponse = await axios.get(`${apiBase}/api/progress/${userId}/${courseId}`);
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
  };

  useEffect(() => {
    // Fetch course data when component mounts or courseId changes
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

  // Handle clicks outside of glossary tooltip to close it
  const handleClickOutside = useCallback(() => {
    setActiveGlossary(null);
  }, []);
  
  useEffect(() => {
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
    
    // Analyze message for potential answers to questions
    setTimeout(() => {
      try {
        // Check for question patterns like "What is X?"
        if (userMessage.match(/^what\s+is|^how\s+do|^why\s+does|^explain/i)) {
          // This is a question, not an answer
          const response = getAssistantResponse(courseId, userMessage);
          setMessages(prev => [...prev, { 
            sender: 'bot', 
            text: response 
          }]);
          return;
        }
        
        // Simplistic answer checking - in a real app this would be more sophisticated
        // Check against known answers for common questions in this course
        const answers = {
          'probability': {
            'binomial distribution': {
              correct: ['combination of n and k times p to k power times q to n minus k'],
              alternatives: ['n choose k times p^k times q^(n-k)', 'combination formula with probability']
            },
            '0.5': {
              correct: ['0.5', '1/2', 'one half', 'half', '0.50', '50%', 'fifty percent'],
              context: 'probability of heads on a fair coin'
            }
          },
          'circles': {
            'pi': {
              correct: ['3.14159', 'approximately 3.14', 'circumference divided by diameter'],
              alternates: ['ratio of circumference to diameter']
            }
          },
          'general': {
            'pythagoras': {
              correct: ['a squared plus b squared equals c squared', 'a^2 + b^2 = c^2'],
              alternates: ['sum of squares of two sides equals square of hypotenuse']
            }
          }
        };
        
        // Normalize user input for comparison
        const normalizedInput = userMessage.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[.,;?!]/g, '');
        
        // Try to match user input against known answers
        let isCorrect = false;
        let matchedAnswer = null;
        let topicContext = '';
        
        const courseAnswers = answers[courseId] || answers.general;
        if (courseAnswers) {
          // Check each potential answer topic
          for (const [topic, answerObj] of Object.entries(courseAnswers)) {
            // Check if user message contains this topic
            if (normalizedInput.includes(topic)) {
              topicContext = topic;
              
              // Check correct answers
              for (const correct of answerObj.correct) {
                if (normalizedInput.includes(correct.toLowerCase())) {
                  isCorrect = true;
                  matchedAnswer = topic;
                  break;
                }
              }
              
              // Check alternative formulations
              if (!isCorrect && answerObj.alternatives) {
                for (const alt of answerObj.alternatives) {
                  if (normalizedInput.includes(alt.toLowerCase())) {
                    isCorrect = true;
                    matchedAnswer = topic;
                    break;
                  }
                }
              }
              
              if (isCorrect) break;
            }
          }
        }
        
        // Determine if this might be an answer to a previously asked question
        const lastMessages = messages.slice(-3);
        const hasRecentQuestion = lastMessages.some(msg => 
          msg.sender === 'bot' && 
          (msg.text.includes('?') || 
           msg.text.toLowerCase().includes('what') ||
           msg.text.toLowerCase().includes('how') ||
           msg.text.toLowerCase().includes('calculate'))
        );
        
        if (matchedAnswer || hasRecentQuestion) {
          // This appears to be an answer to a question
          if (isCorrect) {
            // Correct answer response
            const responses = [
              `That's correct! Great job understanding ${matchedAnswer || 'this concept'}.`,
              `Excellent! Your answer about ${matchedAnswer || 'this topic'} is spot on.`, 
              `Perfect! You've mastered ${matchedAnswer || 'this concept'}.`,
              `You got it right! ${matchedAnswer ? `The answer about ${matchedAnswer} is correct.` : ''}`
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            setMessages(prev => [...prev, { 
              sender: 'bot', 
              type: 'correct',
              text: response
            }]);
            
            // Add a random follow-up to extend the learning
            if (Math.random() > 0.5) {
              setTimeout(() => {
                const followUps = [
                  `Would you like to learn more about advanced applications of ${matchedAnswer || 'this concept'}?`,
                  `Can you think of a real-world example where this would be applied?`,
                  `Let me know if you want to explore this topic further.`
                ];
                const followUp = followUps[Math.floor(Math.random() * followUps.length)];
                
                setMessages(prev => [...prev, { 
                  sender: 'bot', 
                  text: followUp
                }]);
              }, 1000);
            }
          } else {
            // Incorrect answer response
            const incorrectResponses = [
              `That's not quite right. Let me help clarify this concept.`,
              `Almost there, but not exactly. Let's review this together.`,
              `That's incorrect. Would you like a hint to guide you to the right answer?`,
              `I think you might be mixing up some concepts. Let's break this down step by step.`
            ];
            const response = incorrectResponses[Math.floor(Math.random() * incorrectResponses.length)];
            
            setMessages(prev => [...prev, { 
              sender: 'bot', 
              type: 'incorrect',
              text: response
            }]);
            
            // After a short delay, provide a hint
            setTimeout(() => {
              const hints = [
                `Hint: Review the formula discussed in this section.`,
                `Hint: Consider the relationship between ${topicContext || 'the key variables'}.`,
                `Hint: The correct approach involves ${matchedAnswer || 'applying the principles we discussed'}.`,
                `Hint: Try thinking about this problem differently. What are the given values and what are we trying to find?`
              ];
              const hint = hints[Math.floor(Math.random() * hints.length)];
              
              setMessages(prev => [...prev, { 
                sender: 'bot', 
                type: 'hint',
                text: hint
              }]);
            }, 1500);
          }
        } else {
          // This doesn't seem to be an answer to a known question
          // Get standard assistant response
          const response = getAssistantResponse(courseId, userMessage);
          setMessages(prev => [...prev, { 
            sender: 'bot', 
            text: response 
          }]);
        }
      } catch (err) {
        console.error("Error generating assistant response:", err);
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: "I'm sorry, I couldn't process your request at this time." 
        }]);
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
