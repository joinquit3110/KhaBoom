import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Get JWT secret with fallback to prevent auth failures
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('⚠️ JWT_SECRET not found in environment variables - using fallback for development');
    return 'khaboom-development-fallback-secret-31102004';
  }
  return secret;
};

export const authMiddleware = async (req, res, next) => {
  try {
    // Check for token in headers
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token with fallback secret
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
