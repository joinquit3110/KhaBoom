// =============================================================================
// Lazy Loading Utility
// (c) Kha-Boom!
// =============================================================================

class LazyLoader {
  constructor() {
    this.observer = null;
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      this.observeImages();
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }
  }
  
  observeImages() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    images.forEach(img => this.observer.observe(img));
  }
  
  loadImage(img) {
    // Load main image
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    
    // Load responsive images
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.removeAttribute('data-srcset');
    }
    
    // Add loaded class for CSS transitions
    img.classList.add('loaded');
    
    // Remove loading placeholder
    img.classList.remove('lazy');
  }
  
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    images.forEach(img => this.loadImage(img));
  }
  
  // Method to add new images to observer
  observe(img) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      this.loadImage(img);
    }
  }
}

// CSS for lazy loading
const lazyLoadingCSS = `
  img.lazy {
    opacity: 0;
    transition: opacity 0.3s;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  img.loaded {
    opacity: 1;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  @media (prefers-reduced-motion: reduce) {
    img.lazy {
      animation: none;
    }
  }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = lazyLoadingCSS;
document.head.appendChild(style);

// Initialize lazy loader
const lazyLoader = new LazyLoader();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
} else {
  window.LazyLoader = LazyLoader;
}