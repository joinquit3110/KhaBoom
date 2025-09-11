// =============================================================================
// Authentication Middleware
// (c) Kha-Boom!
// =============================================================================

import {Request, Response, NextFunction} from 'express';

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }
  
  // If it's an API request, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({error: 'Authentication required'});
  }
  
  // Otherwise redirect to login
  res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && (req.user as any).isAdmin) {
    return next();
  }
  
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({error: 'Admin access required'});
  }
  
  res.status(403).render('error', {
    title: 'Access Denied',
    message: 'You do not have permission to access this page.'
  });
}
