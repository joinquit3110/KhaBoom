/**
 * KHA-BOOM! Learning Platform Service Worker
 * Optimized for Mathigon content caching and offline support
 */

const CACHE_NAME = 'kha-boom-cache-v2';
const MATHIGON_CACHE = 'mathigon-content-cache-v1';

// Assets to cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/mathigon/assets/course.js',
  '/mathigon/assets/boost.js',
  '/mathigon/assets/course.css',
  '/mathigon/assets/icons.svg',
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
          // Keep current caches and content cache
          return cacheName !== CACHE_NAME && cacheName !== MATHIGON_CACHE;
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
  // Skip non-GET requests and problematic URLs
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension:') ||
      event.request.url.startsWith('data:')) {
    return;
  }
  
  // Special handling for Mathigon assets and course content
  if (event.request.url.includes('/mathigon/')) {
    return handleMathigonResources(event);
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

// Special handling for Mathigon resources
function handleMathigonResources(event) {
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // Skip if not a GET request or is a problematic URL
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension:') ||
      event.request.url.startsWith('data:')) {
    return;
  }
  
  // Check whether this is core assets or course content
  const isContent = pathname.includes('/mathigon/content/');
  const isAsset = pathname.includes('/mathigon/assets/');
  
  // Core assets use a cache-first strategy
  if (isAsset) {
    event.respondWith(
      caches.open(MATHIGON_CACHE).then(cache => 
        cache.match(event.request).then(response => {
          if (response) {
            // Return from cache for assets
            return response;
          }
          
          // Cache miss, fetch from network and add to cache
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(error => {
            console.error('Failed to fetch Mathigon asset:', error);
            // Could return a fallback asset here
          });
        })
      )
    );
    return;
  }
  
  // For course content, use a network-first strategy
  if (isContent) {
    // Special handling for JSON files - network first with fallback to cache
    const isJSON = pathname.endsWith('.json');
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of successful responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(MATHIGON_CACHE).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('Network request failed, trying cache for:', pathname);
          return caches.open(MATHIGON_CACHE)
            .then(cache => cache.match(event.request))
            .then(response => {
              if (response) {
                return response;
              }
              console.error('No cached version available for:', pathname);
              
              // For JSON content, try to return a minimal placeholder
              if (isJSON) {
                return new Response(JSON.stringify({
                  sections: [{
                    id: "offline",
                    title: "Offline Content",
                    content: "<p>This content is not available offline. Please reconnect to the internet.</p>"
                  }]
                }), {
                  headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                  }
                });
              }
              
              throw error;
            });
        })
    );
    return;
  }
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (!event.data) return;
  
  // Handle skip waiting request
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle cache invalidation request
  if (event.data.type === 'CLEAR_MATHIGON_CACHE') {
    caches.delete(MATHIGON_CACHE).then(() => {
      console.log('Mathigon content cache cleared');
      if (event.data.reCache) {
        // Re-cache core assets
        caches.open(MATHIGON_CACHE).then(cache => {
          cache.addAll(PRECACHE_ASSETS.filter(a => a.includes('/mathigon/')));
        });
      }
    });
  }
});
