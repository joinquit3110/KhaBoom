/**
 * KHA-BOOM! Learning Platform Service Worker
 * Optimized for Mathigon content caching and offline support
 */

const CACHE_NAME = 'kha-boom-cache-v1';

// Assets to cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mathigon/assets/course.js',
  '/mathigon/assets/course.css',
  '/mathigon-test.js'
];

// Asset types to cache when requested
const CACHED_FILETYPES = [
  '.html',
  '.css',
  '.js',
  '.json',
  '.woff',
  '.woff2',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.mp4',
  '.mp3',
  '.gif'
];

// Install event - precache key assets
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service worker pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(error => {
        console.error('Pre-caching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Service worker removing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service worker active and controlling page');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension:// URLs
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension:') ||
      event.request.url.startsWith('data:')) {
    return;
  }
  
  // Special handling for Mathigon assets and course content
  if (event.request.url.includes('/mathigon/')) {
    return handleMathigonAssets(event);
  }
  
  // Cache-first strategy for cacheable file types
  const url = new URL(event.request.url);
  const shouldCache = CACHED_FILETYPES.some(fileType => 
    url.pathname.endsWith(fileType)
  );
  
  if (shouldCache) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response
            return cachedResponse;
          }
          
          // No cache hit, fetch from network and cache
          return fetch(event.request)
            .then(response => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Only cache same-origin responses
              const isSameOrigin = url.origin === self.location.origin;
              if (!isSameOrigin) {
                return response;
              }
              
              // Cache a copy of the response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(error => {
              console.error('Fetch failed:', error);
              // Could return a custom offline page here
            });
        })
    );
  }
});

// Special handling for Mathigon assets
function handleMathigonAssets(event) {
  const isMathigonContent = event.request.url.includes('/mathigon/content/');
  const isMathigonAsset = event.request.url.includes('/mathigon/assets/');
  
  // Skip if not a GET request or is a chrome-extension URL
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension:') ||
      event.request.url.startsWith('data:')) {
    return;
  }
  
  // Use network-first strategy for content (which might be updated)
  if (isMathigonContent) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Only cache successful responses
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Clone the response to cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(error => {
          // If network fails, try cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              console.error('Failed to fetch Mathigon content:', error);
              // Return an appropriate error response
            });
        })
    );
  }
  
  // Use cache-first for assets (which rarely change)
  if (isMathigonAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fetch and cache if not in cache
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  }
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
