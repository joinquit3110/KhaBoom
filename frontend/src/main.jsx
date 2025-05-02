import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

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
