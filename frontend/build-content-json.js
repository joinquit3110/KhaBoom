/**
 * build-content-json.js
 * 
 * This script converts Mathigon Markdown content files to JSON format
 * Mathigon's course.js expects content.json files, not content.md
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory where content files are located
const CONTENT_DIR = path.join(__dirname, 'public', 'mathigon', 'content');

/**
 * Simple Mathigon Markdown to JSON parser
 * This is a simplified version that handles basic structure
 */
function parseMathigonMarkdown(markdown) {
  // Split content by sections (separated by ---)
  const sections = markdown.split(/^---$/m).filter(s => s.trim());
  
  // Extract metadata and parse it
  const result = {
    sections: []
  };
  
  // Process each section
  sections.forEach((section, index) => {
    // Extract metadata (lines starting with >)
    const metadataLines = section.match(/^>\s+.*$/gm) || [];
    const contentLines = section.split('\n').filter(line => !line.startsWith('>')).join('\n');
    
    // Parse metadata
    const metadata = {};
    metadataLines.forEach(line => {
      const match = line.match(/^>\s+([\w-]+):\s*(.*)/);
      if (match) {
        const [, key, value] = match;
        metadata[key] = value.trim();
      }
    });
    
    // Chapter heading
    const titleMatch = contentLines.match(/^#\s+([^\n]+)/);
    if (titleMatch && index === 0) {
      result.title = titleMatch[1].trim();
    }
    
    // Handle chapter headings (##)
    const chapterMatch = contentLines.match(/^##\s+([^\n]+)/);
    if (chapterMatch) {
      metadata.title = chapterMatch[1].trim();
    }
    
    // Add to sections
    result.sections.push({
      ...metadata,
      content: contentLines.trim()
    });
  });
  
  return result;
}

/**
 * Recursively process all content directories
 */
async function processDirectory(dir) {
  console.log(`Processing directory: ${dir}`);
  
  try {
    const entries = await fs.readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry === 'content.md') {
        try {
          console.log(`Converting ${fullPath} to JSON...`);
          
          // Read markdown content
          const markdown = await fs.readFile(fullPath, 'utf-8');
          
          // Parse to JSON structure
          const jsonContent = parseMathigonMarkdown(markdown);
          
          // Write JSON file
          const jsonPath = path.join(dir, 'content.json');
          await fs.writeFile(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf-8');
          
          console.log(`Created ${jsonPath}`);
        } catch (err) {
          console.error(`Error processing ${fullPath}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
}

// Start processing
console.log(`Starting conversion from: ${CONTENT_DIR}`);
processDirectory(CONTENT_DIR)
  .then(() => {
    console.log('All content.md files have been converted to content.json');
  })
  .catch(err => {
    console.error('Error processing content directories:', err);
  }); 