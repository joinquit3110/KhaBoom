import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourseList } from '../utils/contentLoader';

/**
 * CourseList Component
 * 
 * Displays a list of all available courses with progress information
 */
const CourseList = ({ userId }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({});
  
  // Load all available courses and user's progress
  useEffect(() => {
    const loadCoursesAndProgress = async () => {
      try {
        setLoading(true);
        
        // Get courses from contentLoader
        const coursesList = getCourseList();
        
        if (!coursesList || coursesList.length === 0) {
          setError('No courses found. Please check your content directory.');
          setLoading(false);
          return;
        }
        
        // Get progress data from localStorage if available
        if (userId) {
          const savedProgressData = localStorage.getItem('courses-progress');
          if (savedProgressData) {
            try {
              const progressMap = JSON.parse(savedProgressData);
              setProgress(progressMap);
            } catch (e) {
              console.error('Error parsing progress data:', e);
            }
          }
        }
        
        setCourses(coursesList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses. Please try again later.');
        setLoading(false);
      }
    };
    
    loadCoursesAndProgress();
  }, [userId]);
  
  // Render a course card with progress info
  const renderCourseCard = (course) => {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const courseProgress = progress[course.id] || {};
    const completionPercentage = courseProgress.completionPercentage || 0;
    
    // Generate correct thumbnail URL
    let thumbnailUrl = course.thumbnail;
    if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
      // Ensure we have the API base URL prepended
      thumbnailUrl = `${apiBase}${thumbnailUrl.startsWith('/') ? thumbnailUrl : `/${thumbnailUrl}`}`;
    } else if (!thumbnailUrl) {
      // Default thumbnail URL
      thumbnailUrl = `${apiBase}/mathigon/content/${course.id}/hero.jpg`;
    }
    
    return (
      <div className="course-card" key={course.id}>
        <div className="course-card-header" style={{ backgroundColor: course.color || '#4d7fc2' }}>
          <img 
            src={thumbnailUrl} 
            alt={course.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/logo.png';
            }}
          />
        </div>
        
        <div className="course-card-body">
          <h3>{course.title}</h3>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span className="course-difficulty">{course.level || 'Intermediate'}</span>
            {course.category && <span className="course-category">{course.category}</span>}
          </div>
          
          {userId && (
            <div className="course-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="progress-text">{completionPercentage}% Complete</span>
            </div>
          )}
        </div>
        
        <div className="course-card-footer">
          <Link to={`/courses/${course.id}`} className="course-link-button">
            {courseProgress.lastAccessed ? 'Continue Learning' : 'Start Learning'}
          </Link>
        </div>
      </div>
    );
  };
  
  // Group courses by category
  const groupedCourses = courses.reduce((groups, course) => {
    const category = course.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(course);
    return groups;
  }, {});
  
  return (
    <div className="courses-container">
      <h1 className="page-title">Interactive Courses</h1>
      
      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : courses.length === 0 ? (
        <div className="no-courses">
          <p>No courses available at the moment.</p>
        </div>
      ) : (
        <>
          {/* Featured courses */}
          {courses.some(course => course.featured) && (
            <div className="featured-courses">
              <h2>Featured Courses</h2>
              <div className="course-grid">
                {courses
                  .filter(course => course.featured)
                  .map(course => renderCourseCard(course))}
              </div>
            </div>
          )}
          
          {/* Courses by category */}
          {Object.entries(groupedCourses).map(([category, categoryCourses]) => (
            <div className="course-category-section" key={category}>
              <h2>{category}</h2>
              <div className="course-grid">
                {categoryCourses.map(course => renderCourseCard(course))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default CourseList;
