import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
      </section>
    </main>
  );
};

export default Dashboard;
