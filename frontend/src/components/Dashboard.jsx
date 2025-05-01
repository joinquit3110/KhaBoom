import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getCourseList, getAvailableTranslations } from '../utils/contentLoader';

const Dashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  // Load courses from the content loader
  useEffect(() => {
    const loadCourses = async () => {
      try {
        // First check if the user has a preferred language setting
        if (profile && profile.preferredLanguage) {
          setPreferredLanguage(profile.preferredLanguage);
        }
        
        // Get courses from the content loader - this now uses the enhanced loader that reads from filesystem
        const availableCourses = getCourseList().map(course => {
          return {
            ...course,
            image: course.coverImage || `/images/${course.id}.svg` // Use provided image or fallback to SVG
          };
        });
        
        setCourses(availableCourses);
    
        // Extract unique categories from courses
        const uniqueCategories = ['All', ...new Set(availableCourses.map(course => course.category))].filter(Boolean);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error loading courses:', error);
        setError('Failed to load courses. Please try again later.');
      }
    };
    
    loadCourses();
  }, [profile]);

  // Filtered courses based on active category
  const filteredCourses = activeCategory === 'All' 
    ? courses 
    : courses.filter(course => course.category === activeCategory);

  useEffect(() => {
    // If no user is logged in, don't try to fetch profile
    if (!user) {
      setLoading(false);
      return;
    }
    
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE}/api/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setProfile(response.data);
      } catch (err) {
        setError('Unable to load user information');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  // Redirect if not logged in
  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <main>
      <section className="dashboard">
        <h1>Dashboard</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {profile && (
          <div className="profile-card">
            <div className="profile-header">
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="profile-avatar" 
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%',
                  border: '4px solid var(--primary-color)'
                }}
              />
              <h2>{profile.fullName}</h2>
              <p className="username">@{profile.name}</p>
            </div>
            
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">Class:</span>
                <span className="detail-value">{profile.class}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Birth Date:</span>
                <span className="detail-value">
                  {new Date(profile.birthdate).toLocaleDateString('en-US')}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{profile.email}</span>
              </div>
              
              {profile.gmail && profile.gmail !== profile.email && (
                <div className="detail-item">
                  <span className="detail-label">Gmail:</span>
                  <span className="detail-value">{profile.gmail}</span>
                </div>
              )}
              
              <div className="detail-item">
                <span className="detail-label">Joined:</span>
                <span className="detail-value">
                  {new Date(profile.createdAt).toLocaleDateString('en-US')}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Preferred Language:</span>
                <span className="detail-value">
                  <select 
                    value={preferredLanguage} 
                    onChange={(e) => {
                      const newLanguage = e.target.value;
                      setPreferredLanguage(newLanguage);
                      
                      // Save language preference to user profile
                      if (profile) {
                        const token = localStorage.getItem('token');
                        if (token) {
                          axios.patch(
                            `${import.meta.env.VITE_API_BASE}/api/auth/preferences`,
                            { preferredLanguage: newLanguage },
                            { headers: { Authorization: `Bearer ${token}` }}
                          ).catch(err => console.error('Error saving language preference:', err));
                        }
                      }
                    }}
                    className="language-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="ru">Russian</option>
                    <option value="cn">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ar">Arabic</option>
                  </select>
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="courses-section">
          <h2>Available Courses</h2>
          
          <div className="category-filter">
            {categories.map(category => (
              <button 
                key={category} 
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <div 
                key={course.id} 
                className="course-card" 
                style={{ borderTopColor: course.color }}
              >
                <div className="course-image">
                  <div className="level-badge" style={{ backgroundColor: course.color }}>
                    {course.level}
                  </div>
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    onError={(e) => {
                      // Fallback to a default image if the course image fails to load
                      e.target.src = `/images/default-course.svg`;
                    }}
                  />
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-footer">
                    <span className="category-tag">{course.category}</span>
                    <Link to={`/courses/${course.id}`} className="btn btn-sm">Start Learning</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
