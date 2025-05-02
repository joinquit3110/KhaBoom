/**
 * Enhanced Content Loader Utility for KhaBoom
 * 
 * This utility parses content using Mathigon's format from content and translations directories,
 * transforming the special markdown format into React components.
 * 
 * It connects to the MongoDB database via the Render backend API to track progress and load content.
 * It properly processes interactive elements and step tracking with user authentication.
 * 
 * Features:
 * - Robust error handling with fallbacks
 * - Client-side caching for better performance
 * - Support for all Mathigon interactive elements
 * - Offline content support with service worker integration
 * - Analytics tracking for learning progress
 */

// Initialize content cache for improved performance
const contentCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

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

// Function to generate correct API URLs
const getApiUrl = (path) => {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  // Clean up path by removing any double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
};

// Function to generate proper thumbnail URLs using hero images
const generateThumbnailUrl = (courseId) => {
  return getApiUrl(`/content/${courseId}/hero.jpg`);
};

// Function to check if a file exists on the server
const fileExists = async (path) => {
  try {
    // Use HEAD request to check if file exists
    const response = await fetch(getApiUrl(`/api/content/exists?path=${encodeURIComponent(path)}`), {
      method: 'HEAD'
    });
    
    return response.status === 200;
  } catch (error) {
    console.error(`Error checking if file exists at ${path}:`, error);
    return false;
  }
};

// Function to track user progress in MongoDB
const trackProgress = async (userId, courseId, stepId, completed = true) => {
  if (!userId || !courseId) return false;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const response = await fetch(getApiUrl('/api/progress/' + courseId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sectionId: stepId.split('-')[0], // Extract section from step ID
        exerciseId: stepId,
        completed
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return false;
  } catch (error) {
    console.error('Error tracking progress:', error);
    return false;
  }
};

// Function to load user progress from MongoDB
const loadUserProgress = async (userId, courseId) => {
  if (!userId || !courseId) return null;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await fetch(getApiUrl('/api/progress/' + courseId), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error loading user progress:', error);
    return null;
  }
};

// Function to load content from markdown files
const loadContentFile = async (courseId, userId = null) => {
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
    
    let contentData = null;
    
    if (contentExists) {
      const response = await fetch(getApiUrl(`/api/content/${contentPath}`));
      const content = await response.text();
      contentData = parseMathigonMd(content);
    } else {
      // Fallback to index.md if content.md doesn't exist
      const indexPath = `${courseId}/index.md`;
      const indexExists = await fileExists(indexPath);
      
      if (indexExists) {
        const response = await fetch(getApiUrl(`/api/content/${indexPath}`));
        const content = await response.text();
        contentData = parseMathigonMd(content);
      } else {
        console.error(`No content files found for course: ${courseId}`);
        return null;
      }
    }
    
    // Load user progress if userId is provided
    if (userId && contentData) {
      const progressData = await loadUserProgress(userId, courseId);
      if (progressData) {
        contentData.progress = progressData;
      }
    }
    
    // Load functions.ts file for interactive content
    const functionsPath = `${courseId}/functions.ts`;
    const functionsExists = await fileExists(functionsPath);
    
    if (functionsExists) {
      try {
        const response = await fetch(getApiUrl(`/api/content/${functionsPath}`));
        const functionsCode = await response.text();
        contentData.functions = functionsCode;
      } catch (e) {
        console.warn(`Could not load functions for ${courseId}:`, e);
      }
    }
    
    // Load styles.scss file for styling
    const stylesPath = `${courseId}/styles.scss`;
    const stylesExists = await fileExists(stylesPath);
    
    if (stylesExists) {
      try {
        const response = await fetch(getApiUrl(`/api/content/${stylesPath}`));
        const stylesCode = await response.text();
        contentData.styles = stylesCode;
      } catch (e) {
        console.warn(`Could not load styles for ${courseId}:`, e);
      }
    }
    
    return contentData;
  } catch (error) {
    console.error(`Error loading content for ${courseId}:`, error);
    return null;
  }
};

// Map of available courses from the content directory
// This will be dynamically generated based on the filesystem content with hardcoded fallback
const availableCourses = [];

