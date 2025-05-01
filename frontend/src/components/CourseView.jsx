import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getCourseById, 
  getCourseContent, 
  getGlossaryDefinition, 
  getAssistantResponse,
  getAvailableTranslations,
  loadTranslation
} from '../utils/contentLoader';

const CourseView = () => {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
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

  // Load course data and available languages
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        
        // First get available translations
        const translations = await getAvailableTranslations(courseId);
        setAvailableLanguages(translations);
        
        // Then load the content in the selected language
        const courseData = await loadTranslation(courseId, language);
        
        if (courseData) {
          setCourse({
            ...courseData.course,
            sections: courseData.content.sections
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading course:', error);
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId, language]);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
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
      }
    };
    
    // Add click handlers to all glossary terms
    glossaryTerms.forEach(term => {
      term.addEventListener('click', handleGlossaryClick);
    });
    
    // Remove event listeners on cleanup
    return () => {
      glossaryTerms.forEach(term => {
        term.removeEventListener('click', handleGlossaryClick);
      });
    };
  }, [currentSection, course]);
  
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
    }, 800);

    // Clear the input
    setNewMessage('');
  };

  if (loading) {
    return <div className="loading">Loading course content...</div>;
  }

  if (!course) {
    return <div className="error-message">Course not found</div>;
  }

  return (
    <main className="course-view">
      <div className="course-header" style={{ backgroundColor: course.color }}>
        <div className="container">
          <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
          <div className="course-header-content">
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>
          </div>
          
          {/* Language selector */}
          <div className="language-selector">
            <button 
              className="language-button"
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
            >
              {availableLanguages.find(lang => lang.code === language)?.name || 'English'}
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {languageMenuOpen && (
              <div className="language-dropdown">
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="course-container">
        <div className="course-sidebar">
          <h3>Course Sections</h3>
          <ul className="section-list">
            {course.sections.map((section, index) => (
              <li 
                key={index} 
                className={currentSection === index ? 'active' : ''}
                onClick={() => setCurrentSection(index)}
              >
                {section.title}
              </li>
            ))}
          </ul>
          <button 
            className="chat-toggle" 
            onClick={() => setChatOpen(!chatOpen)}
            style={{ backgroundColor: course.color }}
          >
            {chatOpen ? 'Close Assistant' : 'Learning Assistant'}
          </button>
        </div>

        <div className="course-content">
          <div className="section-content">
            <h2>{course.sections[currentSection].title}</h2>
            <div 
              className="content-html"
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: course.sections[currentSection].content }}
            />
            
            {/* Glossary tooltip */}
            {activeGlossary && (
              <div 
                className="glossary-tooltip" 
                style={{
                  top: activeGlossary.position.top,
                  left: activeGlossary.position.left
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h4>{activeGlossary.term}</h4>
                <p>{activeGlossary.definition}</p>
              </div>
            )}
            <div className="section-navigation">
              {currentSection > 0 && (
                <button 
                  className="btn btn-outline"
                  onClick={() => setCurrentSection(currentSection - 1)}
                >
                  ← Previous Section
                </button>
              )}
              {currentSection < course.sections.length - 1 && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentSection(currentSection + 1)}
                  style={{ backgroundColor: course.color }}
                >
                  Next Section →
                </button>
              )}
            </div>
          </div>
        </div>

        {chatOpen && (
          <div className="course-chat">
            <div className="chat-header" style={{ backgroundColor: course.color }}>
              <h3>Learning Assistant</h3>
            </div>
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* This element will be scrolled into view */}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Ask a question..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit" 
                style={{ backgroundColor: course.color }}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default CourseView;
