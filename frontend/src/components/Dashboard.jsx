import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch courses from backend API
    axios.get(`${import.meta.env.VITE_API_BASE}/api/courses`)
      .then(res => {
        if (!res.data || !res.data.courses) {
          console.error("Invalid course data format:", res.data);
          setError("Received invalid course data. Please try again later.");
          setCourses([]);
          setLoading(false);
          return;
        }
        console.log("Loaded courses:", res.data.courses);
        setCourses(res.data.courses || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again later.");
        setCourses([]);
        setLoading(false);
      });
  }, []);

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
          <div className="loading-indicator">Loading courses...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : courses.length === 0 ? (
          <div className="no-courses">No courses available at this time.</div>
        ) : (
          <div className="courses-grid">
            {courses && courses.length > 0 ? courses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-image">
                  <img 
                    src={course.image || `/content/${course.id}/hero.jpg`} 
                    alt={course.title} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-course.jpg";
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {course.level && (
                    <span className="level-badge">{course.level}</span>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) : ''}</p>
                  <div className="course-footer">
                    {course.category && (
                      <span className="category-tag">{course.category}</span>
                    )}
                    <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                      Start Learning
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <div className="no-courses">No courses available at this time.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
