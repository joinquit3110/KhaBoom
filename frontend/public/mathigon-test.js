/**
 * Mathigon Diagnostic Helper
 * 
 * This script helps diagnose issues with Mathigon integration
 */

(function() {
  console.log('Mathigon Diagnostic Helper loaded');
  
  // Store the original fetch to patch it
  const originalFetch = window.fetch;
  
  // Create a container for debug output
  function createDebugConsole() {
    if (document.getElementById('mathigon-debug')) return;
    
    const debugConsole = document.createElement('div');
    debugConsole.id = 'mathigon-debug';
    debugConsole.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 400px; max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.8); color: white; font-family: monospace; font-size: 12px; padding: 10px; z-index: 10000; display: none;';
    
    const header = document.createElement('div');
    header.textContent = 'Mathigon Debug';
    header.style.cssText = 'font-weight: bold; margin-bottom: 5px; cursor: pointer; display: flex; justify-content: space-between;';
    
    const closeBtn = document.createElement('span');
    closeBtn.textContent = 'X';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = function() {
      debugConsole.style.display = 'none';
    };
    
    const clearBtn = document.createElement('span');
    clearBtn.textContent = 'Clear';
    clearBtn.style.cursor = 'pointer';
    clearBtn.style.marginRight = '10px';
    clearBtn.onclick = function() {
      const logContainer = document.getElementById('mathigon-debug-log');
      if (logContainer) logContainer.innerHTML = '';
    };
    
    header.appendChild(clearBtn);
    header.appendChild(closeBtn);
    debugConsole.appendChild(header);
    
    header.onclick = function(e) {
      if (e.target !== closeBtn && e.target !== clearBtn) {
        const logContainer = document.getElementById('mathigon-debug-log');
        if (logContainer) logContainer.style.display = logContainer.style.display === 'none' ? 'block' : 'none';
      }
    };
    
    const logContainer = document.createElement('div');
    logContainer.id = 'mathigon-debug-log';
    debugConsole.appendChild(logContainer);
    
    document.body.appendChild(debugConsole);
    
    // Add a toggler button
    const toggler = document.createElement('button');
    toggler.textContent = 'Debug';
    toggler.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 10001; background: #1f7aff; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;';
    toggler.onclick = function() {
      debugConsole.style.display = debugConsole.style.display === 'none' ? 'block' : 'none';
    };
    document.body.appendChild(toggler);
  }
  
  // Add a log message to the debug console
  function debugLog(message, type = 'info') {
    console.log(`[MATHIGON-DEBUG] ${message}`);
    
    // Ensure debug console exists
    if (typeof document !== 'undefined' && document.body) {
      createDebugConsole();
      
      const logContainer = document.getElementById('mathigon-debug-log');
      if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.style.cssText = 'margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;';
        
        // Set color based on type
        if (type === 'error') {
          logEntry.style.color = '#ff4d4d';
        } else if (type === 'warning') {
          logEntry.style.color = '#ffcc00';
        } else if (type === 'success') {
          logEntry.style.color = '#4dffa6';
        }
        
        // Add timestamp
        const timestamp = new Date().toTimeString().split(' ')[0];
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }
  
  // Patch fetch to log content type issues
  window.fetch = function(...args) {
    const request = args[0];
    const url = typeof request === 'string' ? request : request.url;
    
    // Only intercept and log content requests
    if (url.includes('/mathigon/content/')) {
      debugLog(`Fetching ${url}`, 'info');
      
      return originalFetch.apply(this, args)
        .then(response => {
          const contentType = response.headers.get('content-type');
          const status = response.status;
          
          if (status >= 400) {
            debugLog(`Error fetching ${url}: ${status}`, 'error');
          } else if (url.endsWith('.json') && !contentType.includes('application/json')) {
            debugLog(`Content type mismatch for ${url}: Expected application/json, got ${contentType}`, 'warning');
          } else if (url.endsWith('.js') && !contentType.includes('javascript')) {
            debugLog(`Content type mismatch for ${url}: Expected javascript, got ${contentType}`, 'warning');
          } else {
            debugLog(`Successfully fetched ${url}: ${status} ${contentType}`, 'success');
          }
          
          return response;
        })
        .catch(error => {
          debugLog(`Fetch error for ${url}: ${error.message}`, 'error');
          throw error;
        });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'sw-debug') {
      debugLog(`[SW] ${event.data.message}`, 'info');
    }
  });
  
  // Monitor Mathigon global object
  function checkMathigon() {
    if (window.Mathigon) {
      debugLog('Mathigon global object available', 'success');
      
      // Check for TextbookLoader
      if (window.Mathigon.TextbookLoader) {
        debugLog('TextbookLoader class available', 'success');
      } else {
        debugLog('TextbookLoader not found, looking for alternatives...', 'warning');
        
        // Try to find it in other properties
        for (const prop in window.Mathigon) {
          if (typeof window.Mathigon[prop] === 'function') {
            try {
              const fnString = window.Mathigon[prop].toString();
              if (fnString.includes('TextbookLoader') || 
                  (fnString.includes('initialize') && fnString.includes('load'))) {
                debugLog(`Potential TextbookLoader found in Mathigon.${prop}`, 'success');
                window.Mathigon.TextbookLoader = window.Mathigon[prop];
                break;
              }
            } catch (e) {
              // Ignore errors when stringifying functions
            }
          }
        }
      }
      
      // Check mathigonConfig
      if (window.mathigonConfig) {
        debugLog(`Mathigon config: ${JSON.stringify(window.mathigonConfig)}`, 'info');
      } else {
        debugLog('mathigonConfig not found', 'warning');
      }
    } else {
      debugLog('Mathigon global object not available', 'error');
      
      // Try again in a second
      setTimeout(checkMathigon, 1000);
    }
  }
  
  // Wait for document to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(checkMathigon, 500);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkMathigon, 500);
    });
  }
})(); 