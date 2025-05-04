import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parseMathigonMd } from '../utils/mathigonParser';
import './courseReader.css';

/**
 * CourseReader Component
 * 
 * Loads and renders course content directly from content.md files
 * in the content directory following Mathigon format
 */
const CourseReader = () => {
  const { courseId, sectionId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState(sectionId || null);
  const [contentPath, setContentPath] = useState('');
  const contentRef = useRef(null);
  
  useEffect(() => {
    // Function to load content directly from the content directory
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try different possible paths for the content, prioritizing the content directory
        const possiblePaths = [
          `/content/${courseId}/content.md`,                  // Direct content directory
          `/${courseId}/content.md`,                          // Root path
          `/originalweb/textbooks-master/content/${courseId}/content.md` // Original source (fallback)
        ];
        
        let mdContent = null;
        let usedPath = '';
        
        // Try each path until we find the content
        for (const path of possiblePaths) {
          console.log(`Attempting to load content from: ${path}`);
          try {
            const response = await fetch(path);
            if (response.ok) {
              mdContent = await response.text();
              usedPath = path;
              console.log(`Successfully loaded content from: ${path}`);
              break;
            } else {
              console.warn(`Failed to load from ${path}: ${response.status} ${response.statusText}`);
            }
          } catch (err) {
            console.warn(`Error loading from ${path}:`, err);
          }
        }
        
        if (!mdContent) {
          throw new Error(`Could not find content.md for ${courseId} in any of the expected locations.`);
        }
        
        setContentPath(usedPath);
        
        // Parse the markdown content using our Mathigon parser
        const parsedContent = parseMathigonMd(mdContent);
        setContent(parsedContent);
        
        // If section ID is provided in URL, set it as active
        if (sectionId) {
          setActiveSectionId(sectionId);
        } else if (parsedContent.sections && parsedContent.sections.length > 0) {
          // Default to first section if none specified
          setActiveSectionId(parsedContent.sections[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`Error loading course content for ${courseId}:`, err);
        setError(`Failed to load course content. ${err.message}`);
        setLoading(false);
      }
    };
    
    if (courseId) {
      loadContent();
    }
  }, [courseId, sectionId]);
  
  // Handle section change
  useEffect(() => {
    if (activeSectionId && activeSectionId !== sectionId) {
      // Update URL to reflect active section without reloading
      navigate(`/courses/${courseId}/${activeSectionId}`, { replace: true });
    }
    
    // Scroll to section when it changes
    if (activeSectionId && contentRef.current) {
      const sectionElement = contentRef.current.querySelector(`#${activeSectionId}`);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeSectionId, sectionId, courseId, navigate]);
  
  // Process interactive elements after rendering
  useEffect(() => {
    if (!loading && content && contentRef.current) {
      // Process input fields (blanks)
      const inputFields = contentRef.current.querySelectorAll('.input-field');
      inputFields.forEach(field => {
        if (!field.hasAttribute('data-processed')) {
          // Create input element
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'blank-input';
          input.placeholder = 'Enter answer';
          
          // Get correct value from data attribute
          const correctValue = field.getAttribute('data-value');
          
          // Handle input validation
          input.addEventListener('change', (e) => {
            const userValue = e.target.value.trim();
            if (userValue === correctValue) {
              field.classList.add('correct');
              field.classList.remove('incorrect');
            } else {
              field.classList.add('incorrect');
              field.classList.remove('correct');
              
              // Show hint if available
              const hint = field.getAttribute('data-hint');
              if (hint) {
                alert(`Hint: ${hint.replace(/[()]/g, '')}`);
              }
            }
          });
          
          field.innerHTML = '';
          field.appendChild(input);
          field.setAttribute('data-processed', 'true');
        }
      });
      
      // Process action buttons (including btn:next)
      const actionButtons = contentRef.current.querySelectorAll('.action-button, .btn-action');
      actionButtons.forEach(button => {
        if (!button.hasAttribute('data-processed')) {
          button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            console.log(`Action triggered: ${action}`);
            
            // Handle navigation actions
            if (action === 'next' && content.sections && activeSectionId) {
              const currentIndex = content.sections.findIndex(s => s.id === activeSectionId);
              if (currentIndex < content.sections.length - 1) {
                setActiveSectionId(content.sections[currentIndex + 1].id);
              }
            } else if (action === 'prev' && content.sections && activeSectionId) {
              const currentIndex = content.sections.findIndex(s => s.id === activeSectionId);
              if (currentIndex > 0) {
                setActiveSectionId(content.sections[currentIndex - 1].id);
              }
            }
            
            // For other actions, you'd implement custom behavior
          });
          button.setAttribute('data-processed', 'true');
        }
      });
      
      // Process x-interactive elements
      const interactiveElements = contentRef.current.querySelectorAll('[class^="x-"]');
      interactiveElements.forEach(element => {
        if (!element.hasAttribute('data-processed')) {
          // Mark as processed to avoid double-processing
          element.setAttribute('data-processed', 'true');
          
          // Add appropriate class for styling
          element.classList.add('mathigon-interactive');
          
          // You might need to add specific handlers for different types of interactive elements
          // This would depend on the specific x- components in the original implementation
        }
      });
      
      // Process glossary terms
      const glossaryTerms = contentRef.current.querySelectorAll('.glossary-term');
      glossaryTerms.forEach(term => {
        if (!term.hasAttribute('data-processed')) {
          term.addEventListener('click', () => {
            const termId = term.getAttribute('data-term');
            alert(`Glossary: ${termId}`);
            // In a real implementation, you'd show a tooltip with the definition
          });
          term.setAttribute('data-processed', 'true');
        }
      });
      
      // Process variable sliders
      const sliders = contentRef.current.querySelectorAll('.variable-slider');
      sliders.forEach(slider => {
        if (!slider.hasAttribute('data-processed')) {
          const varName = slider.getAttribute('data-var');
          const initialValue = slider.getAttribute('data-value');
          const rangeData = slider.getAttribute('data-range');
          
          // Create slider element
          const input = document.createElement('input');
          input.type = 'range';
          input.className = 'variable-range';
          input.value = initialValue;
          
          // Parse range data (min,max,step)
          if (rangeData) {
            const [min, max, step] = rangeData.split(',');
            input.min = min || 0;
            input.max = max || 10;
            input.step = step || 1;
          }
          
          // Create label to display value
          const label = document.createElement('span');
          label.className = 'slider-value';
          label.textContent = initialValue;
          
          // Update related variable expressions when slider changes
          input.addEventListener('input', (e) => {
            const value = e.target.value;
            label.textContent = value;
            
            // Update all variable expressions that use this variable
            const expressions = contentRef.current.querySelectorAll('.variable-expression');
            expressions.forEach(expr => {
              const exprText = expr.getAttribute('data-expr');
              if (exprText.includes(varName)) {
                // In a real implementation, you would evaluate this expression
                // For now, just update to show it would change
                expr.textContent = `${exprText} = ?`;
              }
            });
          });
          
          slider.innerHTML = '';
          slider.appendChild(input);
          slider.appendChild(label);
          slider.setAttribute('data-processed', 'true');
        }
      });
    }
  }, [loading, content, activeSectionId]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="course-reader-loading">
        <div className="spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="course-reader-error">
        <h2>Error loading course</h2>
        <p>{error}</p>
        <div className="error-details">
          <p>We tried to load content for: <strong>{courseId}</strong></p>
          <p>Make sure the content directory is properly set up with Mathigon course files.</p>
          <p>Expected path format: <code>/content/{courseId}/content.md</code></p>
        </div>
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="retry-button">Try Again</button>
          <Link to="/courses" className="back-button">Back to Courses</Link>
        </div>
      </div>
    );
  }
  
  // If no content available, render placeholder
  if (!content) {
    return (
      <div className="course-reader-empty">
        <h2>No Content Available</h2>
        <p>This course doesn't have any content yet.</p>
        <p className="content-path-note">Looking for content at: <code>{contentPath || 'unknown path'}</code></p>
        <Link to="/courses" className="back-button">Back to Courses</Link>
      </div>
    );
  }
  
  // Render the course content
  return (
    <div className="course-reader">
      <div className="course-header">
        <h1>{content.metadata.title || courseId}</h1>
        {content.metadata.description && (
          <p className="course-description">{content.metadata.description}</p>
        )}
        
        {/* Course color bar based on metadata */}
        {content.metadata.color && (
          <div 
            className="course-color-bar" 
            style={{ backgroundColor: content.metadata.color }}
          ></div>
        )}
        
        {/* Show the content path in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-info">
            <small>Content path: {contentPath}</small>
          </div>
        )}
      </div>
      
      {/* Section navigation */}
      {content.sections && content.sections.length > 0 && (
        <div className="course-nav">
          <ul className="section-tabs">
            {content.sections.map((section, index) => (
              <li key={section.id || index} className={section.id === activeSectionId ? 'active' : ''}>
                <button 
                  onClick={() => setActiveSectionId(section.id)}
                  className="section-button"
                >
                  {section.title || `Section ${index + 1}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Main content area */}
      <div className="course-content" ref={contentRef}>
        {/* Render HTML content using dangerouslySetInnerHTML */}
        <div
          className="mathigon-content"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      </div>
      
      {/* Step navigation and progress controls */}
      <div className="course-footer">
        <div className="step-buttons">
          <button 
            className="prev-section" 
            disabled={!content.sections || !activeSectionId || 
              content.sections.findIndex(s => s.id === activeSectionId) === 0}
            onClick={() => {
              if (content.sections && activeSectionId) {
                const currentIndex = content.sections.findIndex(s => s.id === activeSectionId);
                if (currentIndex > 0) {
                  setActiveSectionId(content.sections[currentIndex - 1].id);
                }
              }
            }}
          >
            Previous Section
          </button>
          
          <button 
            className="next-section"
            disabled={!content.sections || !activeSectionId || 
              content.sections.findIndex(s => s.id === activeSectionId) === content.sections.length - 1}
            onClick={() => {
              if (content.sections && activeSectionId) {
                const currentIndex = content.sections.findIndex(s => s.id === activeSectionId);
                if (currentIndex < content.sections.length - 1) {
                  setActiveSectionId(content.sections[currentIndex + 1].id);
                }
              }
            }}
          >
            Next Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseReader; 