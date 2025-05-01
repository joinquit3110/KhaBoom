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
  // Safely handle different types of content
  if (!content) return { metadata: {}, html: '' };
  
  // If content is already a structured object, return it as is
  if (typeof content === 'object' && !Array.isArray(content)) {
    return content;
  }
  
  // Ensure content is a string to avoid 'includes is not a function' error
  if (typeof content !== 'string') {
    console.warn('Content is not a string or object:', typeof content);
    // Return a safe fallback object
    return {
      metadata: {},
      html: `<p>Error: Received invalid content type (${typeof content})</p>`
    };
  }
  
  // Extract metadata from content
  const metadata = {};
  const metadataRegex = /> ([\w-]+): (.+)/g;
  let match;
  while ((match = metadataRegex.exec(content)) !== null) {
    metadata[match[1]] = match[2];
  }
  
  // If content is already HTML, just return it with minimal processing
  if (content.includes('<h1>') || content.includes('<div class="section">')) {
    // Just do minimal processing for HTML content
    return { metadata, html: content };
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
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
    
    // Process paragraphs (avoid wrapping existing HTML elements)
    .replace(/^(?!<[a-z]).+/gm, '<p>$&</p>');
  
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
// This will be dynamically generated based on the filesystem content with hardcoded fallback
// Only keeping minimal fallback courses in case API fails completely
const availableCourses = [
  // One fallback course as an example
  {
    id: 'probability',
    title: 'Introduction to Probability',
    description: 'Learn about randomness, games, and chance',
    color: '#CD0E66',
    level: 'Foundations',
    category: 'Statistics',
    thumbnail: '/api/content/probability/icon.png',
    sections: [
      { id: 'intro', title: 'Introduction' }
    ]
  }
];

// Function to generate correct thumbnail URLs that include the API base
const generateThumbnailUrl = (courseId) => {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  return `${apiBase}/content/${courseId}/icon.png`;
};

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
    console.log('Attempting to fetch courses from API...');
    console.log('Current environment:', import.meta.env.MODE);
    console.log('API Base URL:', import.meta.env.VITE_API_BASE || 'Not set');
    console.log('Available courses before scan:', availableCourses.length);
    
    // Use the specific scan endpoint for enhanced course information
    const apiUrl = `${import.meta.env.VITE_API_BASE || ''}/api/content/scan`;
    console.log('API URL:', apiUrl);
    
    const contentResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    // Handle response
    if (!contentResponse.ok) {
      console.error(`Failed to scan courses: ${contentResponse.status} ${contentResponse.statusText}`);
      // Don't throw, continue with hardcoded fallback courses
    } else {
      try {
        const responseText = await contentResponse.text();
        console.log('API Response:', responseText);
        
        // Parse the JSON response
        const data = JSON.parse(responseText);
        
        if (data && Array.isArray(data.courses) && data.courses.length > 0) {
          // Success! Clear existing courses and add the new ones
          console.log(`Found ${data.courses.length} courses from API`);
          availableCourses.length = 0;
          
          // Process and add each course
          data.courses.forEach(course => {
            // Make sure each course has the required fields
            if (course && course.id) {
              // Add default values for any missing fields
              const processedCourse = {
                id: course.id,
                title: course.title || `Course ${course.id}`,
                description: course.description || 'No description available',
                color: course.color || getRandomColor(),
                level: course.level || 'Intermediate',
                category: course.category || 'Mathematics',
                thumbnail: generateThumbnailUrl(course.id),
                sections: course.sections || [{ id: 'default', title: 'Introduction' }]
              };
              
              availableCourses.push(processedCourse);
            }
          });
          
          console.log(`Loaded ${availableCourses.length} courses from API`);
          return; // Successfully loaded courses from API
        } else {
          console.error('Invalid or empty courses data:', data);
        }
      } catch (parseError) {
        console.error('Error parsing course data:', parseError);
      }
    }
    
    // If we reach here, something went wrong with API or parsing
    // Fallback to local directory scanning if available
    console.log('API fetch failed, trying to scan content directory directly...');
    
    try {
      // Attempt to scan content directory directly using a different API endpoint
      console.log('Using fallback courses endpoint...');
      const fallbackUrl = `${import.meta.env.VITE_API_BASE || ''}/api/content/courses`;
      console.log('Fallback URL:', fallbackUrl);
      
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (fallbackResponse.ok) {
        const responseText = await fallbackResponse.text();
        console.log('Fallback Response:', responseText);
        
        try {
          const coursesData = JSON.parse(responseText);
          if (Array.isArray(coursesData) && coursesData.length > 0) {
            // Success! Clear existing courses and add the new ones from content directory
            console.log(`Found ${coursesData.length} courses from fallback endpoint`);
            availableCourses.length = 0;
            
            coursesData.forEach(course => {
              availableCourses.push({
                ...course,
                thumbnail: generateThumbnailUrl(course.id)
              });
            });
            
            console.log(`Loaded ${availableCourses.length} courses from fallback API endpoint`);
            return;
          } else {
            console.error('Empty or invalid courses array from fallback endpoint:', coursesData);
          }
        } catch (parseError) {
          console.error('Error parsing fallback course data:', parseError);
        }
      } else {
        console.error(`Fallback request failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }
    } catch (fallbackError) {
      console.error('Fallback content scan failed:', fallbackError);
    }
    
    // If we still have fallback courses, log that we're using them
    if (availableCourses.length > 0) {
      console.log(`Using ${availableCourses.length} hardcoded fallback courses`);
    } else {
      console.error('No courses available from any source!');
    }
    
  } catch (error) {
    console.error('Error scanning courses:', error);
  }
};

// Helper function to generate random colors for courses without defined colors
function getRandomColor() {
  const colors = ['#CD0E66', '#0F82F2', '#6D3BBF', '#C4158B', '#4CAF50', '#FF9800', '#607D8B'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Call this when the app initializes to populate courses
scanAvailableCourses();

// Export utility functions
export const getCourseList = () => {
  return availableCourses;
};

export const getCourseById = (courseId) => {
  // Log to debug course lookup
  console.log(`Looking for course with ID: ${courseId}`);
  console.log(`Available courses:`, availableCourses.map(c => c.id));
  
  // Case-insensitive lookup to handle edge cases
  const normalizedCourseId = courseId.toLowerCase();
  const course = availableCourses.find(course => 
    course.id.toLowerCase() === normalizedCourseId ||
    course.id.toLowerCase().replace(/[_-]/g, '') === normalizedCourseId.replace(/[_-]/g, '')
  );
  
  if (!course) {
    console.error(`Course not found for ID: ${courseId}`);
    // Try to fetch this course directly from the API if not in the cached list
    scanAvailableCourses(); // Refresh course list as a fallback
  }
  
  return course || null;
};

export const getCourseContent = async (courseId) => {
  // Check if course exists
  const course = getCourseById(courseId);
  if (!course) return null;
  
  try {
    // Use a direct fetch from the server API to get the course markdown content
    // This should match the path where your backend serves content files
    const contentPath = `/content/${courseId}/content.md`;
    
    try {
      const response = await fetch(contentPath);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      // Get the raw markdown content
      const markdownContent = await response.text();
      
      if (!markdownContent) {
        throw new Error('No markdown content found');
      }
      
      // Process the markdown content
      console.log(`Successfully loaded content for ${courseId}`);
      
      // Create a properly structured content object directly
      // Extract metadata
      const metadata = {};
      const metadataRegex = /> ([\w-]+): (.+)/g;
      let match;
      let contentCopy = markdownContent.slice();
      while ((match = metadataRegex.exec(contentCopy)) !== null) {
        metadata[match[1]] = match[2];
      }
      
      // Extract sections
      const sectionRegex = /## ([^\n]+)\s*\n+> section: ([^\n]+)/g;
      const sections = [];
      let sectionMatch;
      while ((sectionMatch = sectionRegex.exec(markdownContent)) !== null) {
        sections.push({
          title: sectionMatch[1].trim(),
          id: sectionMatch[2].trim(),
          content: sectionMatch[0] // Include section header
        });
      }
      
      return {
        course,
        content: {
          metadata,
          sections,
          html: markdownContent // Include raw content as fallback
        }
      };
    } catch (err) {
      console.error(`Error fetching course content from ${contentPath}:`, err);
      
      // Provide a properly structured fallback content that matches the expected format
      console.log(`Using simple fallback content for ${courseId}`);
      
      // Create a properly structured content object instead of trying to parse HTML
      const fallbackContent = {
        meta: {
          id: courseId,
          title: course.title || courseId
        },
        sections: [
          {
            id: 'introduction',
            title: 'Introduction',
            content: '<p>Error loading course content. Please try again later.</p>',
            subsections: [
              {
                id: 'error',
                content: '<p>Error loading course content. Please try again later.</p>'
              }
            ]
          }
        ]
      };
      
      return {
        course,
        content: fallbackContent
      };
    }
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
    // First try to fetch translations from the API
    const apiPath = `/translations/${courseId}/languages`;
    
    try {
      const response = await fetch(apiPath);
      if (response.ok) {
        const languages = await response.json();
        if (Array.isArray(languages) && languages.length > 0) {
          console.log(`Found ${languages.length} translations for ${courseId} from API`);
          return languages;
        }
      }
    } catch (err) {
      console.warn(`Could not fetch translations from ${apiPath}`, err);
    }
    
    // Fallback to hardcoded languages based on what's available in the translations directory
    // These match the actual language folders in the translations directory
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'ar', name: 'العربية' },  // Arabic
      { code: 'cn', name: '中文' },      // Chinese
      { code: 'de', name: 'Deutsch' },   // German
      { code: 'es', name: 'Español' },   // Spanish
      { code: 'fr', name: 'Français' },  // French
      { code: 'hi', name: 'हिन्दी' },     // Hindi
      { code: 'hr', name: 'Hrvatski' },  // Croatian
      { code: 'it', name: 'Italiano' },  // Italian
      { code: 'ja', name: '日本語' },     // Japanese
      { code: 'pt', name: 'Português' }, // Portuguese
      { code: 'ro', name: 'Română' },    // Romanian
      { code: 'ru', name: 'Русский' },   // Russian
      { code: 'sv', name: 'Svenska' },   // Swedish
      { code: 'tr', name: 'Türkçe' },    // Turkish
      { code: 'vi', name: 'Tiếng Việt' } // Vietnamese
    ];
    
    console.log(`Using ${languages.length} hardcoded translations for ${courseId}`);
    return languages;
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
    
    // Path to translated content
    const translationPath = `/api/translations/${courseId}/${languageCode}/content.md`;
    
    try {
      // First try to fetch the translated content from the API
      const response = await fetch(translationPath);
      
      if (response.ok) {
        // Get the raw markdown content
        const translatedContent = await response.text();
        
        // Process the markdown content using parseMathigonMd
        const parsedContent = parseMathigonMd(translatedContent);
        
        // Get the original course info to combine with translated content
        const courseInfo = getCourseById(courseId);
        
        console.log(`Successfully loaded translation for ${courseId} in ${languageCode}`);
        
        return {
          course: courseInfo,
          content: parsedContent
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch translation from ${translationPath}`, e);
    }
    
    // If we reach here, we couldn't load the translated content
    // Fall back to loading a simulated translated version
    try {
      // Get the original course content
      const originalContent = await getCourseContent(courseId);
      
      if (!originalContent) {
        throw new Error('Failed to get original content for fallback translation');
      }
      
      console.log(`No translation API available for ${courseId} in ${languageCode}, using simulated translation`);
      
      // Create a simulated translated version (in a real app, this would be properly translated content)
      // This just adds a language indicator to the title to show it's "translated"
      const languageNames = {
        'ar': 'Arabic',
        'cn': 'Chinese',
        'de': 'German',
        'es': 'Spanish',
        'fr': 'French',
        'hi': 'Hindi',
        'hr': 'Croatian',
        'it': 'Italian',
        'ja': 'Japanese',
        'pt': 'Portuguese',
        'ro': 'Romanian',
        'ru': 'Russian',
        'sv': 'Swedish',
        'tr': 'Turkish',
        'vi': 'Vietnamese'
      };
      
      const languageName = languageNames[languageCode] || languageCode.toUpperCase();
      
      // Create a simulated translated version by modifying the HTML content
      // In a real app, this would be properly translated content
      if (originalContent.content && originalContent.content.html) {
        let html = originalContent.content.html;
        
        // Add language indicator to the title
        html = html.replace(/<h1>([^<]+)<\/h1>/, `<h1>$1 (${languageName})</h1>`);
        
        return {
          course: originalContent.course,
          content: {
            metadata: originalContent.content.metadata,
            html: html
          }
        };
      }
      
      return originalContent;
    } catch (fallbackError) {
      console.error('Error creating fallback translation:', fallbackError);
      return await getCourseContent(courseId);
    }
  } catch (error) {
    console.error(`Error loading translation for ${languageCode}:`, error);
    return await getCourseContent(courseId);
  }
};

export { getAssistantResponse, parseMathigonMd };
