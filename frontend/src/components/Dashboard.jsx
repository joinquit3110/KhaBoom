import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Simulated courses based on content directory
  useEffect(() => {
    const sampleCourses = [
      {
        id: 'circles',
        title: 'Circles and Pi',
        description: 'Learn about circles, their properties, and the significance of Pi in mathematics.',
        level: 'Intermediate',
        category: 'Geometry',
        image: '/images/circles-hero.jpg',
        color: '#5A49C9'
      },
      {
        id: 'graph-theory',
        title: 'Graph Theory',
        description: 'Explore the mathematical structures used to model relations between objects.',
        level: 'Advanced',
        category: 'Discrete Math',
        image: '/images/graph-theory.jpg',
        color: '#4DB94B'
      },
      {
        id: 'probability',
        title: 'Probability',
        description: 'Understand the mathematics of chance and uncertainty.',
        level: 'Intermediate',
        category: 'Statistics',
        image: '/images/probability.jpg',
        color: '#F7672C'
      },
      {
        id: 'codes',
        title: 'Coding Theory',
        description: 'Learn about error detection and correction in data transmission.',
        level: 'Advanced',
        category: 'Computer Science',
        image: '/images/codes.jpg',
        color: '#1094BC'
      },
      {
        id: 'divisibility',
        title: 'Divisibility',
        description: 'Understand division and remainders in number theory.',
        level: 'Beginner',
        category: 'Number Theory',
        image: '/images/divisibility.jpg',
        color: '#E91E63'
      },
      {
        id: 'polyhedra',
        title: 'Polyhedra',
        description: 'Discover the fascinating world of 3D geometric shapes.',
        level: 'Intermediate',
        category: 'Geometry',
        image: '/images/polyhedra.jpg',
        color: '#FF9800'
      },
      {
        id: 'fractals',
        title: 'Fractals',
        description: 'Explore the beauty of self-similar patterns in mathematics.',
        level: 'Advanced',
        category: 'Chaos Theory',
        image: '/images/fractals.jpg',
        color: '#9C27B0'
      },
      {
        id: 'triangles',
        title: 'Triangles',
        description: 'Learn about the fundamental shape in geometry.',
        level: 'Beginner',
        category: 'Geometry',
        image: '/images/triangles.jpg',
        color: '#00BCD4'
      }
    ];

    setCourses(sampleCourses);
  }, []);

  // Categories derived from courses
  const categories = ['All', ...new Set(courses.map(course => course.category))].filter(Boolean);

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
                  <img src={course.image} alt={course.title} />
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-footer">
                    <span className="category-tag">{course.category}</span>
                    <a href={`/courses/${course.id}`} className="btn btn-sm">Start Learning</a>
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
