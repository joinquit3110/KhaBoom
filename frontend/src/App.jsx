import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CourseView from "./components/CourseView";
import Footer from "./components/Footer";

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
  
  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/dashboard" element={
            <Dashboard user={user} />
          } />
          <Route path="/courses/:courseId" element={<CourseView />} />
          <Route path="/" element={
            <HomePage message={message} user={user} />
          } />
        </Routes>
        
        <Footer />
      </div>
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
            style={{ maxWidth: '180px', marginBottom: '1rem' }}
          />
          <h1>Kha-Boom!</h1>
          <p className="hero-subtitle">
            Unleash your learning potential with our creative and interactive platform!
          </p>
          
          {message && <div className="api-status">API Status: {message}</div>}
          
          {!user ? (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register Now</Link>
            </div>
          ) : (
            <div className="welcome">
              <h2>Welcome back, {user.fullName}!</h2>
              <p>Continue your learning journey with us.</p>
              <Link to="/dashboard" className="btn btn-primary start-learning-btn">Go to Dashboard</Link>
            </div>
          )}
        </div>
        <div className="hero-image">
          <div className="floating-icon" style={{ top: '20%', left: '10%', animationDelay: '0s' }}>
            <span role="img" aria-label="Book">📚</span>
          </div>
          <div className="floating-icon" style={{ top: '70%', left: '20%', animationDelay: '1.5s' }}>
            <span role="img" aria-label="Idea">💡</span>
          </div>
          <div className="floating-icon" style={{ top: '30%', right: '15%', animationDelay: '0.7s' }}>
            <span role="img" aria-label="Rocket">🚀</span>
          </div>
          <div className="floating-icon" style={{ top: '60%', right: '10%', animationDelay: '2.1s' }}>
            <span role="img" aria-label="Brain">🧠</span>
          </div>
        </div>
      </section>
      
      <section className="features">
        <h2 className="section-title">Explore Our Features</h2>
        <div className="cards-container">
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
      </section>
      
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Begin Your Learning Journey?</h2>
          <p>Join thousands of students already learning with Kha-Boom!</p>
          <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary cta-button">
            {user ? "Continue Learning" : "Start Learning Now"}
          </Link>
        </div>
      </section>
    </main>
  );
}
