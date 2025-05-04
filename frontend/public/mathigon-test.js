/**
 * Mathigon Diagnostic Script
 * This script helps diagnose issues with Mathigon loading
 */

(function() {
  console.log('Mathigon Diagnostic Script Loaded');
  
  // Check if Mathigon global object exists
  if (typeof window.Mathigon === 'undefined') {
    console.error('❌ Mathigon global object not available');
    appendToBody('❌ Mathigon global object not available');
    return;
  } else {
    console.log('✅ Mathigon global object available');
    appendToBody('✅ Mathigon global object available');
  }
  
  // Check for TextbookLoader
  if (typeof window.Mathigon.TextbookLoader === 'undefined') {
    console.error('❌ TextbookLoader not available');
    appendToBody('❌ TextbookLoader not available');
    
    // List available Mathigon properties
    const properties = Object.keys(window.Mathigon);
    console.log('Available Mathigon properties:', properties);
    appendToBody(`Available properties: ${properties.join(', ')}`);
  } else {
    console.log('✅ TextbookLoader available');
    appendToBody('✅ TextbookLoader available');
  }
  
  // Check global configuration
  if (typeof window.mathigonConfig === 'undefined') {
    console.warn('⚠️ mathigonConfig not defined');
    appendToBody('⚠️ mathigonConfig not defined');
  } else {
    console.log('✅ mathigonConfig defined:', window.mathigonConfig);
    appendToBody(`✅ mathigonConfig defined with paths:
      - assetsPrefix: ${window.mathigonConfig.assetsPrefix}
      - contentPrefix: ${window.mathigonConfig.contentPrefix}`);
  }
  
  // Check courseId
  if (typeof window.courseId === 'undefined') {
    console.warn('⚠️ courseId not defined');
    appendToBody('⚠️ courseId not defined');
  } else {
    console.log('✅ courseId defined:', window.courseId);
    appendToBody(`✅ courseId defined: ${window.courseId}`);
  }
  
  // Check content access
  if (window.courseId) {
    fetch(`/mathigon/content/${window.courseId}/content.json`)
      .then(response => {
        if (response.ok) {
          console.log(`✅ Content for ${window.courseId} is accessible`);
          appendToBody(`✅ Content for ${window.courseId} is accessible`);
          return response.json();
        } else {
          console.error(`❌ Content for ${window.courseId} returned ${response.status}`);
          appendToBody(`❌ Content for ${window.courseId} returned ${response.status}`);
          throw new Error(`Content access failed with status ${response.status}`);
        }
      })
      .then(data => {
        console.log(`✅ Content JSON parsed successfully with ${data.sections?.length || 0} sections`);
        appendToBody(`✅ Content JSON parsed with ${data.sections?.length || 0} sections`);
      })
      .catch(error => {
        console.error('❌ Content access error:', error);
        appendToBody(`❌ Content access error: ${error.message}`);
      });
  }
  
  // Try to initialize a TextbookLoader if possible
  if (window.Mathigon && window.Mathigon.TextbookLoader && window.courseId) {
    try {
      // Create a container for test initialization
      const container = document.createElement('div');
      container.id = 'mathigon-test-container';
      container.style.display = 'none';
      document.body.appendChild(container);
      
      // Try to create a loader instance
      const testLoader = new window.Mathigon.TextbookLoader({
        courseId: window.courseId,
        container: '#mathigon-test-container',
        sourcePrefix: '/mathigon/content/',
        assetsPrefix: '/mathigon/assets/'
      });
      
      console.log('✅ TextbookLoader instance created successfully');
      appendToBody('✅ TextbookLoader instance created successfully');
      
      // Don't initialize it to avoid affecting the main page
    } catch (error) {
      console.error('❌ Error creating TextbookLoader instance:', error);
      appendToBody(`❌ Error creating TextbookLoader: ${error.message}`);
    }
  }
  
  // Helper function to append diagnostic messages to body
  function appendToBody(message) {
    // Create the diagnostic container if it doesn't exist
    let diagnosticEl = document.getElementById('mathigon-diagnostics');
    if (!diagnosticEl) {
      diagnosticEl = document.createElement('div');
      diagnosticEl.id = 'mathigon-diagnostics';
      diagnosticEl.style.position = 'fixed';
      diagnosticEl.style.bottom = '10px';
      diagnosticEl.style.left = '10px';
      diagnosticEl.style.zIndex = '9999';
      diagnosticEl.style.background = 'rgba(255, 255, 255, 0.9)';
      diagnosticEl.style.padding = '10px';
      diagnosticEl.style.border = '1px solid #ccc';
      diagnosticEl.style.borderRadius = '5px';
      diagnosticEl.style.maxWidth = '80%';
      diagnosticEl.style.maxHeight = '50%';
      diagnosticEl.style.overflow = 'auto';
      diagnosticEl.style.fontFamily = 'monospace';
      diagnosticEl.style.fontSize = '12px';
      
      const header = document.createElement('div');
      header.textContent = 'Mathigon Diagnostics';
      header.style.fontWeight = 'bold';
      header.style.marginBottom = '5px';
      header.style.borderBottom = '1px solid #ccc';
      diagnosticEl.appendChild(header);
      
      document.body.appendChild(diagnosticEl);
    }
    
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.margin = '3px 0';
    
    if (message.startsWith('❌')) {
      messageEl.style.color = 'red';
    } else if (message.startsWith('✅')) {
      messageEl.style.color = 'green';
    } else if (message.startsWith('⚠️')) {
      messageEl.style.color = 'orange';
    }
    
    diagnosticEl.appendChild(messageEl);
  }
})(); 