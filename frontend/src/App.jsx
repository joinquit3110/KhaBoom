import { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import axios from "axios";
import CourseRoutes from "./routes/CourseRoutes";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CourseView from "./components/CourseView";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./components/NotFound";

export default function App() {
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check API status
    axios.get(import.meta.env.VITE_API_BASE + "/")
      .then(res => setMessage(res.data.msg))
      .catch(err => console.error("API Error:", err));
      
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        setUser(userData);
      } catch (e) {
        console.error("Error parsing user data");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // Loading spinner component for lazy-loaded routes
  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );

  return (
    <Router>
      <ErrorBoundary>
        <div className="app">
          <Navbar user={user} onLogout={handleLogout} />
          
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/register" element={<Register setUser={setUser} />} />
              <Route path="/dashboard" element={
                user ? (
                  <ErrorBoundary>
                    <Dashboard user={user} />
                  </ErrorBoundary>
                ) : (
                  <Login setUser={setUser} redirectTo="/dashboard" />
                )
              } />
              
              {/* Course routes with dedicated error boundary */}
              <Route path="/courses/*" element={
                <ErrorBoundary courseId="true">
                  <CourseRoutes userId={user?.id} />
                </ErrorBoundary>
              } />
              
              {/* Legacy course path - redirect to new path */}
              {/* Remove legacy redirect - now properly handle /courses/:courseId in CourseRoutes */}
              
              <Route path="/" element={
                <HomePage message={message} user={user} />
              } />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          
          <Footer />
      </div>
      </ErrorBoundary>
    </Router>
  );
}

function HomePage({ message, user }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-content-wrapper">
          <img 
            src="/logo.png" 
            alt="Kha-Boom Logo" 
            className="hero-logo" 
            style={{ 
              maxWidth: '400px', 
              marginBottom: '2rem', 
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))',
              transform: 'scale(1.15)',
              transition: 'transform 0.3s ease-in-out',
            }}
          />
          <h1 className="hero-title"><span className="hero-kha">Kha-</span><span className="hero-boom">Boom!</span></h1>
          <p className="hero-subtitle">
            Unleash your learning potential with our creative and interactive platform!
          </p>
          
          {!user ? (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register Now</Link>
            </div>
          ) : (
            <div className="welcome">
              <h2>Welcome back, {user.fullName}!</h2>
              <p>Continue your learning journey with us.</p>
              <Link 
                to="/courses" 
                className="btn btn-primary start-learning-btn"
                style={{
                  backgroundColor: '#22ab24',
                  borderColor: '#1aa845',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
              >
                Browse Courses
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1L15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}
        </div>
        <div className="hero-image">
          <div className="floating-icon book-icon" style={{ top: '20%', left: '10%', animationDelay: '0s' }}>
            <span role="img" aria-label="Book">📚</span>
            <div className="icon-tooltip">Interactive Learning</div>
          </div>
          <div className="floating-icon idea-icon" style={{ top: '70%', left: '20%', animationDelay: '1.5s' }}>
            <span role="img" aria-label="Idea">💡</span>
            <div className="icon-tooltip">Creative Ideas</div>
          </div>
          <div className="floating-icon rocket-icon" style={{ top: '30%', right: '15%', animationDelay: '0.7s' }}>
            <span role="img" aria-label="Rocket">🚀</span>
            <div className="icon-tooltip">Progress Quickly</div>
          </div>
          <div className="floating-icon brain-icon" style={{ top: '60%', right: '10%', animationDelay: '2.1s' }}>
            <span role="img" aria-label="Brain">🧠</span>
            <div className="icon-tooltip">Deep Understanding</div>
          </div>
        </div>
      </section>
      
      <section className="features">
        <div className="container">
          <h2 className="section-title">Explore Our Features</h2>
          <div className="cards-container features-grid">
            <div className="feature-card" style={{ backgroundColor: 'rgba(255, 64, 129, 0.05)' }}>
              <div className="feature-icon" style={{ backgroundColor: 'rgba(255, 64, 129, 0.15)' }}>
                <span role="img" aria-label="Video">🎬</span>
              </div>
              <h3>Interactive Learning</h3>
              <p>Engage with dynamic content designed to make learning fun and effective.</p>
            </div>
            
            <div className="feature-card" style={{ backgroundColor: 'rgba(0, 188, 212, 0.05)' }}>
              <div className="feature-icon" style={{ backgroundColor: 'rgba(0, 188, 212, 0.15)' }}>
                <span role="img" aria-label="Chart">📊</span>
              </div>
              <h3>Track Progress</h3>
              <p>Monitor your achievements and learning journey with detailed analytics.</p>
            </div>
            
            <div className="feature-card" style={{ backgroundColor: 'rgba(124, 77, 255, 0.05)' }}>
              <div className="feature-icon" style={{ backgroundColor: 'rgba(124, 77, 255, 0.15)' }}>
                <span role="img" aria-label="People">👥</span>
              </div>
              <h3>Community Support</h3>
              <p>Connect with fellow learners and instructors to enhance your knowledge.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Begin Your Learning Journey?</h2>
          <p>Join thousands of students already learning with Kha-Boom!</p>
          <Link 
            to={user ? "/courses" : "/register"} 
            className="btn btn-primary cta-button" 
            style={{
              fontSize: '1.2rem', 
              padding: '16px 32px',
              backgroundColor: '#22ab24',
              borderColor: '#1aa845',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            {user ? "Browse Courses" : "Start Learning Now"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
