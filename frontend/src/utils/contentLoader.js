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
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    // Process lists
    .replace(/^\* (.*)$/gm, '<li>$1</li>')
    
    // Wrap lists in ul tags (simple approach)
    .replace(/<li>(.*\n)+?(?=\n|$)/g, match => `<ul>${match}</ul>`)
    
    // Process paragraphs (non-HTML content)
    .replace(/^([^<\n].*?)(?=\n|$)/gm, '<p>$1</p>')
    
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '');
  
  return { metadata, html };
};

// Function to generate glossary tooltip content
const glossaryTerms = {
  'circle': 'A shape where all points are the same distance from the center.',
  'compass': 'A tool used to draw circles by keeping one arm fixed at the center and rotating the other arm which holds a pencil.',
  'radius': 'The distance from the center of a circle to any point on its edge.',
  'diameter': 'A straight line passing through the center of a circle and connecting two points on its edge.',
  'circumference': 'The distance around the edge of a circle.',
  'pi': 'The ratio of a circle\'s circumference to its diameter, approximately 3.14159...',
  'tangent': 'A line that touches a circle at exactly one point.',
  'arc': 'A portion of the circumference of a circle.',
  'sector': 'A portion of a circle bounded by two radii and an arc.',
  'chord': 'A line segment whose endpoints lie on a circle.',
  'concentric': 'Circles that share the same center point.',
  'inscribed': 'A shape drawn inside another shape, touching at multiple points.',
  'circumscribed': 'A shape drawn outside another shape, touching at multiple points.'
};

// Function to get glossary information
const getGlossaryContent = (id) => {
  return glossaryTerms[id] || 'Definition not available';
};

// Function to check if a file exists by path
// Function to check if a file exists on the server
const fileExists = async (path) => {
  try {
    // First check if the course ID is in our predefined list
    const courseId = path.split('/').filter(p => p).pop();
    if (availableCourses.some(c => c.id === courseId)) {
      return true;
    }
    
    // Check both in main content directory and learned content directory
    const checkPaths = [
      `/api/content/exists?path=${encodeURIComponent(path)}`,
      `/api/content/exists?path=${encodeURIComponent(`learned/textbooks-master/${path}`)}`
    ];
    
    // Try both paths
    for (const checkPath of checkPaths) {
      const response = await fetch(checkPath, { method: 'HEAD' });
      if (response.ok) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
};

// Function to load content from markdown files
const loadContentFile = async (courseId) => {
  try {
    // Try to load the actual course content from the server
    const response = await fetch(`/api/content/${courseId}`);
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fall back to hardcoded content if server request fails
    if (courseId === 'circles') {
      return circlesContent;
    }
    
    // For other courses, return a default structure with placeholder content
    const course = availableCourses.find(c => c.id === courseId);
    if (!course) return null;
    
    return {
      sections: [
        {
          id: 'introduction',
          title: 'Introduction',
          content: `<p>This is placeholder content for the ${course.title} course.</p>`
        }
      ]
    };
  } catch (error) {
    console.error('Error loading content file:', error);
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
const getAssistantResponse = (courseId, userMessage) => {
  const course = availableCourses.find(c => c.id === courseId);
  if (!course) return "I'm sorry, I don't have information about that course.";
  
  // Convert user message to lowercase for easier matching
  const lowerMessage = userMessage.toLowerCase();
  
  // Generic responses based on course title - these will work with any course
  // Default responses if no specific content match is found
  const defaultResponses = [
    `That's an interesting question about ${course.title}! Could you be more specific about which aspect you'd like to learn about?`,
    `I'd be happy to help you learn more about ${course.title}. Try exploring the interactive elements in the course to see how these concepts work in practice.`,
    `In ${course.title}, we focus on understanding the fundamental principles and their applications. Is there a particular concept you're finding challenging?`,
    `Great question! As you progress through the ${course.title} course, you'll discover how these ideas connect to many other areas of mathematics and science.`,
    `I suggest working through the examples in the ${course.title} course step by step. The interactive demonstrations can really help build your intuition.`
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Function to scan available courses from the content directory
const scanAvailableCourses = async () => {
  try {
    // Fetch courses from both content directories
    const mainContentResponse = await fetch('/api/content/courses');
    const learnedContentResponse = await fetch('/api/content/courses/learned');
    
    const mergedCourses = [...availableCourses];
    
    // Process courses from main content
    if (mainContentResponse.ok) {
      const mainCourses = await mainContentResponse.json();
      processCourses(mainCourses, mergedCourses);
    }
    
    // Process courses from learned content
    if (learnedContentResponse.ok) {
      const learnedCourses = await learnedContentResponse.json();
      processCourses(learnedCourses, mergedCourses);
    }
    
    // Replace our availableCourses array with the merged data
    availableCourses.length = 0;
    availableCourses.push(...mergedCourses);
    
    console.log(`Loaded ${availableCourses.length} courses in total`);
  } catch (error) {
    console.error('Error scanning courses:', error);
  }
};

// Helper function to process and merge courses
const processCourses = (coursesToAdd, mergedCourses) => {
  coursesToAdd.forEach(course => {
    const existingIndex = mergedCourses.findIndex(c => c.id === course.id);
    
    if (existingIndex >= 0) {
      // Update existing course with new data
      mergedCourses[existingIndex] = {
        ...mergedCourses[existingIndex],
        ...course
      };
    } else {
      // Add new course
      mergedCourses.push(course);
    }
  });
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
    const path = `/api/content/${courseId}`;
    
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

export { getAssistantResponse };
