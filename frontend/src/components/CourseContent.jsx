import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourseContent, getGlossaryDefinition } from '../utils/contentLoader';
import Spinner from './ui/Spinner';
import ErrorDisplay from './ui/ErrorDisplay';

/**
 * CourseContent Component
 * 
 * Displays the main content for a course, handling Mathigon's special markdown format
 * and rendering interactive elements
 */
const CourseContent = ({ userId }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [activeSection, setActiveSection] = useState('introduction');
  const contentRef = useRef(null);
  
  // Load course content when component mounts or courseId changes
  useEffect(() => {
    const loadContent = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const data = await getCourseContent(courseId);
        
        if (!data) {
          setError('Course content not found');
          setLoading(false);
          return;
        }
        
        setCourseData(data);
        setLoading(false);
        
        // Set default active section
        if (data.content && data.content.sections && data.content.sections.length > 0) {
          setActiveSection(data.content.sections[0].id);
        }
      } catch (err) {
        console.error('Error loading course content:', err);
        setError('Failed to load course content');
        setLoading(false);
      }
    };
    
    loadContent();
  }, [courseId]);
  
  // Update the DOM after content is loaded to handle interactives
  useEffect(() => {
    if (!loading && courseData && contentRef.current) {
      // Initialize glossary terms
      const glossTerms = contentRef.current.querySelectorAll('.term');
      glossTerms.forEach(term => {
        const glossId = term.getAttribute('data-gloss');
        
        // Show glossary definition on click
        term.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Get glossary definition
          const definition = getGlossaryDefinition(glossId);
          
          // Create tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'glossary-tooltip';
          tooltip.innerHTML = definition;
          
          // Position tooltip near the term
          const rect = term.getBoundingClientRect();
          tooltip.style.left = `${rect.left}px`;
          tooltip.style.top = `${rect.bottom + 10}px`;
          
          // Add tooltip to body
          document.body.appendChild(tooltip);
          
          // Remove tooltip when clicked outside
          const hideTooltip = () => {
            document.body.removeChild(tooltip);
            document.removeEventListener('click', hideTooltip);
          };
          
          setTimeout(() => {
            document.addEventListener('click', hideTooltip);
          }, 100);
        });
      });
      
      // Initialize interactive elements
      initializeInteractives();
    }
  }, [loading, courseData]);
  
  // Initialize all interactive elements
  const initializeInteractives = () => {
    if (!contentRef.current) return;
    
    // Find all interactive elements
    const interactives = contentRef.current.querySelectorAll('.interactive-element');
    
    interactives.forEach(element => {
      const type = element.classList[1]; // e.g., 'geopad', 'slider', etc.
      const params = element.getAttribute('data-params') || '';
      
      // Simple implementation of interactive elements
      // In a real implementation, you would initialize appropriate components
      switch (type) {
        case 'slider':
          createSlider(element, params);
          break;
        case 'geopad':
          createPlaceholder(element, 'Interactive Geometry', 'blue');
          break;
        case 'graph':
          createPlaceholder(element, 'Interactive Graph', 'purple');
          break;
        case 'equation':
          createPlaceholder(element, 'Interactive Equation', 'green');
          break;
        case 'sortable':
          createPlaceholder(element, 'Drag and Sort Items', 'orange');
          break;
        case 'picker':
          createPlaceholder(element, 'Multiple Choice Question', 'red');
          break;
        case 'quiz':
          createPlaceholder(element, 'Quiz', 'teal');
          break;
        case 'code':
          createPlaceholder(element, 'Code Editor', 'gray');
          break;
        case 'simulation':
          createPlaceholder(element, 'Interactive Simulation', 'indigo');
          break;
        default:
          createPlaceholder(element, `Interactive Element: ${type}`, 'navy');
      }
    });
  };
  
  // Create a simple slider implementation
  const createSlider = (element, params) => {
    // Parse parameters
    const paramsObj = {};
    params.split(' ').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        paramsObj[key] = value.replace(/['"]/g, '');
      }
    });
    
    // Create slider element
    element.innerHTML = '';
    element.classList.add('slider-container');
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = paramsObj.min || 0;
    slider.max = paramsObj.max || 100;
    slider.value = paramsObj.value || 50;
    slider.step = paramsObj.step || 1;
    
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = slider.value;
    
    element.appendChild(slider);
    element.appendChild(valueDisplay);
    
    // Update value display when slider changes
    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
    });
  };
  
  // Create a placeholder for interactive elements
  const createPlaceholder = (element, text, color) => {
    element.innerHTML = '';
    element.style.backgroundColor = color;
    element.style.color = 'white';
    element.style.padding = '20px';
    element.style.borderRadius = '8px';
    element.style.textAlign = 'center';
    element.style.margin = '10px 0';
    
    const placeholder = document.createElement('div');
    placeholder.textContent = text;
    placeholder.style.fontWeight = 'bold';
    
    const description = document.createElement('div');
    description.textContent = 'This interactive element will be available in a future update';
    description.style.fontSize = '0.8em';
    description.style.marginTop = '5px';
    
    element.appendChild(placeholder);
    element.appendChild(description);
  };
  
  // Render a section of content
  const renderSection = (section) => {
    if (!section || !section.content) {
      return <div className="section-content">No content available for this section.</div>;
    }
    
    return (
      <div 
        className="section-content"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    );
  };
  
  // Find the active section object
  const getActiveSection = () => {
    if (!courseData || !courseData.content || !courseData.content.sections) {
      return null;
    }
    
    return courseData.content.sections.find(section => section.id === activeSection);
  };
  
  // Render section navigation
  const renderSectionNav = () => {
    if (!courseData || !courseData.content || !courseData.content.sections) {
      return null;
    }
    
    return (
      <div className="section-navigation">
        {courseData.content.sections.map(section => (
          <button
            key={section.id}
            className={`section-nav-item ${section.id === activeSection ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.title}
          </button>
        ))}
      </div>
    );
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/courses');
  };
  
  if (loading) {
    return <Spinner message="Loading course content..." />;
  }
  
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  if (!courseData || !courseData.course) {
    return <ErrorDisplay message="Course not found" />;
  }
  
  const course = courseData.course;
  const activeContent = getActiveSection();
  
  return (
    <div className="course-content-container">
      <div className="course-header" style={{ backgroundColor: course.color || '#4d7fc2' }}>
        <button className="back-button" onClick={handleBack}>
          &larr; Back to Courses
        </button>
        <h1>{course.title}</h1>
      </div>
      
      {renderSectionNav()}
      
      <div className="content-wrapper" ref={contentRef}>
        {activeContent ? (
          <>
            <h2 className="section-title">{activeContent.title}</h2>
            {renderSection(activeContent)}
          </>
        ) : (
          <div className="no-content">
            <p>No content available for this section.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent; 