import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LazyImage from './LazyImage';
import { getCourseList } from '../utils/contentLoader';

export default function Dashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');

  // Memoize course fetching to prevent unnecessary re-fetches
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check localStorage for saved course data with progress
      const savedCoursesData = localStorage.getItem('courses-data');
      if (savedCoursesData) {
        const parsedCourses = JSON.parse(savedCoursesData);
        setCourses(parsedCourses);
        setLoading(false);
        return;
      }
      
      // If no saved data found, use the getCourseList utility from contentLoader
      const courseList = getCourseList();
      
      if (!courseList || courseList.length === 0) {
        throw new Error('No courses found');
      }
      
      // Initialize courses with default progress of 0
      const coursesWithProgress = courseList.map(course => ({
        ...course,
        progress: 0
      }));
      
      // Save the courses with progress to localStorage
      localStorage.setItem('courses-data', JSON.stringify(coursesWithProgress));
      
      setCourses(coursesWithProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again later.');
      setCourses([]);
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

  // Get unique categories from courses
  const categories = useMemo(() => {
    if (!courses || courses.length === 0) return ['All'];
    
    const uniqueCategories = ['All', ...new Set(courses.map(course => course.category).filter(Boolean))];
    return uniqueCategories;
  }, [courses]);

  // Filter and sort courses based on selected category and sort order
  const filteredAndSortedCourses = useMemo(() => {
    // First filter by category
    let filtered = courses;
    if (categoryFilter !== 'All') {
      filtered = courses.filter(course => course.category === categoryFilter);
    }
    
    // Then sort based on the selected sort order
    let sorted = [...filtered];
    switch (sortOrder) {
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'level':
        // Define a level order priority
        const levelPriority = { 'Foundations': 1, 'Intermediate': 2, 'Advanced': 3 };
        sorted.sort((a, b) => 
          (levelPriority[a.level] || 99) - (levelPriority[b.level] || 99)
        );
        break;
      case 'category':
        sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
      default:
        // Keep original order
        break;
    }
    
    return sorted;
  }, [courses, categoryFilter, sortOrder]);

  // Function to generate correct thumbnail URLs with API base
  const getThumbnailUrl = useCallback((course) => {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    return course.thumbnail ? `${apiBase}${course.thumbnail.replace(/^\/api/, '')}` : 
      `${apiBase}/content/${course.id}/icon.png`;
  }, []);

  // Use useMemo to prevent unnecessary re-renders of the course grid
  const renderedCourseGrid = useMemo(() => {
    if (!filteredAndSortedCourses || filteredAndSortedCourses.length === 0) {
      return (
        <div className="no-courses">No courses available at this time.</div>
      );
    }

    return (
      <div className="courses-grid mathigon-style">
        {filteredAndSortedCourses.map(course => {
          // Calculate the course progress
          let progress = 0;
          // Check if course has a progress value (to be set later from API)
          if (course.progress !== undefined) {
            progress = course.progress;
          }

          return (
            <div 
              key={course.id} 
              className="course-card hardware-accelerated"
              style={{
                '--card-color': course.color || '#6366F1',
                borderTop: `4px solid ${course.color || '#6366F1'}`
              }}
            >
              <div className="course-image" 
                style={{
                  backgroundColor: course.color || '#6366F1',
                  backgroundImage: `url(${getThumbnailUrl(course)})`
                }}
              >
                {course.level && (
                  <span className="level-badge">{course.level}</span>
                )}
              </div>
              <div className="course-info">
                <h3 style={{ color: course.color }}>{course.title}</h3>
                <p>{course.description ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) : ''}</p>
                
                {/* Progress bar */}
                <div className="course-progress-container">
                  <div 
                    className="course-progress-bar" 
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: course.color || '#6366F1' 
                    }}
                  ></div>
                  <span className="course-progress-text">{progress}% Complete</span>
                </div>
                
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
          );
        })}
      </div>
    );
  }, [filteredAndSortedCourses, getThumbnailUrl]);

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
        
        {/* Category and Sort Controls */}
        <div className="course-filters">
          <div className="filter-group">
            <label className="filter-label">Category:</label>
            <div className="select-wrapper primary-select">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Sort by:</label>
            <div className="select-wrapper secondary-select">
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)} 
                className="filter-select"
              >
                <option value="default">Default</option>
                <option value="alphabetical">A-Z</option>
                <option value="level">Level</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>
        
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
