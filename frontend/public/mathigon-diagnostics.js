/**
 * Mathigon Diagnostics Script
 * This script provides diagnostic tools for troubleshooting Mathigon integration
 */

(function() {
  // Initialize diagnostics tools
  window.MathigonDiagnostics = {
    version: '1.0.0',
    
    // Run all tests
    runAll: function() {
      this.checkEnvironment();
      this.checkScripts();
      this.checkContent();
      this.checkServiceWorker();
      this.checkCaches();
    },
    
    // Check browser environment
    checkEnvironment: function() {
      console.group('Environment Check');
      console.log('Browser:', navigator.userAgent);
      console.log('Protocol:', window.location.protocol);
      console.log('Service Worker API:', 'serviceWorker' in navigator ? 'Available' : 'Not available');
      console.log('Cache API:', 'caches' in navigator ? 'Available' : 'Not available');
      console.log('IndexedDB:', 'indexedDB' in window ? 'Available' : 'Not available');
      console.log('Storage Persistence:', navigator.storage && navigator.storage.persist ? 'Supported' : 'Not supported');
      console.log('Online Status:', navigator.onLine ? 'Online' : 'Offline');
      console.groupEnd();
    },
    
    // Check Mathigon scripts
    checkScripts: function() {
      console.group('Mathigon Scripts Check');
      
      this._checkResource('/mathigon/assets/course.js', 'application/javascript');
      this._checkResource('/mathigon/assets/boost.js', 'application/javascript');
      this._checkResource('/mathigon/assets/course.css', 'text/css');
      this._checkResource('/mathigon/assets/icons.svg', 'image/svg+xml');
      
      console.log('Window.Mathigon:', window.Mathigon ? 'Available' : 'Not available');
      if (window.Mathigon) {
        console.log('TextbookLoader:', window.Mathigon.TextbookLoader ? 'Available' : 'Not available');
      }
      
      console.groupEnd();
    },
    
    // Check Mathigon content JSON
    checkContent: async function() {
      console.group('Content Check');
      
      const courses = ['circles', 'triangles', 'probability', 'algebra', 'functions'];
      for (const course of courses) {
        await this._checkJson(`/mathigon/content/${course}/content.json`);
      }
      
      console.groupEnd();
    },
    
    // Check service worker
    checkServiceWorker: async function() {
      console.group('Service Worker Check');
      
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker API not available');
        console.groupEnd();
        return;
      }
      
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('Service Worker Registrations:', registrations.length);
        
        for (const reg of registrations) {
          console.log(`- Scope: ${reg.scope}`);
          console.log(`  Status: ${reg.active ? 'Active' : reg.installing ? 'Installing' : reg.waiting ? 'Waiting' : 'Unknown'}`);
        }
        
        // Check service worker script
        this._checkResource('/service-worker.js', 'application/javascript');
      } catch (err) {
        console.error('Service Worker check failed:', err);
      }
      
      console.groupEnd();
    },
    
    // Check caches
    checkCaches: async function() {
      console.group('Cache Check');
      
      if (!('caches' in window)) {
        console.warn('Cache API not available');
        console.groupEnd();
        return;
      }
      
      try {
        const cacheNames = await window.caches.keys();
        console.log('Caches:', cacheNames);
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          console.log(`- ${name}: ${keys.length} items`);
          
          // Show sample of cached items
          const mathigonKeys = keys.filter(k => k.url.includes('/mathigon/'));
          if (mathigonKeys.length) {
            console.log(`  Mathigon items: ${mathigonKeys.length}`);
            mathigonKeys.slice(0, 3).forEach(k => console.log(`  - ${k.url}`));
            if (mathigonKeys.length > 3) {
              console.log(`  ... and ${mathigonKeys.length - 3} more`);
            }
          }
        }
      } catch (err) {
        console.error('Cache check failed:', err);
      }
      
      console.groupEnd();
    },
    
    // Clear Mathigon cache
    clearMathigonCache: async function() {
      console.group('Clearing Mathigon Cache');
      
      if (!('caches' in window)) {
        console.warn('Cache API not available');
        console.groupEnd();
        return false;
      }
      
      try {
        const cacheNames = await window.caches.keys();
        let cleared = false;
        
        for (const name of cacheNames) {
          if (name.includes('mathigon') || name.includes('kha-boom')) {
            await caches.delete(name);
            console.log(`Deleted cache: ${name}`);
            cleared = true;
          }
        }
        
        // Send message to service worker
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_MATHIGON_CACHE',
            reCache: true
          });
          console.log('Sent cache clear message to Service Worker');
          cleared = true;
        }
        
        if (cleared) {
          console.log('✅ Cache cleared successfully!');
        } else {
          console.log('No matching caches found to clear');
        }
        
        console.groupEnd();
        return cleared;
      } catch (err) {
        console.error('Failed to clear cache:', err);
        console.groupEnd();
        return false;
      }
    },
    
    // Helper to check a resource with fetch
    _checkResource: async function(url, expectedType) {
      try {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        const status = response.status;
        
        if (status === 200) {
          console.log(`✅ ${url}: ${status} ${contentType}`);
          if (expectedType && !contentType.includes(expectedType)) {
            console.warn(`⚠️ Wrong content type for ${url}. Expected: ${expectedType}, Got: ${contentType}`);
          }
        } else {
          console.error(`❌ ${url}: ${status}`);
        }
      } catch (err) {
        console.error(`❌ ${url}: Failed to fetch - ${err.message}`);
      }
    },
    
    // Helper to check JSON content
    _checkJson: async function(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`❌ ${url}: ${response.status}`);
          return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('json')) {
          console.error(`❌ ${url}: Wrong content type - ${contentType}`);
          
          // Check if it's HTML instead of JSON
          const text = await response.text();
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            console.error(`❌ ${url} returned HTML instead of JSON!`);
          }
          return;
        }
        
        const json = await response.json();
        if (json && json.sections && Array.isArray(json.sections)) {
          console.log(`✅ ${url}: Valid JSON with ${json.sections.length} sections`);
        } else {
          console.warn(`⚠️ ${url}: JSON structure is not as expected`);
        }
      } catch (err) {
        console.error(`❌ ${url}: ${err.message}`);
      }
    }
  };
  
  console.log('Mathigon Diagnostics loaded - run window.MathigonDiagnostics.runAll() to start tests');
})(); 