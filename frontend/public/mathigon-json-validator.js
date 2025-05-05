/**
 * Mathigon JSON Validator
 * 
 * This script validates and attempts to fix Mathigon content JSON files
 * that may be malformed due to build process issues.
 */

(function() {
  console.log('%c Mathigon JSON Validator', 'background: #5050ff; color: white; font-size: 1.2em; padding: 5px;');
  
  const COURSE_IDS = [
    'circles',
    'triangles', 
    'probability',
    'algebra',
    'functions'
  ];
  
  /**
   * Test if a JSON file is valid
   * @param {string} url - URL of the JSON file to test
   * @returns {Promise<object>} - Result object with status and info
   */
  async function testJsonFile(url) {
    try {
      const response = await fetch(url);
      
      // Check if there was an HTTP error
      if (!response.ok) {
        return {
          status: 'error',
          message: `HTTP error: ${response.status} ${response.statusText}`,
          contentType: response.headers.get('content-type') || 'unknown'
        };
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        return {
          status: 'error',
          message: `Incorrect Content-Type: ${contentType}`,
          contentType
        };
      }
      
      // Try to parse the JSON
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return {
          status: 'success',
          json,
          contentType
        };
      } catch (parseError) {
        // Try to fix HTML-like response
        if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
          return {
            status: 'error',
            message: 'Response is HTML, not JSON',
            isHtml: true,
            contentType,
            rawText: text
          };
        }
        
        return {
          status: 'error',
          message: `JSON parse error: ${parseError.message}`,
          contentType,
          rawText: text
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Fetch error: ${error.message}`
      };
    }
  }
  
  /**
   * Validate and attempt to fix a course's content JSON
   * @param {string} courseId - The course ID
   */
  async function validateCourseJson(courseId) {
    console.log(`Testing course: ${courseId}`);
    
    const url = `/mathigon/content/${courseId}/content.json`;
    const result = await testJsonFile(url);
    
    if (result.status === 'success') {
      console.log(`%c ✓ ${courseId}/content.json is valid JSON`, 'color: green');
      return { courseId, valid: true };
    } else {
      console.error(`%c ✗ ${courseId}/content.json has issues:`, 'color: red');
      console.error(`   - ${result.message}`);
      console.error(`   - Content-Type: ${result.contentType}`);
      
      // If we received HTML instead of JSON, attempt to access raw JSON
      if (result.isHtml) {
        console.log(`%c Attempting to work around HTML response...`, 'color: blue');
        console.log(`%c This might be a server routing issue - the JSON file is being processed as HTML.`, 'color: blue');
        
        // Report the issue for troubleshooting
        console.log('HTML received instead of JSON. First 200 characters:');
        console.log(result.rawText.substring(0, 200) + '...');
        
        return { 
          courseId, 
          valid: false, 
          error: result.message, 
          contentType: result.contentType,
          suggestions: [
            "Add explicit Content-Type header for .json files in server config",
            "Check that redirects for /mathigon/content/* are configured correctly",
            "Verify that the content.json file exists and is valid"
          ]
        };
      }
      
      return { 
        courseId, 
        valid: false, 
        error: result.message,
        contentType: result.contentType 
      };
    }
  }
  
  /**
   * Run validation tests for all course JSON files
   */
  async function validateAllCourseJson() {
    const results = [];
    
    for (const courseId of COURSE_IDS) {
      const result = await validateCourseJson(courseId);
      results.push(result);
    }
    
    // Overall summary
    const validCount = results.filter(r => r.valid).length;
    const totalCount = COURSE_IDS.length;
    
    console.log('\n');
    
    if (validCount === totalCount) {
      console.log('%c ✅ All course JSON files are valid!', 'background: green; color: white; font-size: 1.2em; padding: 5px;');
    } else {
      console.log(`%c ❌ ${totalCount - validCount} out of ${totalCount} course JSON files have issues.`, 'background: red; color: white; font-size: 1.2em; padding: 5px;');
      
      const firstInvalid = results.find(r => !r.valid);
      if (firstInvalid && firstInvalid.suggestions) {
        console.log('%c Suggestions to fix the issues:', 'font-weight: bold');
        firstInvalid.suggestions.forEach((suggestion, index) => {
          console.log(`${index + 1}. ${suggestion}`);
        });
      }
    }
    
    return results;
  }
  
  /**
   * Check if the Netlify configuration is correct for serving JSON files
   */
  function checkNetlifyConfig() {
    console.log('%c Checking for common Netlify configuration issues...', 'color: blue; font-weight: bold;');
    
    // Look for netlify.toml
    fetch('/netlify.toml')
      .then(response => {
        if (!response.ok) {
          console.log('Could not check netlify.toml - file not accessible');
          return null;
        }
        return response.text();
      })
      .then(text => {
        if (!text) return;
        
        // Simple checks for common issues
        const hasJsonContentType = text.includes('for = "/mathigon/content/*/*.json"') && 
                                   text.includes('Content-Type = "application/json');
        
        const hasJsonRedirect = text.includes('from = "/mathigon/content/*/*.json"') && 
                                text.includes('force = true');
        
        if (!hasJsonContentType) {
          console.warn('%c ⚠️ netlify.toml may be missing Content-Type headers for JSON files', 'color: orange');
          console.log('Suggested fix: Add appropriate Content-Type headers for JSON files');
        }
        
        if (!hasJsonRedirect) {
          console.warn('%c ⚠️ netlify.toml may be missing proper redirects for JSON files', 'color: orange');
          console.log('Suggested fix: Add explicit redirects for /mathigon/content/*/*.json');
        }
        
        if (hasJsonContentType && hasJsonRedirect) {
          console.log('%c ✓ netlify.toml appears to have correct JSON configuration', 'color: green');
        }
      })
      .catch(err => {
        console.log('Could not check netlify.toml:', err.message);
      });
  }
  
  // Create a test file download function
  function createManualJsonFile(courseId) {
    // Create a minimal valid course JSON
    const minimalJson = {
      sections: [
        {
          id: "intro",
          title: "Introduction",
          content: "This is a minimal placeholder content created by the validator."
        }
      ]
    };
    
    const jsonString = JSON.stringify(minimalJson, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseId}-content.json`;
    a.textContent = `Download ${courseId} placeholder JSON`;
    a.style.display = 'block';
    a.style.margin = '10px 0';
    a.style.color = 'blue';
    
    // Add to the document
    document.body.appendChild(a);
    
    return a;
  }
  
  // Expose functions to global scope
  window.mathigonJsonValidator = {
    validateAll: validateAllCourseJson,
    validateCourse: validateCourseJson,
    checkNetlifyConfig: checkNetlifyConfig,
    createPlaceholder: createManualJsonFile
  };
  
  // Run checks if hash parameter is present
  if (window.location.hash === '#validate-json') {
    setTimeout(() => {
      validateAllCourseJson();
      checkNetlifyConfig();
    }, 1000);
  }
  
  console.log('Mathigon JSON validator loaded.');
  console.log('Run window.mathigonJsonValidator.validateAll() to check all course JSON files.');
  console.log('Run window.mathigonJsonValidator.checkNetlifyConfig() to check Netlify configuration.');
})(); 