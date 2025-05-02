/**
 * Browser Support Detection Utility
 * 
 * Detects browser capabilities to ensure optimal experience
 * and provide fallbacks when necessary features aren't supported.
 */

/**
 * Check if the browser supports all required features
 * @returns {Object} Object with support status for each feature
 */
export const checkBrowserSupport = () => {
  const support = {
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    webgl: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })(),
    webp: false, // Will be detected async
    touchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    mediaSession: 'mediaSession' in navigator,
    connectivity: 'onLine' in navigator,
    fullscreen: document.documentElement.requestFullscreen !== undefined
  };
  
  // Check WebP support asynchronously
  const checkWebP = () => {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = function() {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };
  
  // Update WebP support status when check completes
  checkWebP().then(supported => {
    support.webp = supported;
  });
  
  return support;
};

/**
 * Get browser and OS information
 * @returns {Object} Browser and OS info
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";
  let osName = "Unknown";
  let osVersion = "Unknown";
  
  // Detect browser
  if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    browserName = "Samsung Browser";
    browserVersion = userAgent.match(/SamsungBrowser\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    browserName = "Opera";
    browserVersion = userAgent.indexOf("Opera") > -1 
      ? userAgent.match(/Opera\/([0-9.]+)/)[1]
      : userAgent.match(/OPR\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf("Edg") > -1) {
    browserName = "Edge";
    browserVersion = userAgent.match(/Edg\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Safari";
    browserVersion = userAgent.match(/Version\/([0-9.]+)/)[1];
  }
  
  // Detect OS
  if (userAgent.indexOf("Win") > -1) {
    osName = "Windows";
    if (userAgent.indexOf("Windows NT 10.0") > -1) osVersion = "10";
    else if (userAgent.indexOf("Windows NT 6.3") > -1) osVersion = "8.1";
    else if (userAgent.indexOf("Windows NT 6.2") > -1) osVersion = "8";
    else if (userAgent.indexOf("Windows NT 6.1") > -1) osVersion = "7";
  } else if (userAgent.indexOf("Mac") > -1) {
    osName = "macOS";
    osVersion = userAgent.match(/Mac OS X ([0-9_]+)/)[1].replace(/_/g, '.');
  } else if (userAgent.indexOf("Android") > -1) {
    osName = "Android";
    osVersion = userAgent.match(/Android ([0-9.]+)/)[1];
  } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
    osName = "iOS";
    osVersion = userAgent.match(/OS ([0-9_]+)/)[1].replace(/_/g, '.');
  } else if (userAgent.indexOf("Linux") > -1) {
    osName = "Linux";
  }
  
  return {
    browser: {
      name: browserName,
      version: browserVersion,
      userAgent: userAgent
    },
    os: {
      name: osName,
      version: osVersion
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      dpr: window.devicePixelRatio || 1
    }
  };
};

/**
 * Check if browser is modern enough for full experience
 * @returns {boolean} True if browser is modern
 */
export const isModernBrowser = () => {
  const support = checkBrowserSupport();
  // Require service worker, localStorage, and connectivity
  return support.serviceWorker && support.localStorage && support.connectivity;
};

/**
 * Get feature recommendations for current browser
 * @returns {Array} Array of recommendations
 */
export const getFeatureRecommendations = () => {
  const support = checkBrowserSupport();
  const recommendations = [];
  
  // Check each feature and add recommendations
  if (!support.serviceWorker) {
    recommendations.push({
      feature: 'Offline Support',
      message: 'Your browser does not support offline access. Consider using Chrome, Firefox, or Edge for the best experience.',
      critical: true
    });
  }
  
  if (!support.localStorage) {
    recommendations.push({
      feature: 'Local Storage',
      message: 'Your browser does not support storing data locally. Progress tracking may not work correctly.',
      critical: true
    });
  }
  
  if (!support.webgl) {
    recommendations.push({
      feature: 'WebGL',
      message: 'Your browser has limited support for interactive 3D graphics. Some course content may not display correctly.',
      critical: false
    });
  }
  
  return recommendations;
};

export default {
  checkBrowserSupport,
  getBrowserInfo,
  isModernBrowser,
  getFeatureRecommendations
};
