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
      
      // Always get the latest course list
      const courseList = getCourseList();
      
      if (!courseList || courseList.length === 0) {
        throw new Error('No courses found');
      }
      
      // Check localStorage for saved progress data
      const savedCoursesData = localStorage.getItem('courses-data');
      let progressMap = {};
      
      if (savedCoursesData) {
        try {
          // Extract progress data from saved courses
          const savedCourses = JSON.parse(savedCoursesData);
          progressMap = savedCourses.reduce((map, course) => {
            map[course.id] = course.progress || 0;
            return map;
          }, {});
        } catch (e) {
          console.warn('Error parsing saved courses data:', e);
        }
      }
      
      // Merge the latest course list with saved progress data
      const coursesWithProgress = courseList.map(course => ({
        ...course,
        progress: progressMap[course.id] || 0
      }));
      
      // Save the updated courses with progress to localStorage
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
        // Try to use cached data if we have it
        try {
          const cachedCoursesData = localStorage.getItem('courses-data');
          if (cachedCoursesData) {
            const parsedData = JSON.parse(cachedCoursesData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log(`Using ${parsedData.length} cached courses from localStorage`);
              setCourses(parsedData);
              setError(null);
            }
          }
        } catch (cacheError) {
          console.error('Error reading cached courses:', cacheError);
        }
      }
    }, 5000); // 5 second timeout

    // Try to avoid the timeout by using cached data immediately
    try {
      const cachedCoursesData = localStorage.getItem('courses-data');
      if (cachedCoursesData) {
        const parsedData = JSON.parse(cachedCoursesData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log(`Quick-loading ${parsedData.length} cached courses from localStorage`);
          setCourses(parsedData);
          setLoading(false);
        }
      }
    } catch (cacheError) {
      console.error('Error reading cached courses:', cacheError);
    }

    fetchCourses();

    return () => clearTimeout(timeoutId);
  }, [fetchCourses]);

  // Function to force refresh courses by clearing localStorage cache
  const forceRefreshCourses = () => {
    try {
      localStorage.removeItem('courses-data');
      fetchCourses();
    } catch (error) {
      console.error('Error refreshing courses:', error);
    }
  };

  // Get unique categories from courses
  const categories = useMemo(() => {
    if (!courses || courses.length === 0) return ['All'];
    
    // Get all categories from courses, ensuring we prioritize the category field
    const allCategories = courses.map(course => {
      // Make sure we have a valid category, not just 'Mathematics' for everything
      return course.category || 'Uncategorized';
    }).filter(Boolean);
    
    // Use Set to get unique categories and add 'All' as first option
    const uniqueCategories = ['All', ...new Set(allCategories)];
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

  // Function to generate correct thumbnail URLs with local paths
  const getThumbnailUrl = useCallback((course) => {
    if (!course || !course.id) return '';
    
    // Use local content path instead of API
    return `/content/${course.id}/hero.jpg`;
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
                    style={{ 
                      backgroundColor: course.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500',
                      padding: '8px 16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    Start Learning
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1L15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [filteredAndSortedCourses, getThumbnailUrl]);

  return (
    <div className="dashboard container">
      <h1>Interactive Courses</h1>
      {user && <p className="welcome-message">Welcome, {user.fullName || user.username}!</p>}

      <div className="courses-section">
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
          <div className="error-message">
            <p>{error}</p>
            <button onClick={forceRefreshCourses} className="btn btn-secondary">Retry</button>
          </div>
        ) : (
          renderedCourseGrid
        )}
      </div>

      {/* Debug info only shown in development mode */}
      {import.meta.env.DEV && (
        <div className="debug-section">
          <details>
            <summary>Debug Information</summary>
            <div className="debug-info">
              <p>Total courses: {courses.length}</p>
              <p>Filtered courses: {filteredAndSortedCourses.length}</p>
              <p>Selected category: {categoryFilter}</p>
              <p>Available categories: {categories.length}</p>
              <button onClick={forceRefreshCourses} className="btn btn-secondary">Force Refresh Courses</button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