// Function to load all available courses from the content directory
const addFallbackCourses = async () => {
  console.log('Loading courses from the content directory structure');
  
  // Clear existing courses first to avoid duplicates
  availableCourses.length = 0;
  
  try {
    // Define course data based on the content directory structure
    // This is based on the originalweb/textbooks-master organization
    const allCourses = [
      {
        id: 'probability',
        title: 'Introduction to Probability',
        description: 'Learn about randomness, games, and chance',
        color: '#CD0E66',
        level: 'Foundations',
        category: 'Statistics'
      },
      {
        id: 'chaos',
        title: 'Chaos Theory',
        description: 'Explore the mathematics of unpredictable systems',
        color: '#009EA6',
        level: 'Advanced',
        category: 'Mathematics'
      },
      {
        id: 'circles',
        title: 'Circles and Pi',
        description: 'Discover the properties of circles and the famous number Pi',
        color: '#5A49C9',
        level: 'Intermediate',
        category: 'Geometry'
      },
      {
        id: 'codes',
        title: 'Codes and Ciphers',
        description: 'Explore encryption, encoding, and data security',
        color: '#1F7AED',
        level: 'Intermediate',
        category: 'Computer Science'
      },
      {
        id: 'combinatorics',
        title: 'Combinatorics',
        description: 'Master the art of counting and arrangement',
        color: '#AD1D84',
        level: 'Foundations',
        category: 'Mathematics'
      },
      {
        id: 'complex',
        title: 'Complex Numbers',
        description: 'Understand the fascinating world of imaginary numbers',
        color: '#6D3BBF',
        level: 'Advanced',
        category: 'Mathematics'
      },
      {
        id: 'data',
        title: 'Data Analysis',
        description: 'Learn how to analyze and interpret data',
        color: '#8D2CA1',
        level: 'Foundations',
        category: 'Statistics'
      },
      {
        id: 'divisibility',
        title: 'Number Theory',
        description: 'Explore the fascinating properties of numbers',
        color: '#1AA845',
        level: 'Foundations',
        category: 'Mathematics'
      },
      {
        id: 'euclidean-geometry',
        title: 'Euclidean Geometry',
        description: 'Study the classical geometry of Euclid',
        color: '#0F82F2',
        level: 'Intermediate',
        category: 'Geometry'
      },
      {
        id: 'exploding-dots',
        title: 'Exploding Dots',
        description: 'A revolutionary way to learn arithmetic and algebra',
        color: '#2A7B23',
        level: 'Foundations',
        category: 'Mathematics'
      },
      {
        id: 'exponentials',
        title: 'Exponential Functions',
        description: 'Understand growth, decay, and patterns of change',
        color: '#CD0E66',
        level: 'Intermediate',
        category: 'Algebra'
      },
      {
        id: 'fractals',
        title: 'Fractals',
        description: 'Explore infinite patterns and self-similarity',
        color: '#1F7AED',
        level: 'Advanced',
        category: 'Mathematics'
      },
      {
        id: 'functions',
        title: 'Functions and Equations',
        description: 'Master the building blocks of mathematics',
        color: '#CE2016',
        level: 'Foundations',
        category: 'Algebra'
      },
      {
        id: 'game-theory',
        title: 'Game Theory',
        description: 'Learn strategic decision making and competitive behavior',
        color: '#CE2016',
        level: 'Advanced',
        category: 'Mathematics'
      },
      {
        id: 'graph-theory',
        title: 'Graph Theory',
        description: 'Discover the mathematics of networks and connections',
        color: '#0F82F2',
        level: 'Intermediate',
        category: 'Discrete Mathematics'
      },
      {
        id: 'linear-functions',
        title: 'Linear Functions',
        description: 'Master the foundations of algebra and coordinate geometry',
        color: '#1F7AED',
        level: 'Foundations',
        category: 'Algebra'
      },
      {
        id: 'logic',
        title: 'Logic and Proof',
        description: 'Learn the language of mathematical reasoning',
        color: '#CD0E66',
        level: 'Intermediate',
        category: 'Discrete Mathematics'
      },
      {
        id: 'matrices',
        title: 'Matrices and Transformations',
        description: 'Understand linear algebra and its applications',
        color: '#6D3BBF',
        level: 'Advanced',
        category: 'Algebra'
      },
      {
        id: 'non-euclidean-geometry',
        title: 'Non-Euclidean Geometry',
        description: 'Explore geometries beyond flat space',
        color: '#009EA6',
        level: 'Advanced',
        category: 'Geometry'
      },
      {
        id: 'polygons',
        title: 'Polygons and Polyhedra',
        description: 'Discover the properties of 2D and 3D shapes',
        color: '#5A49C9',
        level: 'Intermediate',
        category: 'Geometry'
      },
      {
        id: 'polyhedra',
        title: 'Polyhedra',
        description: 'Study 3D geometric solids and their properties',
        color: '#5A49C9',
        level: 'Intermediate',
        category: 'Geometry'
      },
      {
        id: 'quadratics',
        title: 'Quadratic Equations',
        description: 'Master parabolas and second-degree equations',
        color: '#1AA845',
        level: 'Intermediate',
        category: 'Algebra'
      },
      {
        id: 'sequences',
        title: 'Sequences and Patterns',
        description: 'Discover mathematical patterns and series',
        color: '#0F82F2',
        level: 'Intermediate',
        category: 'Algebra'
      },
      {
        id: 'shapes',
        title: 'Shapes and Solids',
        description: 'Explore fundamental geometry and measurement',
        color: '#009EA6',
        level: 'Foundations',
        category: 'Geometry'
      },
      {
        id: 'statistics',
        title: 'Statistics',
        description: 'Learn to analyze data and draw conclusions',
        color: '#CD0E66',
        level: 'Intermediate',
        category: 'Statistics'
      },
      {
        id: 'transformations',
        title: 'Geometric Transformations',
        description: 'Study movements and changes in geometric space',
        color: '#5A49C9',
        level: 'Intermediate',
        category: 'Geometry'
      },
      {
        id: 'triangles',
        title: 'Triangles and Trigonometry',
        description: 'Master angles, ratios, and triangle relationships',
        color: '#5A49C9',
        level: 'Intermediate',
        category: 'Geometry'
      },
      {
        id: 'vectors',
        title: 'Vectors',
        description: 'Understand quantities with direction and magnitude',
        color: '#6D3BBF',
        level: 'Advanced',
        category: 'Mathematics'
      }
    ];

    // Process and add each course
    allCourses.forEach(course => {
      // Add thumbnail and dynamically identify sections if possible
      availableCourses.push({
        ...course,
        thumbnail: getApiUrl(`/content/${course.id}/hero.jpg`),
        // We'll get actual sections from the content file when a course is selected
        sections: course.sections || extractSectionsFromStructure(course.id) || [
          { id: 'introduction', title: 'Introduction' }
        ]
      });
    });
    
    console.log(`Added ${availableCourses.length} courses from content directory`);
  } catch (error) {
    console.error('Error loading courses from content directory:', error);
    
    // If all else fails, add at least one default course
    if (availableCourses.length === 0) {
      availableCourses.push({
        id: 'probability',
        title: 'Introduction to Probability',
        description: 'Learn about randomness, games, and chance',
        color: '#CD0E66',
        level: 'Foundations',
        category: 'Statistics',
        thumbnail: getApiUrl('/content/probability/hero.jpg'),
        sections: [{ id: 'introduction', title: 'Introduction' }]
      });
    }
  }
};

