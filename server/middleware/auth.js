"use strict";
// =============================================================================
// Authentication Middleware
// (c) Kha-Boom!
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = isAuthenticated;
exports.isAdmin = isAdmin;
function isAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    }
    // If it's an API request, return JSON error
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Otherwise redirect to login
    res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
}
function isAdmin(req, res, next) {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    if (req.path.startsWith('/api/')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.'
    });
}
