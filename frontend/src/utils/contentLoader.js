/**
 * Enhanced Content Loader Utility
 * 
 * This utility parses content using Mathigon's format from content and translations directories,
 * transforming the special markdown format into React components.
 * 
 * It now loads content directly from the filesystem structure in the content and translations directories.
 */

// Utility functions for parsing Mathigon markdown format
const parseMathigonMd = (content) => {
  if (!content) return { metadata: {}, html: '' };
  
  // Extract metadata from content
  const metadata = {};
  const metadataRegex = /> ([\w-]+): (.+)/g;
  let match;
  while ((match = metadataRegex.exec(content)) !== null) {
    metadata[match[1]] = match[2];
  }
  
  // Convert sections
  let html = content
    // Process section headers
    .replace(/## ([^\n]+)\n\n> section: ([^\n]+)/g, '<h2 id="$2">$1</h2><div class="section" data-section="$2">')
    // Process subsection markers
    .replace(/> id: ([^\n]+)/g, '<div class="subsection" id="$1">')
    
    // Process column layouts
    .replace(/::: column\(width=(\d+)\)/g, '<div class="column" style="width: $1px;">')
    .replace(/::: column\.grow/g, '<div class="column grow">')
    .replace(/:::/g, '</div>')
    
    // Process images with full path resolution
    .replace(/x-img\(src="([^"]+)" width=(\d+) height=(\d+)\)/g, (match, src, width, height) => {
      // Check if it's a relative path and construct proper URL
      if (src.startsWith('./') || !src.startsWith('http')) {
        const baseUrl = '/assets/';
        src = `${baseUrl}${src.replace('./', '')}`;
      }
      return `<img src="${src}" width="${width}" height="${height}" class="mathigon-image" />`;
    })
    
    // Process gloss terms
    .replace(/\[__([^_]+)__\]\(gloss:([^\)]+)\)/g, '<span class="term" data-gloss="$2">$1</span>')
    
    // Process all interactive elements types
    .replace(/x-geopad\(([^\)]+)\)/g, '<div class="interactive-element geopad" data-params="$1"><div class="placeholder-text">Interactive Geometry</div></div>')
    .replace(/x-coordinate-system\(([^\)]+)\)/g, '<div class="interactive-element graph" data-params="$1"><div class="placeholder-text">Interactive Graph</div></div>')
    .replace(/x-slider\(([^\)]+)\)/g, '<div class="interactive-element slider" data-params="$1"><div class="placeholder-text">Interactive Slider</div></div>')
    .replace(/x-equation\(([^\)]+)\)/g, '<div class="interactive-element equation" data-params="$1"><div class="placeholder-text">Interactive Equation</div></div>')
    .replace(/x-sortable\(([^\)]+)\)/g, '<div class="interactive-element sortable" data-params="$1"><div class="placeholder-text">Drag and Sort</div></div>')
    .replace(/x-gesture\(([^\)]+)\)/g, '<div class="interactive-element gesture" data-params="$1"><div class="placeholder-text">Draw Here</div></div>')
    .replace(/x-picker\(([^\)]+)\)/g, '<div class="interactive-element picker" data-params="$1"><div class="placeholder-text">Multiple Choice</div></div>')
    .replace(/x-quizzes\(([^\)]+)\)/g, '<div class="interactive-element quiz" data-params="$1"><div class="placeholder-text">Quiz</div></div>')
    .replace(/x-code\(([^\)]+)\)/g, '<div class="interactive-element code" data-params="$1"><div class="placeholder-text">Code Editor</div></div>')
    .replace(/x-simulation\(([^\)]+)\)/g, '<div class="interactive-element simulation" data-params="$1"><div class="placeholder-text">Interactive Simulation</div></div>')
    
    // Process step blocks and tabs
    .replace(/{step.*?}/g, '<div class="step-block">')
    .replace(/{:\/step}/g, '</div>')
    .replace(/{tab.*?}/g, '<div class="tab-content">')
    .replace(/{:\/tab}/g, '</div>')
    
    // Process math expressions
    .replace(/\${2}([^$]+)\${2}/g, '<span class="math-block">$1</span>')
    .replace(/\$([^$\n]+)\$/g, '<span class="math-inline">$1</span>')
    
    // Process basic markdown
    .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    
    // Convert unordered lists
    .replace(/^\* (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
    
    // Convert ordered lists
    .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ol>$&</ol>');
  
  return { metadata, html };
};

// Function to generate glossary tooltip content
const glossaryTerms = {
  'circle': 'A shape where all points are the same distance from the center.',
  'angle': 'The amount of rotation between two lines that share a common endpoint.',
  'right-angle': 'An angle that measures exactly 90 degrees.',
  'perpendicular': 'Two lines that intersect at a right angle.',
  'parallel': 'Lines or planes that never intersect.',
  'polygon': 'A closed shape with straight sides.',
  'triangle': 'A polygon with three sides.',
  'rectangle': 'A quadrilateral with four right angles.',
  'square': 'A rectangle with all sides equal.',
  'radius': 'The distance from the center of a circle to any point on the circle.',
  'diameter': 'A straight line passing through the center of a circle.',
  'circumference': 'The perimeter or boundary line of a circle.',
  'concentric': 'Circles that share the same center point.',
  'inscribed': 'A shape drawn inside another shape, touching at multiple points.',
  'circumscribed': 'A shape drawn outside another shape, touching at multiple points.'
};

// Function to get glossary information
const getGlossaryContent = (id) => {
  return glossaryTerms[id] || `Definition for ${id} not found.`;
};

// Function to check if a file exists by path
// Function to check if a file exists on the server
const fileExists = async (path) => {
  try {
    // Use HEAD request to avoid downloading content
    const response = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/content/exists?path=${encodeURIComponent(path)}`, {
      method: 'HEAD'
    });
    
    return response.status === 200;
  } catch (error) {
    console.error(`Error checking if file exists at ${path}:`, error);
    return false;
  }
};

// Function to load content from markdown files
const loadContentFile = async (courseId) => {
  try {
    // Check if content directory exists
    const courseExists = await fileExists(`${courseId}`);
    
    if (!courseExists) {
      console.error(`Course directory not found: ${courseId}`);
      return null;
    }
    
    // Load course markdown content
    const contentPath = `${courseId}/content.md`;
    const contentExists = await fileExists(contentPath);
    
    if (contentExists) {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/content/${contentPath}`);
      const content = await response.text();
      return parseMathigonMd(content);
    }
    
    // Fallback to index.md if content.md doesn't exist
    const indexPath = `${courseId}/index.md`;
    const indexExists = await fileExists(indexPath);
    
    if (indexExists) {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/content/${indexPath}`);
      const content = await response.text();
      return parseMathigonMd(content);
    }
    
    console.error(`No content files found for course: ${courseId}`);
    return null;
  } catch (error) {
    console.error(`Error loading content for ${courseId}:`, error);
    return null;
  }
};

// Map of available courses from the content directory
// This will be dynamically generated based on the filesystem content
const availableCourses = [
  // This array will be populated from the server
  // No hardcoded courses
];

// Function to get AI assistant response based on course content
const getAssistantResponse = async (courseId, userMessage) => {
  try {
    // In a real implementation, this would call an AI service
    // For now, we'll return a simple response
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    // Check if we have message about specific terms
    for (const term of Object.keys(glossaryTerms)) {
      if (userMessage.toLowerCase().includes(term)) {
        return `${term}: ${getGlossaryContent(term)}`;
      }
    }
    
    return `I'm your learning assistant for this course. ${userMessage.endsWith('?') ? 'To answer your question, I recommend reviewing the current section.' : 'How can I help you understand this content better?'}`;
  } catch (error) {
    console.error('Error getting assistant response:', error);
    return "I'm sorry, I couldn't process your request. Please try again.";
  }
};

