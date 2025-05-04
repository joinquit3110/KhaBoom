/**
 * Mathigon Markdown Parser
 * 
 * This utility parses content using Mathigon's custom markdown format
 * and transforms it into HTML components that can be rendered.
 * Based on documentation from markdown.md and setup.md.
 */

// Enhanced function to parse Mathigon markdown format
export const parseMathigonMd = (content) => {
  // Safely handle different types of content
  if (!content) return { metadata: {}, html: '', sections: [] };
  
  // Ensure content is a string
  if (typeof content !== 'string') {
    console.warn('Content is not a string:', typeof content);
    return {
      metadata: {},
      html: `<p>Error: Invalid content type (${typeof content})</p>`,
      sections: []
    };
  }
  
  try {
    // Extract metadata from content using the Mathigon format
    const metadata = {};
    const lines = content.split('\n');
    let contentStartIndex = 0;
    
    // Extract global metadata at the beginning of the file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('> ')) {
        // Parse metadata line (> key: value)
        const metaContent = line.substring(2).trim();
        const colonIndex = metaContent.indexOf(':');
        
        if (colonIndex > 0) {
          const key = metaContent.substring(0, colonIndex).trim();
          const value = metaContent.substring(colonIndex + 1).trim();
          metadata[key] = value;
        }
        
        contentStartIndex = i + 1;
      } else if (line.startsWith('#') || line !== '') {
        // Stop when we hit a non-metadata line
        break;
      }
    }
    
    // Extract sections based on Mathigon format (separated by ---)
    const sections = [];
    let currentSection = { content: '', metadata: {} };
    let inMetadata = false;
    let sectionContent = [];
    
    for (let i = contentStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Section separator
      if (line.trim() === '---') {
        // Save the current section if it has content
        if (sectionContent.length > 0) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
          
          // Reset for the next section
          currentSection = { content: '', metadata: {} };
          sectionContent = [];
          inMetadata = true;
        } else {
          inMetadata = true;
        }
        continue;
      }
      
      // Parse section metadata
      if (inMetadata && line.trim().startsWith('> ')) {
        const metaContent = line.substring(2).trim();
        const colonIndex = metaContent.indexOf(':');
        
        if (colonIndex > 0) {
          const key = metaContent.substring(0, colonIndex).trim();
          const value = metaContent.substring(colonIndex + 1).trim();
          currentSection.metadata[key] = value;
        }
      } else {
        // Once we hit non-metadata content, all future lines are content
        if (inMetadata) {
          inMetadata = false;
        }
        sectionContent.push(line);
      }
    }
    
    // Add the last section if it has content
    if (sectionContent.length > 0) {
      currentSection.content = sectionContent.join('\n');
      sections.push(currentSection);
    }
    
    // Process sections to generate HTML
    let fullHtml = '';
    const processedSections = sections.map((section, index) => {
      const sectionId = section.metadata.id || `section-${index}`;
      const sectionTitle = section.metadata.title || `Section ${index + 1}`;
      
      // Process content according to Mathigon's Markdown syntax
      const processedContent = processMathigonContent(section.content);
      
      // Create HTML for this section
      const sectionHtml = `
        <div class="mathigon-section" id="${sectionId}" data-section-id="${sectionId}">
          <div class="mathigon-content">
            ${processedContent}
          </div>
        </div>
      `;
      
      fullHtml += sectionHtml;
      
      return {
        id: sectionId,
        title: sectionTitle,
        content: processedContent,
        metadata: section.metadata
      };
    });
    
    return {
      metadata,
      html: fullHtml,
      sections: processedSections
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

// Process Mathigon markdown content according to their custom format
export const processMathigonContent = (content) => {
  if (!content) return '';
  
  try {
    // Process headings
    let processed = content
      // Process H1 and H2 headings
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      
      // Process bold and italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      
      // Process video embeds
      .replace(/\[vimeo:([^\]]+)\]/g, '<div class="video-container"><iframe src="https://player.vimeo.com/video/$1" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe></div>')
      .replace(/\[youtube:([^\]]+)\]/g, '<div class="video-container"><iframe src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe></div>')
      
      // Process links and special link types
      .replace(/\[([^\]]+)\]\(gloss:([^)]+)\)/g, '<span class="glossary-term" data-term="$2">$1</span>')
      .replace(/\[([^\]]+)\]\(bio:([^)]+)\)/g, '<span class="biography" data-person="$2">$1</span>')
      .replace(/\[([^\]]+)\]\(pill:([^)]+)\)/g, '<span class="pill pill-$2">$1</span>')
      .replace(/\[([^\]]+)\]\(action:([^)]+)\)/g, '<button class="action-button" data-action="$2">$1</button>')
      .replace(/\[([^\]]+)\]\((->[^)]+)\)/g, '<a class="target-pointer" href="$2">$1</a>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      
      // Process code and equations
      .replace(/`([^`]+)`/g, (match, p1) => {
        // Check if this is a code block with language specification
        if (p1.startsWith('{py}') || p1.startsWith('{js}') || p1.startsWith('{latex}')) {
          const langMatch = p1.match(/^\{([a-z]+)\}/);
          if (langMatch) {
            const language = langMatch[1];
            const code = p1.substring(langMatch[0].length);
            return `<code class="language-${language}">${code}</code>`;
          }
        }
        // Otherwise treat as AsciiMath (will be converted to MathML)
        return `<span class="math">${p1}</span>`;
      })
      
      // Process input fields and multiple choice (double brackets)
      .replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
        // Check if it's a multiple choice (contains pipe characters)
        if (p1.includes('|')) {
          const choices = p1.split('|').map(c => c.trim());
          return `<span class="multiple-choice" data-choices="${choices.join(',')}">${choices[0]}</span>`;
        }
        
        // Check if it has a range (contains ±)
        if (p1.includes('±')) {
          const parts = p1.split('±').map(p => p.trim());
          const value = parts[0];
          const range = parts[1] || '0';
          return `<span class="input-field" data-value="${value}" data-range="${range}">${value}</span>`;
        }
        
        // Check if it has hints (contains parentheses)
        const hintMatch = p1.match(/^([^(]+)(\(.*\))$/);
        if (hintMatch) {
          const value = hintMatch[1].trim();
          const hint = hintMatch[2];
          return `<span class="input-field" data-value="${value}" data-hint="${hint}">${value}</span>`;
        }
        
        // Simple input field
        return `<span class="input-field" data-value="${p1.trim()}">${p1.trim()}</span>`;
      })
      
      // Process variable expressions with sliders ${var}{var|2|-8,8,2}
      .replace(/\${([^}]+)}\{([^}]+)\}/g, (match, variable, sliderData) => {
        const parts = sliderData.split('|');
        if (parts.length >= 2) {
          const varName = parts[0];
          const initialValue = parts[1];
          const rangeData = parts[2] || '0,10,1';
          
          return `<span class="variable-slider" 
                    data-var="${varName}" 
                    data-value="${initialValue}" 
                    data-range="${rangeData}">${initialValue}</span>`;
        }
        return match;
      })
      
      // Process variable expressions ${expr}
      .replace(/\${([^}]+)}/g, '<span class="variable-expression" data-expr="$1">$1</span>')
      
      // Process block elements (:::)
      .replace(/:::\s+([^\n]+)([\s\S]*?):::/g, (match, blockHeader, blockContent) => {
        const classMatch = blockHeader.match(/\.([a-zA-Z0-9-_]+)/g);
        const idMatch = blockHeader.match(/#([a-zA-Z0-9-_]+)/g);
        const classes = classMatch ? classMatch.map(c => c.substring(1)).join(' ') : '';
        const id = idMatch ? idMatch[0].substring(1) : '';
        
        return `<div class="${classes}" id="${id}">${blockContent}</div>`;
      })
      
      // Process custom attributes {.class#id(attr="value")} for paragraphs
      .replace(/\{([^}]+)\}\s+([^\n]+)/g, (match, attributes, content) => {
        const classMatch = attributes.match(/\.([a-zA-Z0-9-_]+)/g);
        const idMatch = attributes.match(/#([a-zA-Z0-9-_]+)/g);
        const attrMatch = attributes.match(/\(([^)]+)\)/g);
        
        const classes = classMatch ? classMatch.map(c => c.substring(1)).join(' ') : '';
        const id = idMatch ? idMatch[0].substring(1) : '';
        
        let attrStr = '';
        if (attrMatch) {
          attrMatch.forEach(attr => {
            const attrContent = attr.substring(1, attr.length - 1);
            const parts = attrContent.split('=');
            if (parts.length === 2) {
              attrStr += ` ${parts[0]}=${parts[1]}`;
            }
          });
        }
        
        return `<p class="${classes}" id="${id}"${attrStr}>${content}</p>`;
      })
      
      // Process paragraphs (skip lines that start with HTML tags)
      .replace(/^(?!<[a-z][^>]*>)([^\n]+)$/gm, '<p>$1</p>')
      
      // Process emojis :emoji:
      .replace(/:([a-z_-]+):/g, '<span class="emoji">$1</span>');
    
    return processed;
  } catch (error) {
    console.error('Error processing Mathigon content:', error);
    return `<p>Error processing content: ${error.message}</p>`;
  }
};

// Export the parser functions
export default { parseMathigonMd, processMathigonContent }; 