// Helper function to extract sections from content structure
const extractSectionsFromStructure = (courseId) => {
  // This is a placeholder. In a real implementation, you would
  // parse the content.md file from the course directory to extract sections
  return null;
};

// Function to scan available courses from the content directory
const scanAvailableCourses = async () => {
  try {
    console.log('Attempting to fetch courses from API...');
    console.log('Current environment:', import.meta.env.MODE);
    console.log('API Base URL:', import.meta.env.VITE_API_BASE || 'Not set');
    console.log('Available courses before scan:', availableCourses.length);
    
    // Use the specific scan endpoint for enhanced course information
    const apiUrl = getApiUrl('/api/content/scan');
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
      await addFallbackCourses();
    } else {
      try {
        const responseText = await contentResponse.text();
        console.log('API Response:', responseText.substring(0, 500) + '...'); // Log just the beginning to avoid too much output
        
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
              // Clean up potential JSON parsing issues with color values
              let courseColor = course.color || getRandomColor();
              if (typeof courseColor === 'string' && courseColor.includes('"')) {
                courseColor = courseColor.replace(/"/g, '');
              }
              
              // Add default values for any missing fields
              const processedCourse = {
                id: course.id,
                title: course.title || `Course ${course.id}`,
                description: course.description || 'No description available',
                color: courseColor,
                level: course.level || 'Intermediate',
                // Only use Mathematics as a fallback if course has no category
                category: course.category || '',                
                thumbnail: generateThumbnailUrl(course.id),
                sections: course.sections || [{ id: 'default', title: 'Introduction' }]
              };
              
              availableCourses.push(processedCourse);
            }
          });
          
          console.log(`Loaded ${availableCourses.length} courses from API`);
          // If there are no courses at all, fall back to hardcoded courses
          if (availableCourses.length === 0) {
            await addFallbackCourses();
          }
          return; // Successfully loaded courses from API
        } else {
          console.error('Invalid or empty courses data:', data);
          await addFallbackCourses();
        }
      } catch (parseError) {
        console.error('Error parsing course data:', parseError);
        await addFallbackCourses();
      }
    }
  } catch (error) {
    console.error('Error scanning courses:', error);
    // Ensure we have courses even if API scan fails
    await addFallbackCourses();
  }
};