// Function to scan available courses from the content directory
const scanAvailableCourses = async () => {
  try {
    // Fetch courses from the main content directory only
    const contentResponse = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/content/courses`);
    
    // Check if the response is valid and is JSON
    if (!contentResponse.ok) {
      throw new Error(`Failed to fetch courses: ${contentResponse.status} ${contentResponse.statusText}`);
    }
    
    // Try to parse response as JSON with safety checks
    const contentType = contentResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response:', await contentResponse.text());
      return [];
    }
    
    // Reset available courses
    availableCourses.length = 0;
    
    // Process courses from content
    try {
      const data = await contentResponse.json();
      // Make sure we have a valid courses array
      const courses = data.courses || [];
      // Add each course to our list
      if (Array.isArray(courses)) {
        courses.forEach(course => {
          availableCourses.push(course);
        });
      } else {
        console.error('Invalid courses format:', courses);
      }
    } catch (error) {
      console.error('Error parsing course JSON:', error);
    }
    console.log(`Loaded ${availableCourses.length} courses from content directory`);
  } catch (error) {
    console.error('Error scanning courses:', error);
  }
};

// Call this when the app initializes to populate courses
scanAvailableCourses();

// Export utility functions
export const getCourseList = () => {
  return availableCourses;
};

export const getCourseById = (courseId) => {
  return availableCourses.find(course => course.id === courseId) || null;
};

export const getCourseContent = async (courseId) => {
  // Check if course exists
  const course = getCourseById(courseId);
  if (!course) return null;
  
  try {
    // Load content from the main API endpoint
    const path = `${import.meta.env.VITE_API_BASE || ''}/api/content/${courseId}`;
    
    try {
      const response = await fetch(path);
      if (response.ok) {
        const content = await response.json();
        return {
          course,
          content
        };
      }
    } catch (e) {
      console.log(`Failed to fetch content from ${path}`, e);
    }
    
    // If we get here, we couldn't find the content
    console.error(`Could not load content for course: ${courseId}`);
    return null;
  } catch (error) {
    console.error(`Error getting course content for ${courseId}:`, error);
    return null;
  }
};

export const getGlossaryDefinition = (term) => {
  return getGlossaryContent(term);
};

// Get available translations for a course
export const getAvailableTranslations = async (courseId) => {
  try {
    // Only need to check one path now
    const path = `/api/translations/${courseId}`;
    
    let translations = [{ code: 'en', name: 'English' }];
    
    try {
      const response = await fetch(path);
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          translations = result;
        }
      }
    } catch (e) {
      console.log(`Failed to fetch translations from ${path}`, e);
    }
    
    return translations;
  } catch (error) {
    console.error('Error getting available translations:', error);
    return [{ code: 'en', name: 'English' }];
  }
};

// Load translated content
export const loadTranslation = async (courseId, languageCode) => {
  try {
    if (languageCode === 'en') {
      // If English, just load the default content
      return await getCourseContent(courseId);
    }
    
    // Only need to check one path now
    const path = `/api/translations/${courseId}/${languageCode}`;
    
    try {
      const response = await fetch(path);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.log(`Failed to fetch translation from ${path}`, e);
    }
    
    // Fall back to English if translation not available
    console.log(`No translation available for ${courseId} in ${languageCode}, falling back to English`);
    return await getCourseContent(courseId);
  } catch (error) {
    console.error(`Error loading translation for ${languageCode}:`, error);
    return await getCourseContent(courseId);
  }
};

export { getAssistantResponse, parseMathigonMd };
