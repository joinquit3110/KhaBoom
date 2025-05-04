/**
 * Service Worker for KhaBoom Learning Platform
 * 
 * Handles caching for Mathigon content and assets
 */

const CACHE_NAME = 'khaboom-cache-v2';
const ASSETS_TO_CACHE = [
  '/index.html',
  '/mathigon/assets/course.js',
  '/mathigon/assets/course.css',
  '/mathigon/assets/icons.svg'
];

// Determine if running in Netlify, Render, or other deployment environments
const isDeployedEnvironment = () => {
  return self.location.hostname.includes('netlify.app') || 
         self.location.hostname.includes('render.com') || 
         self.location.hostname !== 'localhost';
};

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache core assets:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of uncontrolled clients
      return self.clients.claim();
    })
  );
});

// Update the content type checking to handle HTML responses correctly
const shouldCacheResponse = (response, url) => {
  // Don't cache error responses
  if (!response.ok) return false;
  
  const contentType = response.headers.get('content-type') || '';
  
  // For JavaScript files, verify it's actually JavaScript
  if (url.endsWith('.js') && !contentType.includes('javascript')) {
    console.warn(`Skipping cache for ${url}: wrong content type ${contentType}`);
    return false;
  }
  
  // Skip caching HTML content with incorrect content type
  if (contentType.includes('javascript') || contentType.includes('application/')) {
    return response.clone().text()
      .then(text => {
        const isHTML = text.trim().startsWith('<!DOCTYPE html>') || 
                       text.trim().startsWith('<html') || 
                       (text.trim().startsWith('<') && text.includes('<html'));
        if (isHTML) {
          console.warn(`Skipping cache for ${url}: HTML content with non-HTML content type`);
          return false;
        }
        return true;
      })
      .catch(() => true); // If we can't check, assume it's cacheable
  }
  
  // Special handling for content.json requests which should really be content.md
  if (url.includes('/content.json')) {
    console.warn(`Redirecting ${url} to .md version`);
    return false;
  }
  
  // Default: cache if it's a successful response
  return true;
};

// Fetch event - serve from cache, then network with cache update
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const requestURL = new URL(event.request.url);
  
  // Special handling for Mathigon content and assets
  if (requestURL.pathname.includes('/mathigon/content/') || 
      requestURL.pathname.includes('/mathigon/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            // Update cache in background for non-HTML content
            fetch(event.request)
              .then((response) => {
                if (!response.ok) return;
                
                return shouldCacheResponse(response, requestURL.pathname)
                  .then(shouldCache => {
                    if (shouldCache) {
                      cache.put(event.request, response.clone());
                    }
                  });
              })
              .catch(() => {/* Ignore network errors */});
            
            return cachedResponse;
          }
          
          // Otherwise fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Clone the response so we can check it and use it in multiple places
              const responseToCache = response.clone();
              
              // Only cache successful responses
              if (response.ok) {
                shouldCacheResponse(responseToCache, requestURL.pathname)
                  .then(shouldCache => {
                    if (shouldCache) {
                      // Add proper content type headers for JavaScript files in deployed environments
                      if (isDeployedEnvironment() && requestURL.pathname.endsWith('.js')) {
                        const modifiedResponse = new Response(
                          responseToCache.body,
                          {
                            status: responseToCache.status,
                            statusText: responseToCache.statusText,
                            headers: new Headers({
                              ...Array.from(responseToCache.headers.entries()),
                              'Content-Type': 'application/javascript; charset=utf-8'
                            })
                          }
                        );
                        cache.put(event.request, modifiedResponse);
                      } else {
                        cache.put(event.request, responseToCache);
                      }
                    }
                  });
              }
              return response;
            })
            .catch((error) => {
              console.error('Fetch failed:', error);
              return new Response('Network error', { 
                status: 408, 
                headers: { 'Content-Type': 'text/plain' } 
              });
            });
        });
      })
    );
    return;
  }
  
  // Redirect content.json requests to content.md for Mathigon courses
  if (requestURL.pathname.includes('/mathigon/content/') && requestURL.pathname.endsWith('/content.json')) {
    const mdUrl = requestURL.pathname.replace('/content.json', '/content.md');
    console.log(`Redirecting ${requestURL.pathname} to ${mdUrl}`);
    
    event.respondWith(
      fetch(new Request(mdUrl, {
        method: event.request.method,
        headers: event.request.headers,
        mode: event.request.mode,
        credentials: event.request.credentials,
        redirect: event.request.redirect
      }))
    );
    return;
  }
  
  // Standard strategy for other requests - network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && response.type === 'basic') {
          const contentType = response.headers.get('content-type') || '';
          // Skip caching HTML responses to avoid capturing error pages
          if (!contentType.includes('text/html')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no match in cache, return a fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            return new Response('Network error, and no cached version available', { 
              status: 404, 
              headers: { 'Content-Type': 'text/plain' } 
            });
          });
      })
  );
});
