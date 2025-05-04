/**
 * Mathigon Markdown Parser
 * 
 * This utility directly renders Mathigon markdown format exactly like the original textbooks
 */

// Direct raw renderer function for Mathigon content
export const parseMathigonMd = (content) => {
  if (!content) return { metadata: {}, html: '', sections: [] };
  
  try {
    // Extract metadata for organizational purposes only
    const metadata = {};
    const lines = content.split('\n');
    const sections = [];
    
    // Process the entire content as direct raw HTML
    let htmlContent = '';
    
    // Process line by line to keep exact formatting
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('> ')) {
        // Render metadata directly as raw text
        htmlContent += `<div class="meta-line">${line}</div>`;
        
        // Also extract metadata for component use
        const metaContent = line.substring(2).trim();
        const colonIndex = metaContent.indexOf(':');
        if (colonIndex > 0) {
          const key = metaContent.substring(0, colonIndex).trim();
          const value = metaContent.substring(colonIndex + 1).trim();
          metadata[key] = value;
          
          // If this is a section ID, track it for navigation
          if (key === 'id') {
            sections.push({
              id: value,
              title: value,
              content: '',
              metadata: { id: value }
            });
          }
        }
      } else if (line.trim() === '---') {
        // Render section separators
        htmlContent += '<hr class="section-separator">';
      } else if (line.trim().startsWith('x-')) {
        // Render x-components directly
        htmlContent += `<div class="${line.trim()}">${line}</div>`;
      } else if (line.trim().startsWith('.item')) {
        // Handle .item SVG includes
        
        const match = line.trim().match(/\.item(?:\(([^)]+)\))?: include svg\/([^\/]+)\/([^\.]+)\.svg/);
        if (match) {
          const attributes = match[1] || '';
          const folder = match[2];
          const filename = match[3];
          
          // Generate image tag that loads from our copied SVGs
          htmlContent += `<div class="image-include">
            <img src="/mathigon-assets/svg/${folder}/${filename}.svg" 
                 alt="${filename}" 
                 class="svg-include ${attributes}" 
                 data-folder="${folder}" 
                 data-file="${filename}" />
          </div>`;
        } else {
          // Just render as original text if pattern doesn't match
          htmlContent += `<div class="item-line">${line}</div>`;
        }
      } else {
        // Process normal markdown
        let processedLine = line;
        
        // Very basic line processing
        if (line.trim().startsWith('# ')) {
          processedLine = `<h1>${line.substring(2)}</h1>`;
        } else if (line.trim().startsWith('## ')) {
          processedLine = `<h2>${line.substring(3)}</h2>`;
        } else if (line.trim().startsWith('### ')) {
          processedLine = `<h3>${line.substring(4)}</h3>`;
        } else if (line.trim().length > 0 && !line.trim().startsWith('<')) {
          // Wrap non-empty, non-HTML lines in paragraph tags
          processedLine = `<p>${processedLine}</p>`;
        }
        
        htmlContent += processedLine;
      }
      
      // Add newline to maintain original formatting
      htmlContent += '\n';
    }
    
    // Load Mathigon's original scripts and augment for SVG handling
    htmlContent += `
      <script>
        // Attempt to load the original Mathigon scripts
        try {
          // Load the course.js script
          const script = document.createElement('script');
          script.src = '/mathigon-assets/js/course.js';
          document.body.appendChild(script);
          
          // Add custom script to handle x-picker components
          const pickerScript = document.createElement('script');
          pickerScript.textContent = \`
            document.addEventListener('DOMContentLoaded', () => {
              // Handle x-picker components
              const pickers = document.querySelectorAll('div[class^="x-picker"]');
              pickers.forEach(picker => {
                // Find all associated item elements
                const items = document.querySelectorAll('.svg-include');
                let selectedItem = null;
                
                // Add click handlers to the items
                items.forEach(item => {
                  item.style.cursor = 'pointer';
                  item.addEventListener('click', () => {
                    // Deselect previous item
                    if (selectedItem) {
                      selectedItem.style.border = 'none';
                    }
                    
                    // Select this item
                    item.style.border = '2px solid #0077cc';
                    selectedItem = item;
                    
                    // Check if it's correct
                    const isCorrect = !item.classList.contains('data-error');
                    if (isCorrect) {
                      item.style.backgroundColor = 'rgba(0, 200, 0, 0.2)';
                    } else {
                      item.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                    }
                  });
                });
              });
              
              // Handle x-gesture components
              const gestures = document.querySelectorAll('div[class^="x-gesture"]');
              gestures.forEach(gesture => {
                // Get target item ID
                const targetMatch = gesture.textContent.match(/target="([^"]+)"/);
                if (targetMatch) {
                  const targetId = targetMatch[1];
                  const targetElem = document.querySelector(\`[id="\${targetId}"]\`);
                  if (targetElem) {
                    targetElem.style.border = '2px dashed #aaa';
                  }
                }
              });
            });
          \`;
          document.body.appendChild(pickerScript);
        } catch (e) {
          console.warn('Could not load original Mathigon scripts:', e);
        }
      </script>
    `;
    
    return {
      metadata,
      html: htmlContent,
      sections: sections.length > 0 ? sections : [{ id: 'default', title: 'Content', content: htmlContent }]
    };
  } catch (error) {
    console.error('Error parsing Mathigon markdown:', error);
    return {
      metadata: {},
      html: `<p>Error parsing content: ${error.message}</p>`,
      sections: []
    };
  }
};

// Simple processing function for minimal content transformation
export const processMathigonContent = (content) => {
  // Return content with minimal transformation to match original format
  return content || '';
};

// Export the parser functions
export default { parseMathigonMd, processMathigonContent }; 