/**
 * Service Worker for KhaBoom Learning Platform
 * 
 * Handles caching for Mathigon content and assets
 */

const CACHE_NAME = 'khaboom-cache-v1';
const ASSETS_TO_CACHE = [
  '/index.html',
  '/mathigon/assets/course.js',
  '/mathigon/assets/course.css',
  '/mathigon/assets/icons.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
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
    })
  );
});

// Fetch event - serve from cache, then network with cache update
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Handle Mathigon content files
  if (event.request.url.includes('/mathigon/content/') || 
      event.request.url.includes('/mathigon/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached response if available
          if (cachedResponse) {
            // Update cache in background
            fetch(event.request).then((response) => {
              // Check if response is valid JavaScript (not an HTML error page)
              if (response.ok && 
                  (response.headers.get('content-type') || '').includes('javascript') &&
                  !response.text().then(text => text.trim().startsWith('<'))) {
                cache.put(event.request, response.clone());
              }
            }).catch(() => {/* Ignore network errors */});
            
            return cachedResponse;
          }
          
          // Otherwise fetch from network and cache
          return fetch(event.request).then((response) => {
            // Only cache JavaScript files (not HTML error pages)
            if (response.ok && 
                !(response.headers.get('content-type') || '').includes('text/html')) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch((error) => {
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
  
  // Standard strategy for other requests - network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses (but not HTML error pages)
        if (response.ok && response.type === 'basic' && 
            !(response.headers.get('content-type') || '').includes('text/html')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request);
      })
  );
});
