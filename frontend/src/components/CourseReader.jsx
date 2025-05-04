import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parseMathigonMd } from '../utils/mathigonParser';
import './courseReader.css';

/**
 * CourseReader Component - Exact Mathigon Style
 * 
 * This component renders course content directly in the same format
 * as the original Mathigon textbooks-master repository
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
  
  // Load Mathigon scripts
  useEffect(() => {
    try {
      // Try to load the original CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/mathigon-assets/css/course.css';
      document.head.appendChild(link);
      
      // Try to load the original JS (in case it wasn't loaded by the parser)
      const script = document.createElement('script');
      script.src = '/mathigon-assets/js/course.js';
      document.body.appendChild(script);
    } catch (e) {
      console.warn('Could not load original Mathigon assets:', e);
    }
  }, []);
  
  useEffect(() => {
    // Function to load content directly from the content directory
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try different possible paths for the content
        const possiblePaths = [
          `/content/${courseId}/content.md`,                  // Direct content directory
          `/${courseId}/content.md`,                          // Root path
          `/originalweb/textbooks-master/content/${courseId}/content.md` // Original source
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
        
        // Parse the markdown content using the direct parser
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
  
  // Render the course content exactly like the original Mathigon
  return (
    <div className="course-reader mathigon-textbook">
      {/* Render content directly with minimal wrapping to match original format */}
      <div className="course-content" ref={contentRef}>
        <div 
          className="raw-mathigon-content"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      </div>
      
      {/* Dev path indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-info">
          <small>Content path: {contentPath}</small>
        </div>
      )}
    </div>
  );
};

export default CourseReader; 