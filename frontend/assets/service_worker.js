// =============================================================================
// Service Worker
// (c) Kha-Boom!
// =============================================================================


self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
