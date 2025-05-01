import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
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
        <img 
          src="/logo.png" 
          alt="Kha-Boom Logo" 
          className="hero-logo" 
          style={{ maxWidth: '300px', marginBottom: '1rem' }}
        />
        <h1>Kha-Boom!</h1>
        <p className="hero-subtitle">
          Explore the world of knowledge with Kha-Boom! A colorful and creative online learning platform.
        </p>
        
        {message && <div className="api-status">API Status: {message}</div>}
        
        {!user ? (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </div>
        ) : (
          <div className="welcome">
            <h2>Welcome, {user.fullName}!</h2>
            <p>We're glad to see you again.</p>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        )}
      </section>
      
      <section className="features">
        <h2>Key Features</h2>
        <div className="cards-container">
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--primary-color)' }}>
              <h3>Multimedia Learning</h3>
            </div>
            <div className="card-body">
              <p>Diverse learning content with videos, images, and interactive exercises to make learning more engaging and dynamic.</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--secondary-color)' }}>
              <h3>Learning Management</h3>
            </div>
            <div className="card-body">
              <p>Track your learning progress with detailed analytics and reporting tools.</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header" style={{ backgroundColor: 'var(--accent-color)' }}>
              <h3>Community Support</h3>
            </div>
            <div className="card-body">
              <p>Connect with fellow students and teachers to exchange knowledge and get answers to your questions.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
