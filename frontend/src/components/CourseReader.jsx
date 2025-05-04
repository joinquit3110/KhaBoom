import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parseMathigonMd } from '../utils/mathigonParser';

/**
 * CourseReader Component
 * 
 * Loads and renders course content directly from content.md files
 * in the content directory following Mathigon format
 */
const CourseReader = () => {
  const { courseId } = useParams();
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Function to load content directly from the content directory
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Attempt to load the content.md file directly
        const contentPath = `/content/${courseId}/content.md`;
        console.log(`Loading course content from: ${contentPath}`);
        
        const response = await fetch(contentPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status} ${response.statusText}`);
        }
        
        const mdContent = await response.text();
        
        // Parse the markdown content using our Mathigon parser
        const parsedContent = parseMathigonMd(mdContent);
        setContent(parsedContent);
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
  }, [courseId]);
  
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
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  // If no content available, render placeholder
  if (!content) {
    return (
      <div className="course-reader-empty">
        <h2>No Content Available</h2>
        <p>This course doesn't have any content yet.</p>
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
      </div>
      
      <div className="course-content">
        {/* Render HTML content using dangerouslySetInnerHTML */}
        <div
          className="mathigon-content"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      </div>
      
      {/* Show sections navigation if there are sections */}
      {content.sections && content.sections.length > 0 && (
        <div className="course-sections">
          <h3>Sections</h3>
          <ul>
            {content.sections.map((section, index) => (
              <li key={section.id || index}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CourseReader; 