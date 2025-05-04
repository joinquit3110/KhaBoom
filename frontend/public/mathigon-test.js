/**
 * Mathigon Diagnostic Script
 * 
 * This script tests your Mathigon configuration to verify that all components
 * are working properly. Run it in the browser console to diagnose issues.
 */

(function() {
  console.log('%c Mathigon Integration Test', 'background: #5050ff; color: white; font-size: 1.2em; padding: 5px;');
  
  // Tests to run
  const tests = [
    {
      name: 'Verify Configuration',
      fn: async () => {
        if (!window.mathigonConfig) {
          throw new Error('window.mathigonConfig is not defined');
        }
        
        console.log('Current mathigonConfig:', window.mathigonConfig);
        
        if (!window.mathigonConfig.contentPrefix) {
          throw new Error('contentPrefix is not defined in mathigonConfig');
        }
        
        if (!window.mathigonConfig.assetsPrefix) {
          throw new Error('assetsPrefix is not defined in mathigonConfig');
        }
        
        return true;
      }
    },
    {
      name: 'Check Mathigon Global Availability',
      fn: async () => {
        if (!window.Mathigon) {
          throw new Error('window.Mathigon is not defined. Course.js may not be loaded.');
        }
        
        if (!window.Mathigon.TextbookLoader) {
          throw new Error('Mathigon.TextbookLoader is not available. Course.js may be incomplete.');
        }
        
        return true;
      }
    },
    {
      name: 'Test Course.js Loading',
      fn: async () => {
        try {
          const response = await fetch('/mathigon/assets/course.js');
          if (!response.ok) {
            throw new Error(`Failed to load course.js: ${response.status} ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('javascript')) {
            throw new Error(`course.js has incorrect Content-Type: ${contentType}`);
          }
          
          return true;
        } catch (error) {
          throw new Error(`Failed to load course.js: ${error.message}`);
        }
      }
    },
    {
      name: 'Test Course.css Loading',
      fn: async () => {
        try {
          const response = await fetch('/mathigon/assets/course.css');
          if (!response.ok) {
            throw new Error(`Failed to load course.css: ${response.status} ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('css')) {
            throw new Error(`course.css has incorrect Content-Type: ${contentType}`);
          }
          
          return true;
        } catch (error) {
          throw new Error(`Failed to load course.css: ${error.message}`);
        }
      }
    },
    {
      name: 'Test Content JSON Loading',
      fn: async () => {
        // Try to load a sample course (circles)
        try {
          const response = await fetch('/mathigon/content/circles/content.json');
          if (!response.ok) {
            throw new Error(`Failed to load content.json: ${response.status} ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('json')) {
            throw new Error(`content.json has incorrect Content-Type: ${contentType}`);
          }
          
          const json = await response.json();
          if (!json.sections || !Array.isArray(json.sections)) {
            throw new Error('Invalid content.json format: sections array missing');
          }
          
          return true;
        } catch (error) {
          throw new Error(`Failed to load content.json: ${error.message}`);
        }
      }
    },
    {
      name: 'Test CORS Headers',
      fn: async () => {
        try {
          // We'll use the Fetch API to check CORS headers
          const testUrls = [
            '/mathigon/assets/course.js',
            '/mathigon/assets/course.css',
            '/mathigon/content/circles/content.json'
          ];
          
          for (const url of testUrls) {
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
            }
            
            const corsHeader = response.headers.get('access-control-allow-origin');
            if (!corsHeader) {
              throw new Error(`Missing CORS header for ${url}`);
            }
            
            if (corsHeader !== '*') {
              throw new Error(`CORS header for ${url} is not set to '*': ${corsHeader}`);
            }
          }
          
          return true;
        } catch (error) {
          throw new Error(`CORS test failed: ${error.message}`);
        }
      }
    },
    {
      name: 'Test Mathigon Initialization',
      fn: async () => {
        try {
          if (!window.Mathigon || !window.Mathigon.TextbookLoader) {
            throw new Error('Mathigon not available. Cannot test initialization.');
          }
          
          // Create a test container
          const container = document.createElement('div');
          container.id = 'mathigon-test-container';
          container.style.position = 'fixed';
          container.style.top = '-9999px';
          container.style.left = '-9999px';
          document.body.appendChild(container);
          
          try {
            // Try to initialize with a test course
            const textbook = new window.Mathigon.TextbookLoader({
              courseId: 'circles',
              language: 'en',
              sourcePrefix: '/mathigon/content/',
              container: container,
              contentFormat: 'json',
              silent: true // Don't log anything
            });
            
            // Just test initialization, no need to actually load
            // This will at least verify the constructor works
            if (!textbook) {
              throw new Error('Failed to create TextbookLoader instance');
            }
            
            return true;
          } finally {
            // Clean up the test container
            document.body.removeChild(container);
          }
        } catch (error) {
          throw new Error(`Initialization test failed: ${error.message}`);
        }
      }
    }
  ];
  
  // Run all tests
  async function runTests() {
    const results = {
      passed: 0,
      failed: 0,
      details: []
    };
    
    for (const test of tests) {
      try {
        console.log(`%c Testing: ${test.name}`, 'color: blue; font-weight: bold;');
        const result = await test.fn();
        if (result) {
          console.log(`%c ✓ PASSED: ${test.name}`, 'color: green; font-weight: bold;');
          results.passed++;
          results.details.push({ name: test.name, passed: true });
        } else {
          console.error(`%c ✗ FAILED: ${test.name} - Returned false value`, 'color: red; font-weight: bold;');
          results.failed++;
          results.details.push({ name: test.name, passed: false, error: 'Test returned false' });
        }
      } catch (error) {
        console.error(`%c ✗ FAILED: ${test.name} - ${error.message}`, 'color: red; font-weight: bold;');
        results.failed++;
        results.details.push({ name: test.name, passed: false, error: error.message });
      }
    }
    
    // Print summary
    console.log('\n');
    if (results.failed === 0) {
      console.log('%c ✅ ALL TESTS PASSED! Your Mathigon integration looks good.', 'background: green; color: white; font-size: 1.2em; padding: 5px;');
    } else {
      console.log(`%c ❌ ${results.failed} TEST(S) FAILED. Fix the issues above to complete your Mathigon integration.`, 'background: red; color: white; font-size: 1.2em; padding: 5px;');
    }
    
    return results;
  }
  
  // Expose the test runner to the global scope
  window.testMathigon = runTests;
  
  // Run tests immediately if requested
  if (window.location.hash === '#test-mathigon') {
    setTimeout(runTests, 1000); // Give a moment for the page to initialize
  }
  
  console.log('Mathigon test script loaded. Run window.testMathigon() to start tests.');
})(); 