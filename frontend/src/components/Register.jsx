import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = ({ setUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    email: '',
    class: '',
    birthdate: '',
    gender: 'male',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password confirmation does not match.');
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...dataToSend } = formData;
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE}/api/auth/register`,
        dataToSend
      );

      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update app state
      setUser(user);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="form-container register-form">
        <div className="form-header">
          <h2>Create Account</h2>
          <p className="form-subheading">Join our learning community</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Username</label>
              <div className="input-with-icon">
                <i className="input-icon">👤</i>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <div className="input-with-icon">
                <i className="input-icon">📝</i>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="form-input"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="class" className="form-label">Class</label>
              <div className="input-with-icon">
                <i className="input-icon">🏫</i>
                <input
                  type="text"
                  id="class"
                  name="class"
                  className="form-input"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  placeholder="Your class/grade"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="birthdate" className="form-label">Birth Date</label>
              <div className="input-with-icon">
                <i className="input-icon">🎂</i>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  className="form-input"
                  value={formData.birthdate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-with-icon">
              <i className="input-icon">📧</i>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Gender</label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="male"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                <label htmlFor="male">Male</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="female"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                <label htmlFor="female">Female</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="other"
                  name="gender"
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={handleChange}
                />
                <label htmlFor="other">Other</label>
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-with-icon">
                <i className="input-icon">🔒</i>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <i className="input-icon">🔐</i>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary register-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        
        <p className="form-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      <div className="auth-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </main>
  );
};

export default Register;