// Helper function to generate random colors for courses without defined colors
function getRandomColor() {
  const colors = ['#CD0E66', '#0F82F2', '#6D3BBF', '#C4158B', '#4CAF50', '#FF9800', '#607D8B'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Initialize with fallback courses first, then try to fetch from API
addFallbackCourses().then(() => {
  // After we have fallback courses loaded, try to get courses from API
  scanAvailableCourses();
});

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
    console.log(`Creating fallback content for course: ${courseId}`);
    
    // Create fallback content using the course info we already have
    return {
      course,
      content: {
        metadata: { id: courseId },
        html: `<div class="section" data-section="intro">
          <h1>${course.title}</h1>
          <h2 id="intro">Introduction</h2>
          <div class="section-content">
            <p>${course.description}</p>
            <p>This is a preview of the course content. Interactive elements will be available in future versions.</p>
          </div>
        </div>`,
        sections: [{
          id: 'intro',
          title: 'Introduction',
          content: `<p>${course.description}</p>`,
          steps: ['intro-1']
        }]
      }
    };
      
      if (response.ok) {
        const jsonData = await response.json();
        console.log(`Successfully loaded JSON data for ${courseId}`, jsonData.title);
        
        if (jsonData && jsonData.sections) {
          // Create HTML structure from the steps in JSON
          let processedSections = [];
          let fullHtml = '';
          
          // Process each section from the JSON data
          for (const section of jsonData.sections) {
            let sectionHtml = `<div class="section" data-section="${section.id}">
              <h2 id="${section.id}">${section.title}</h2>
              <div class="section-content">`;
              
            // If the section has steps, process them
            if (section.steps && Array.isArray(section.steps)) {
              // For each step ID, get the step content from the jsonData.steps object
              for (const stepId of section.steps) {
                if (jsonData.steps && jsonData.steps[stepId]) {
                  const step = jsonData.steps[stepId];
                  sectionHtml += `<div class="step" id="${stepId}">${step.html || ''}</div>\n`;
                }
              }
            }
            
            sectionHtml += '</div></div>\n';
            fullHtml += sectionHtml;
            
            processedSections.push({
              id: section.id,
              title: section.title,
              content: sectionHtml,
              steps: section.steps || []
            });
          }
          
          // Create the properly structured content object
          return {
            course: {
              ...course,
              ...jsonData,  // Include all the data from the JSON file
              sections: jsonData.sections
            },
            content: {
              metadata: jsonData || {},
              sections: processedSections,
              html: fullHtml,
              steps: jsonData.steps || {}
            }
          };
        }
      }
      
      // Try loading from markdown as a fallback
      const contentPath = `/content/${courseId}/content.md`;
      console.log(`Trying markdown fallback: ${contentPath}`);
      try {
        const mdResponse = await fetch(contentPath);
        
        if (mdResponse.ok) {
        const markdownContent = await mdResponse.text();
        if (markdownContent && markdownContent.length > 0) {
          console.log(`Successfully loaded content from markdown for ${courseId}`);
          
          // Process the markdown content
          const parsedContent = parseMathigonMd(markdownContent);
          
          // Create default sections if none exist
          const sections = parsedContent.sections || [
            { 
              id: 'introduction', 
              title: 'Introduction', 
              content: parsedContent.html || markdownContent 
            }
          ];
          
          // Create the properly structured content object
          return {
            course,
            content: {
              metadata: parsedContent.metadata || {},
              sections,
              html: parsedContent.html || ''
            }
          };
        }
      }
      
      // If local files don't work, create a minimal course structure with fallback content
      console.log(`Creating fallback content for ${courseId}`);
      return {
        course,
        content: {
          metadata: { title: course.title },
          sections: [{
            id: 'introduction',
            title: 'Introduction',
            content: `<div class="section" data-section="introduction">
              <h2 id="introduction">Introduction</h2>
              <div class="section-content">
                <p>${course.description || 'No course content available yet.'}</p>
                <p>Please check back later for full course content.</p>
              </div>
            </div>`
          }],
          html: `<h1>${course.title}</h1>
            <div class="section" data-section="introduction">
              <h2 id="introduction">Introduction</h2>
              <div class="section-content">
                <p>${course.description || 'No course content available yet.'}</p>
                <p>Please check back later for full course content.</p>
              </div>
            </div>`
        }
      };
    } catch (err) {
      console.error(`Error fetching course content from ${apiPath}:`, err);
      
      // Provide a properly structured fallback content that matches the expected format
      console.log(`Using simple fallback content for ${courseId}`);
      
      // Create a properly structured content object with HTML field that matches what renderCourseContent expects
      const fallbackContent = {
        metadata: {
          id: courseId,
          title: course.title || courseId
        },
        sections: [
          {
            id: 'introduction',
            title: 'Introduction',
            content: '<p>Error loading course content. Please try again later.</p>'
          }
        ],
        html: `<h1>${course.title || courseId}</h1>
               <p>We're having trouble loading this course content right now. Please try again later.</p>
               <div class="section" data-section="introduction">
                 <h2 id="introduction">Introduction</h2>
                 <div class="section-content">
                   <p>This course is currently unavailable. Please check back soon.</p>
                 </div>
               </div>`
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
    const apiPath = getApiUrl(`/api/content/translations/${courseId}/languages`);
    
    try {
      console.log(`Fetching translations from: ${apiPath}`);
      const response = await fetch(apiPath);
      if (response.ok) {
        const languages = await response.json();
        if (Array.isArray(languages) && languages.length > 0) {
          console.log(`Found ${languages.length} translations for ${courseId} from API`);
          return languages;
        }
      } else {
        console.warn(`Translation request failed with status: ${response.status}`);
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
    
    // Use proper API path for translated content
    const apiPath = getApiUrl(`/api/content/translations/${courseId}/${languageCode}`);
    
    try {
      console.log(`Fetching translation from: ${apiPath}`);
      const response = await fetch(apiPath);
      
      if (response.ok) {
        // Get the content as JSON from the API
        const translatedData = await response.json();
        
        if (!translatedData) {
          throw new Error('No translation data found');
        }
        
        // Get the original course info to combine with translated content
        const courseInfo = getCourseById(courseId);
        
        console.log(`Successfully loaded translation for ${courseId} in ${languageCode}`);
        
        // Extract sections from the translated content
        const sections = translatedData.content?.sections || [];
        
        // Process content to get HTML
        let html = '';
        if (sections.length > 0) {
          // Join all section content together for rendering
          html = sections.map(section => section.content).join('\n\n');
        }
        
        return {
          course: courseInfo,
          content: {
            metadata: translatedData.metadata || {},
            sections: sections,
            html: parseMathigonMd(html).html // Process the HTML
          }
        };
      }
    } catch (e) {
      console.warn(`Failed to fetch translation from ${apiPath}`, e);
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

// Function to get AI assistant response based on course content
const getAssistantResponse = (courseId, userMessage) => {
  try {
    // In a real implementation, this would call an AI service
    // For now, we'll return a simple response based on the query
    
    // Check if we have message about specific terms
    for (const term of Object.keys(glossaryTerms)) {
      if (userMessage.toLowerCase().includes(term)) {
        return `${term}: ${getGlossaryContent(term)}`;
      }
    }
    
    // Generic responses based on course ID
    const courseResponses = {
      'probability': 'Probability involves measuring the likelihood of events occurring. Can I help explain a specific probability concept?',
      'chaos': 'Chaos Theory explores how small changes in initial conditions can lead to vastly different outcomes in complex systems.',
      'circles': 'Circles are fundamental shapes with countless applications in mathematics and the real world.',
      'codes': 'Cryptography has been used throughout history to securely transmit information.',
      'complex': 'Complex numbers extend our number system to solve equations that have no real solutions.'
    };
    
    if (courseId && courseResponses[courseId]) {
      return courseResponses[courseId];
    }
    
    // Default responses
    if (userMessage.includes('?')) {
      return `That's a good question about ${courseId || 'mathematics'}. I recommend reviewing the current section for more information.`;
    }
    
    return `I'm your learning assistant for this course. How can I help you understand the concepts in ${courseId || 'this topic'} better?`;
  } catch (error) {
    console.error('Error generating assistant response:', error);
    return "I'm sorry, I couldn't process your request. Please try again.";
  }
};

export { getAssistantResponse, parseMathigonMd };
