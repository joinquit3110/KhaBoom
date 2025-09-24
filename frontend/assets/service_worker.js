// =============================================================================
// Kha-Boom! Enhanced Service Worker
// (c) Kha-Boom! - Performance Optimized
// =============================================================================

const CACHE_NAME = 'khaboom-cache-v1';
const STATIC_CACHE_NAME = 'khaboom-static-v1';
const DYNAMIC_CACHE_NAME = 'khaboom-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/main.css',
  '/main.js',
  '/course.css', 
  '/course.js',
  '/dashboard.css',
  '/dashboard.js',
  '/polyfill.js',
  '/icons.svg',
  '/assets/manifest.json',
  '/assets/favicon.ico'
];

// Cache API responses for faster loading
const API_CACHE_PATTERNS = [
  /^\/api\/search/,
  /^\/content\//,
  /^\/course\/.+\/[^\/]+$/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!url.origin.includes(self.location.origin)) return;
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  }
});

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for API
function isApiRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for HTML page
function isPageRequest(request) {
  const url = new URL(request.url);
  return request.headers.get('accept').includes('text/html');
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Static asset fetch failed:', error);
    return new Response('Asset not available', { status: 404 });
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('API fetch failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response('API not available', { status: 503 });
  }
}

// Handle page requests with network-first, fallback to cache
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Page fetch failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Fallback to offline page if available
    const offlineResponse = await caches.match('/');
    return offlineResponse || new Response('Page not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for better UX
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background tasks like progress sync
  console.log('Background sync executed');
}
