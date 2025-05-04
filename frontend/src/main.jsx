import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Add this script cleaner function at the top
(() => {
  // Clean up any content scripts causing errors
  const invalidScripts = document.querySelectorAll('script[src^="chrome-extension://invalid"]');
  invalidScripts.forEach(script => script.remove());
  
  // Block certain console errors to reduce noise
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMsg = args[0]?.toString() || '';
    
    // Filter out known errors we can't fix
    if (errorMsg.includes('content-script-dev:') || 
        errorMsg.includes('Failed to load module script') || 
        errorMsg.includes('Refused to connect') ||
        errorMsg.includes('CORS policy') ||
        errorMsg.includes('Fetch API cannot load')) {
      // Silently ignore content script errors
      return;
    }
    
    // Pass through all other errors
    return originalConsoleError.apply(console, args);
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
