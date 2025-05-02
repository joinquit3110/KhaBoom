/**
 * KhaBoom Service Worker
 * Provides offline capabilities and caching for improved performance
 */

const CACHE_NAME = 'khaboom-v1';
const ASSETS_CACHE_NAME = 'khaboom-assets-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/logo.png',
  '/assets/icons/logo-192.png',
  '/assets/icons/logo-512.png'
];

// API routes to bypass (never cache)
const API_ROUTES = [
  '/api/auth/',
  '/api/progress/',
  '/api/user/'
];

// Course content API routes (special handling)
const CONTENT_ROUTES = [
  '/api/courses/',
  '/api/content/'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    Promise.all([
      // Cache core app shell
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Pre-caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      // Cache for course assets (separate to manage independently)
      caches.open(ASSETS_CACHE_NAME).then(cache => {
        console.log('[Service Worker] Pre-caching assets');
        // Don't block installation on asset caching
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('[Service Worker] Install complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('khaboom-') && 
                 cacheName !== CACHE_NAME && 
                 cacheName !== ASSETS_CACHE_NAME;
        }).map(cacheName => {
          console.log('[Service Worker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activate complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension:, data:, blob:, etc.
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (isApiRoute(url.pathname)) {
    if (isContentApiRoute(url.pathname)) {
      // Course content has special caching rules
      event.respondWith(fetchAndCacheContent(event.request));
    } else {
      // Other API routes, network-first with timeout
      event.respondWith(networkFirstWithTimeout(event.request, 3000));
    }
    return;
  }
  
  // Static assets - cache first
  if (isAssetRequest(url.pathname)) {
    event.respondWith(cacheFirst(event.request, ASSETS_CACHE_NAME));
    return;
  }
  
  // For HTML navigation, use network first approach
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(event.request));
    return;
  }
  
  // Default to cache-first for all other static resources
  event.respondWith(cacheFirst(event.request, CACHE_NAME));
});

// Helper functions

// Network first strategy with offline fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful response
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Fetching offline from cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no offline fallback in cache, serve offline page
    return caches.match('/offline.html');
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName = CACHE_NAME) {
  // Skip chrome-extension URLs to prevent cache errors
  if (request.url.startsWith('chrome-extension:')) {
    return fetch(request);
  }
  
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    // Only cache if the response is valid and not opaque
    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    // No fallback available
    throw error;
  }
}

// Network first with timeout
async function networkFirstWithTimeout(request, timeoutMs) {
  return Promise.race([
    fetch(request).then(response => {
      // Only cache valid responses from API
      if (response.ok) {
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, clonedResponse);
        });
      }
      return response;
    }),
    
    new Promise(resolve => {
      setTimeout(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          resolve(cachedResponse);
        }
      }, timeoutMs);
    })
  ]).catch(async () => {
    // If both timeout and network fail, try cache anyway
    return caches.match(request);
  });
}

// Special handling for course content
async function fetchAndCacheContent(request) {
  try {
    // Try network first for content
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.ok) {
      const clonedResponse = response.clone();
      const cache = await caches.open(ASSETS_CACHE_NAME);
      cache.put(request, clonedResponse);
    }
    
    return response;
  } catch (error) {
    // Fallback to cache for offline use
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cached content available
    console.error('[Service Worker] Failed to fetch content:', error);
    throw error;
  }
}

// Check if a request is for an API
function isApiRoute(pathname) {
  return API_ROUTES.some(route => pathname.includes(route)) || 
         CONTENT_ROUTES.some(route => pathname.includes(route));
}

// Check if a request is for content API
function isContentApiRoute(pathname) {
  return CONTENT_ROUTES.some(route => pathname.includes(route));
}

// Check if a request is for a static asset
function isAssetRequest(pathname) {
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico', 
                          '.css', '.js', '.json', '.woff', '.woff2', '.ttf'];
  return assetExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname.includes('/assets/');
}
