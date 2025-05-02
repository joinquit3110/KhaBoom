import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { progressService } from '../services/api';

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
        
        // Fetch courses
        const coursesResponse = await api.get('/api/content/courses');
        const coursesList = coursesResponse.data || [];
        
        // Fetch user progress if logged in
        if (userId) {
          try {
            const progressResponse = await progressService.getAllProgress();
            const userProgress = progressResponse.data || [];
            
            // Create a map of course ID to progress
            const progressMap = {};
            userProgress.forEach(item => {
              progressMap[item.courseId] = item;
            });
            
            setProgress(progressMap);
          } catch (progressError) {
            console.error('Failed to load progress:', progressError);
            // Continue with courses even if progress fails
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
    const courseProgress = progress[course.id] || {};
    const completionPercentage = courseProgress.completionPercentage || 0;
    
    return (
      <div className="course-card" key={course.id}>
        <div className="course-card-header" style={{ backgroundColor: course.color || '#4d7fc2' }}>
          <img 
            src={course.thumbnail || `/content/${course.id}/thumbnail.jpg`} 
            alt={course.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default-course.jpg';
            }}
          />
        </div>
        
        <div className="course-card-body">
          <h3>{course.title}</h3>
          <p className="course-description">{course.description}</p>
          <div className="course-meta">
            <span className="course-difficulty">{course.level || 'Intermediate'}</span>
            <span className="course-category">{course.category || 'Mathematics'}</span>
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
          <Link to={`/course/${course.id}`} className="course-link-button">
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
