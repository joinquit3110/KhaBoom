/**
 * Mathigon Boost Library
 * A lightweight compatibility layer for Mathigon components
 */

(function() {
  // Create or use existing Mathigon namespace
  window.Mathigon = window.Mathigon || {};
  
  // Define basic utility functions that might be missing
  window.Mathigon.Boost = {
    version: '1.0.0',
    
    // Animation utilities
    animate: function(element, properties, duration, callback) {
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return;
      
      const start = Date.now();
      const initialValues = {};
      
      // Get initial values
      for (const key in properties) {
        const computedStyle = window.getComputedStyle(element);
        initialValues[key] = parseFloat(computedStyle[key]) || 0;
      }
      
      // Animation frame function
      function frame() {
        const progress = Math.min(1, (Date.now() - start) / duration);
        
        for (const key in properties) {
          const value = initialValues[key] + (properties[key] - initialValues[key]) * progress;
          element.style[key] = value + (typeof properties[key] === 'number' ? 'px' : '');
        }
        
        if (progress < 1) {
          requestAnimationFrame(frame);
        } else if (typeof callback === 'function') {
          callback();
        }
      }
      
      requestAnimationFrame(frame);
    },
    
    // DOM utilities
    $: function(selector, container) {
      container = container || document;
      return container.querySelector(selector);
    },
    
    $$: function(selector, container) {
      container = container || document;
      return Array.from(container.querySelectorAll(selector));
    },
    
    // Event utilities
    on: function(element, event, callback, options) {
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return;
      
      element.addEventListener(event, callback, options || false);
      
      return {
        cancel: function() {
          element.removeEventListener(event, callback);
        }
      };
    },
    
    // Element creation utility
    create: function(tag, options, ...children) {
      const element = document.createElement(tag);
      
      if (options) {
        for (const key in options) {
          if (key === 'class' || key === 'className') {
            element.className = options[key];
          } else if (key === 'style' && typeof options.style === 'object') {
            Object.assign(element.style, options.style);
          } else if (key.startsWith('on') && typeof options[key] === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, options[key]);
          } else {
            element.setAttribute(key, options[key]);
          }
        }
      }
      
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      });
      
      return element;
    }
  };
  
  // Log initialization
  console.log('Mathigon Boost library initialized');
})(); 