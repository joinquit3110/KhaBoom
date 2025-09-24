// =============================================================================
// Resource Preloader and Performance Optimizer
// (c) Kha-Boom!
// =============================================================================

class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private pendingPreloads = new Map<string, Promise<any>>();
  
  constructor() {
    this.init();
  }
  
  init() {
    // Preload critical resources immediately
    this.preloadCriticalResources();
    
    // Set up intersection observer for content-based preloading
    this.setupContentPreloader();
    
    // Preload on hover/touch for better UX
    this.setupHoverPreloader();
    
    // Register service worker
    this.registerServiceWorker();
  }
  
  private preloadCriticalResources() {
    const criticalResources = [
      '/main.css',
      '/course.css', 
      '/icons.svg',
      // Add critical fonts
      '/assets/fonts/charter-regular.woff2',
      '/assets/fonts/charter-bold.woff2',
    ];
    
    criticalResources.forEach(resource => {
      this.preloadResource(resource, this.getResourceType(resource));
    });
  }
  
  private setupContentPreloader() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Preload section-specific resources
          if (element.classList.contains('course-section')) {
            this.preloadSectionResources(element);
          }
          
          // Preload next page
          if (element.classList.contains('next-section-trigger')) {
            this.preloadNextSection(element);
          }
        }
      });
    }, {
      rootMargin: '200px 0px', // Start preloading 200px before element comes into view
      threshold: 0.1
    });
    
    // Observe all course sections
    document.querySelectorAll('.course-section, .next-section-trigger').forEach(el => {
      observer.observe(el);
    });
  }
  
  private setupHoverPreloader() {
    // Preload on hover for navigation links
    document.addEventListener('mouseenter', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && this.isInternalLink(link.href)) {
        this.preloadPage(link.href);
      }
    }, { passive: true, capture: true });
    
    // Also preload on touch start for mobile
    document.addEventListener('touchstart', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && this.isInternalLink(link.href)) {
        this.preloadPage(link.href);
      }
    }, { passive: true, capture: true });
  }
  
  private preloadResource(url: string, type: string, crossorigin?: string): Promise<any> {
    if (this.preloadedResources.has(url)) {
      return Promise.resolve();
    }
    
    if (this.pendingPreloads.has(url)) {
      return this.pendingPreloads.get(url)!;
    }
    
    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      
      if (crossorigin) {
        link.crossOrigin = crossorigin;
      }
      
      link.onload = () => {
        this.preloadedResources.add(url);
        this.pendingPreloads.delete(url);
        resolve(undefined);
      };
      
      link.onerror = () => {
        this.pendingPreloads.delete(url);
        reject(new Error(`Failed to preload ${url}`));
      };
      
      document.head.appendChild(link);
    });
    
    this.pendingPreloads.set(url, promise);
    return promise;
  }
  
  private preloadPage(url: string): void {
    // Extract path from URL
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname;
    
    // Don't preload same page
    if (path === window.location.pathname) return;
    
    // Preload HTML
    if (!this.preloadedResources.has(url)) {
      fetch(url, { 
        method: 'GET',
        headers: { 'X-Preload': 'true' }
      }).then(response => {
        if (response.ok) {
          this.preloadedResources.add(url);
          // Store in cache for instant navigation
          this.cachePageResponse(url, response);
        }
      }).catch(() => {
        // Ignore preload failures
      });
    }
  }
  
  private preloadSectionResources(element: Element): void {
    // Preload section-specific CSS
    const sectionId = element.getAttribute('data-section');
    if (sectionId) {
      this.preloadResource(`/content/${sectionId}/styles.css`, 'style');
    }
    
    // Preload visible images
    const images = element.querySelectorAll('img[data-src]');
    images.forEach((img: HTMLImageElement) => {
      if (img.dataset.src) {
        this.preloadResource(img.dataset.src, 'image');
      }
    });
    
    // Preload audio files
    const audioElements = element.querySelectorAll('[data-audio]');
    audioElements.forEach((audio: HTMLElement) => {
      if (audio.dataset.audio) {
        this.preloadResource(audio.dataset.audio, 'audio');
      }
    });
  }
  
  private preloadNextSection(element: Element): void {
    const nextUrl = element.getAttribute('data-next-url');
    if (nextUrl) {
      this.preloadPage(nextUrl);
    }
  }
  
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'css': return 'style';
      case 'js': return 'script';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf': return 'font';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg': return 'image';
      case 'mp3':
      case 'wav':
      case 'ogg': return 'audio';
      case 'mp4':
      case 'webm': return 'video';
      default: return 'fetch';
    }
  }
  
  private isInternalLink(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  
  private async cachePageResponse(url: string, response: Response): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('page-cache-v1');
        await cache.put(url, response.clone());
      } catch {
        // Ignore cache failures
      }
    }
  }
  
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/service_worker.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Update service worker when page loads
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available, prompt user to refresh
                this.showUpdateAvailable();
              }
            });
          }
        });
        
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }
  
  private showUpdateAvailable(): void {
    // Simple update notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 10000;
      cursor: pointer;
      font-size: 14px;
    `;
    notification.textContent = 'New version available! Click to update.';
    notification.addEventListener('click', () => {
      window.location.reload();
    });
    
    document.body.appendChild(notification);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }
}

// Initialize preloader when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ResourcePreloader();
  });
} else {
  new ResourcePreloader();
}