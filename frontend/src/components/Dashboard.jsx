import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LazyImage from './LazyImage';
import { getCourseList } from '../utils/contentLoader';

export default function Dashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize course fetching to prevent unnecessary re-fetches
  const fetchCourses = useCallback(async () => {
    try {
      // Use the hardcoded course data from contentLoader.js
      const courseList = getCourseList();
      
      if (!courseList || courseList.length === 0) {
        console.error("No courses available");
        setError("No courses available. Please try again later.");
        setCourses([]);
        setLoading(false);
        return;
      }
      
      console.log("Loaded courses:", courseList);
      setCourses(courseList);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again later.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Loading timeout reached - forcing loading state to complete");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    fetchCourses();

    return () => clearTimeout(timeoutId);
  }, [fetchCourses]);

  // Use useMemo to prevent unnecessary re-renders of the course grid
  const renderedCourseGrid = useMemo(() => {
    if (!courses || courses.length === 0) {
      return (
        <div className="no-courses">No courses available at this time.</div>
      );
    }

    return (
      <div className="courses-grid mathigon-style">
        {courses.map(course => (
          <div 
            key={course.id} 
            className="course-card hardware-accelerated"
            style={{
              '--card-color': course.color || '#6366F1',
              borderTop: `4px solid ${course.color || '#6366F1'}`
            }}
          >
            <div className="course-image">
              <LazyImage
                src={course.thumbnail || `/content/${course.id}/images/thumbnail.jpg`}
                alt={course.title}
                width="100%"
                height="160px"
              />
              {course.level && (
                <span className="level-badge">{course.level}</span>
              )}
            </div>
            <div className="course-info">
              <h3 style={{ color: course.color }}>{course.title}</h3>
              <p>{course.description ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) : ''}</p>
              <div className="course-footer">
                {course.category && (
                  <span className="category-tag">{course.category}</span>
                )}
                <Link 
                  to={`/courses/${course.id}`} 
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: course.color }}
                >
                  Start Learning
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [courses]);

  if (!user) {
    return (
      <div className="container">
        <h1>Dashboard</h1>
        <p>Please log in to view your dashboard</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard container">
      <h1>Welcome to Your Dashboard</h1>
      <p className="welcome-message">Hello, {user.fullName}!</p>

      <div className="courses-section">
        <h2>Available Courses</h2>
        
        {loading ? (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          renderedCourseGrid
        )}
      </div>
    </div>
  );
}
