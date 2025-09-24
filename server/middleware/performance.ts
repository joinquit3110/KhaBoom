// =============================================================================
// Performance Middleware
// (c) Kha-Boom!
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import crypto from 'crypto';

interface CacheEntry {
  data: any;
  expires: number;
  etag: string;
}

class PerformanceMiddleware {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 60 * 60 * 1000; // 1 hour
  
  // Enhanced compression middleware
  static compressionMiddleware() {
    return compression({
      level: 6, // Good balance between compression and speed
      threshold: 1024, // Only compress files over 1KB
      filter: (req: Request, res: Response) => {
        // Don't compress responses if request headers suggest no compression support
        if (req.headers['x-no-compression']) return false;
        
        // Compress text-based content types
        const contentType = res.getHeader('content-type') as string;
        if (contentType) {
          return /text|javascript|json|css|xml|svg/.test(contentType);
        }
        
        return compression.filter(req, res);
      }
    });
  }
  
  // Memory cache middleware for API responses
  cacheMiddleware(ttl: number = this.TTL) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      const key = this.getCacheKey(req);
      const cached = this.cache.get(key);
      
      if (cached && cached.expires > Date.now()) {
        // Check if client has cached version
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        
        res.setHeader('etag', cached.etag);
        res.setHeader('cache-control', 'public, max-age=3600');
        return res.json(cached.data);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
        
        this.cache.set(key, {
          data,
          expires: Date.now() + ttl,
          etag
        });
        
        res.setHeader('etag', etag);
        res.setHeader('cache-control', 'public, max-age=3600');
        return originalJson.call(this, data);
      }.bind(this);
      
      next();
    };
  }
  
  // Static file cache headers
  static staticCacheMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set long cache for assets with hash in filename
      if (req.url.match(/\.[a-f0-9]{8,}\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|otf)$/)) {
        res.setHeader('cache-control', 'public, max-age=31536000, immutable'); // 1 year
      }
      // Set shorter cache for regular assets
      else if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|otf)$/)) {
        res.setHeader('cache-control', 'public, max-age=3600'); // 1 hour
      }
      
      next();
    };
  }
  
  // Security headers middleware
  static securityMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('x-content-type-options', 'nosniff');
      res.setHeader('x-frame-options', 'DENY');
      res.setHeader('x-xss-protection', '1; mode=block');
      res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
      
      // CSP for performance and security
      res.setHeader('content-security-policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https:",
        "media-src 'self' https:",
        "object-src 'none'",
        "frame-ancestors 'none'"
      ].join('; '));
      
      next();
    };
  }
  
  // Request timing middleware
  static timingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = process.hrtime.bigint();
      
      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        res.setHeader('x-response-time', `${duration.toFixed(2)}ms`);
        
        // Log slow requests in development
        if (process.env.NODE_ENV !== 'production' && duration > 100) {
          console.warn(`Slow request: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
        }
      });
      
      next();
    };
  }
  
  private getCacheKey(req: Request): string {
    return crypto.createHash('md5')
      .update(req.originalUrl + (req.get('accept-language') || ''))
      .digest('hex');
  }
  
  // Clean expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Cleanup cache every 10 minutes
const performanceMiddleware = new PerformanceMiddleware();
setInterval(() => performanceMiddleware.cleanupCache(), 10 * 60 * 1000);

export { PerformanceMiddleware, performanceMiddleware };