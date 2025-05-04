/**
 * Mathigon Diagnostic Helper - Enhanced
 * 
 * This script helps diagnose issues with Mathigon integration
 */

(function() {
  console.log('Mathigon Diagnostic Helper loaded - Enhanced version');
  
  // Store the original fetch to patch it
  const originalFetch = window.fetch;
  
  // Create a container for debug output
  function createDebugConsole() {
    if (document.getElementById('mathigon-debug')) return;
    
    const debugConsole = document.createElement('div');
    debugConsole.id = 'mathigon-debug';
    debugConsole.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 500px; max-height: 400px; overflow-y: auto; background: rgba(0,0,0,0.9); color: white; font-family: monospace; font-size: 12px; padding: 10px; z-index: 10000;';
    
    const header = document.createElement('div');
    header.textContent = 'Mathigon Debug - Enhanced';
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
    
    const copyBtn = document.createElement('span');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.marginRight = '10px';
    copyBtn.onclick = function() {
      const logContainer = document.getElementById('mathigon-debug-log');
      if (logContainer) {
        const text = logContainer.innerText;
        navigator.clipboard.writeText(text).then(
          () => { alert('Debug log copied to clipboard'); },
          () => { alert('Failed to copy debug log'); }
        );
      }
    };
    
    header.appendChild(copyBtn);
    header.appendChild(clearBtn);
    header.appendChild(closeBtn);
    debugConsole.appendChild(header);
    
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
  function debugLog(message, type = 'info', details = null) {
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
        
        // Add details if provided
        if (details) {
          const detailsElem = document.createElement('pre');
          detailsElem.style.cssText = 'margin: 5px 0 5px 15px; font-size: 11px; max-height: 100px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 2px;';
          detailsElem.textContent = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
          logEntry.appendChild(detailsElem);
        }
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }
  
  // Check if content looks like HTML
  function isHtmlContent(content) {
    if (typeof content !== 'string') return false;
    
    const trimmed = content.trim();
    return trimmed.startsWith('<!DOCTYPE') || 
           trimmed.startsWith('<html') || 
           (trimmed.startsWith('<') && trimmed.includes('<html'));
  }
  
  // Try to parse JSON
  function tryParseJson(content) {
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  
  // Patch fetch to log content type issues
  window.fetch = function(...args) {
    const request = args[0];
    const url = typeof request === 'string' ? request : request.url;
    
    // Intercept requests
    debugLog(`Fetching ${url}`, 'info');
    
    return originalFetch.apply(this, args)
      .then(response => {
        const contentType = response.headers.get('content-type');
        const status = response.status;
        
        if (status >= 400) {
          debugLog(`Error fetching ${url}: ${status}`, 'error');
          // Clone the response to inspect its body
          return response.clone().text().then(text => {
            debugLog(`Response body for ${url}:`, 'error', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return response;
          });
        }
        
        // For Mathigon content requests, we'll do extra checks
        if (url.includes('/mathigon/content/')) {
          if (url.endsWith('.json') && !contentType.includes('application/json')) {
            debugLog(`Content type mismatch for ${url}: Expected application/json, got ${contentType}`, 'warning');
          }
          
          // For JSON files, check the actual content
          if (url.endsWith('.json')) {
            return response.clone().text().then(text => {
              if (isHtmlContent(text)) {
                debugLog(`JSON endpoint ${url} is returning HTML content!`, 'error', text.substring(0, 300));
              } else {
                const parsed = tryParseJson(text);
                if (parsed) {
                  debugLog(`Successfully parsed JSON from ${url}`, 'success', {
                    keys: Object.keys(parsed),
                    sections: parsed.sections ? parsed.sections.length : 'none'
                  });
                } else {
                  debugLog(`Failed to parse JSON from ${url}`, 'error', text.substring(0, 300));
                }
              }
              return response;
            });
          }
          
          // For JavaScript, ensure it's actually JS
          if (url.endsWith('.js') && !contentType.includes('javascript')) {
            return response.clone().text().then(text => {
              if (isHtmlContent(text)) {
                debugLog(`JavaScript endpoint ${url} is returning HTML content!`, 'error', text.substring(0, 300));
              }
              return response;
            });
          }
        }
        
        return response;
      })
      .catch(error => {
        debugLog(`Fetch error for ${url}: ${error.message}`, 'error');
        throw error;
      });
  };
  
  // Listen for service worker messages
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'sw-debug') {
        debugLog(`[SW] ${event.data.message}`, 'info');
      }
    });
  }
  
  // Check for content.json files in local storage
  function checkLocalStorage() {
    try {
      let hasCache = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('content.json')) {
          hasCache = true;
          const value = localStorage.getItem(key);
          const parsed = tryParseJson(value);
          if (parsed) {
            debugLog(`Found cached ${key} in localStorage`, 'success', {
              size: value.length,
              keys: Object.keys(parsed),
              sections: parsed.sections ? parsed.sections.length : 'none'
            });
          } else {
            debugLog(`Invalid JSON found in localStorage for ${key}`, 'error');
          }
        }
      }
      if (!hasCache) {
        debugLog('No content.json files found in localStorage', 'warning');
      }
    } catch (e) {
      debugLog(`Error checking localStorage: ${e.message}`, 'error');
    }
  }
  
  // Monitor Mathigon global object
  function checkMathigon() {
    if (window.Mathigon) {
      debugLog('✓ Mathigon global object available', 'success');
      
      // Check for TextbookLoader
      if (window.Mathigon.TextbookLoader) {
        debugLog('✓ TextbookLoader class available', 'success');
      } else {
        debugLog('✗ TextbookLoader not found, looking for alternatives...', 'warning');
        
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
        debugLog('✓ mathigonConfig found', 'success', window.mathigonConfig);
      } else {
        debugLog('✗ mathigonConfig not found', 'warning');
      }
      
      // Check for available methods
      const methods = ['boost', 'fermat', 'hilbert', 'euclid', 'core', 'load', 'StudyRoom', 'Textbook'];
      for (const method of methods) {
        if (window.Mathigon[method]) {
          debugLog(`✓ Mathigon.${method} available`, 'success');
        }
      }
      
      // Check localStorage for cached content
      checkLocalStorage();
      
    } else {
      debugLog('✗ Mathigon global object not available', 'error');
      
      // Try to check if course.js was loaded
      const scripts = document.querySelectorAll('script');
      let courseJsFound = false;
      for (const script of scripts) {
        if (script.src && script.src.includes('course.js')) {
          courseJsFound = true;
          debugLog(`✓ course.js script found: ${script.src}`, 'info');
          
          // Check if the script was loaded successfully
          if (script.complete) {
            debugLog('Script is complete, but Mathigon object not available', 'warning');
          } else {
            debugLog('Script is still loading', 'info');
          }
        }
      }
      
      if (!courseJsFound) {
        debugLog('✗ No course.js script found in the page', 'error');
      }
      
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