import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/courseReader.css'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Clean up any browser extension errors and filter error messages
(() => {
  // Remove any invalid scripts
  const invalidScripts = document.querySelectorAll('script[src^="chrome-extension://"]');
  invalidScripts.forEach(script => script.remove());
  
  // Filter console messages to remove noise
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMsg = args.length > 0 ? String(args[0] || '') : '';
    
    // Ignore specific errors that we can't fix
    if (errorMsg.includes('content-script-dev:') || 
        errorMsg.includes('screenshot-gv-chrome') ||
        errorMsg.includes('Failed to load module script') || 
        errorMsg.includes('text/jsx') ||
        errorMsg.includes('Refused to connect') ||
        errorMsg.includes('Content Security Policy') ||
        errorMsg.includes('MIME type') ||
        errorMsg.includes('chrome-extension://invalid') ||
        errorMsg.includes('google-analytics') ||
        errorMsg.includes('overbridgenet.com') ||
        errorMsg.includes('CORS') ||
        errorMsg.includes('ERR_BLOCKED_BY_CLIENT') ||
        errorMsg.includes('ERR_FAILED')) {
      // Skip logging these errors
      return;
    }
    
    // Pass through all other errors
    return originalConsoleError.apply(console, args);
  };
  
  // Also filter warning messages
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const warnMsg = args.length > 0 ? String(args[0] || '') : '';
    
    // Ignore specific warnings that we can't fix
    if (warnMsg.includes('content-script') || 
        warnMsg.includes('extension') ||
        warnMsg.includes('404')) {
      // Skip logging these warnings
      return;
    }
    
    // Pass through all other warnings
    return originalConsoleWarn.apply(console, args);
  };
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register the service worker for offline support
serviceWorkerRegistration.register({
  onUpdate: registration => {
    // Notify users of updates
    const shouldUpdate = window.confirm(
      'New version of KhaBoom available. Update now?'
    );
    
    if (shouldUpdate && registration.waiting) {
      // Send message to the service worker to skip waiting and activate the new version
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onSuccess: registration => {
    console.log('KhaBoom content cached for offline use!');
  }
});
