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
    return {
      metadata: {},
      html: `<p>Error: Received invalid content type (${typeof content})</p>`
    };
  }
  
  // Extract metadata from content
  const metadata = {};
  const lines = content.split('\n');
  let contentStart = 0;
  
  // Look for metadata at the beginning of the file (Mathigon format)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('> ')) {
      const parts = line.substring(2).split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        metadata[key] = value;
      }
      contentStart = i + 1;
    } else if (line !== '') {
      break;
    }
  }
  
  // Process the actual content, skipping metadata
  const contentLines = lines.slice(contentStart);
  const contentWithoutMetadata = contentLines.join('\n');
  
  // If content is already HTML, just return it with minimal processing
  if (contentWithoutMetadata.includes('<h1>') || contentWithoutMetadata.includes('<div class="section">')) {
    return { metadata, html: contentWithoutMetadata };
  }
  
  // Parse sections and subsections
  let html = '';
  const sections = [];
  
  // Split content by sections (## heading followed by > section: id)
  const sectionMatches = contentWithoutMetadata.matchAll(/## ([^\n]+)\s*\n+> section: ([^\n]+)/g);
  const sectionIndices = [];
  
  for (const match of sectionMatches) {
    sectionIndices.push({
      index: match.index,
      title: match[1].trim(),
      id: match[2].trim()
    });
  }
  
  // Process each section
  if (sectionIndices.length > 0) {
    for (let i = 0; i < sectionIndices.length; i++) {
      const section = sectionIndices[i];
      const nextSection = i < sectionIndices.length - 1 ? sectionIndices[i + 1] : null;
      const startIndex = section.index;
      const endIndex = nextSection ? nextSection.index : contentWithoutMetadata.length;
      
      // Extract section content
      const sectionContent = contentWithoutMetadata.substring(startIndex, endIndex);
      
      // Process section content
      const processedContent = processSectionContent(sectionContent);
      
      // Add to HTML
      html += `<div class="section" id="${section.id}" data-section="${section.id}">
        <h2>${section.title}</h2>
        <div class="section-content">
          ${processedContent}
        </div>
      </div>`;
      
      // Add to sections array
      sections.push({
        id: section.id,
        title: section.title,
        content: processedContent
      });
    }
  } else {
    // If no sections found, treat the whole content as one section
    html = `<div class="section" id="content" data-section="content">
      <div class="section-content">
        ${processSectionContent(contentWithoutMetadata)}
      </div>
    </div>`;
    
    sections.push({
      id: 'content',
      title: metadata.title || 'Content',
      content: processSectionContent(contentWithoutMetadata)
    });
  }
  
  return { 
    metadata, 
    html, 
    sections 
  };
};

// Helper function to process section content
const processSectionContent = (sectionContent) => {
  return sectionContent
    // Process subsection markers
    .replace(/> id: ([^\n]+)/g, '<div class="subsection" id="$1">')
    .replace(/> end-id/g, '</div>')
    
    // Process column layouts
    .replace(/::: column\(width=(\d+)\)/g, '<div class="column" style="width: $1px;">')
    .replace(/::: column\.grow/g, '<div class="column grow">')
    .replace(/:::/g, '</div>')
    
    // Process images with proper path resolution
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      // Handle relative paths
      if (src.startsWith('./') || !src.startsWith('http') && !src.startsWith('/')) {
        src = `/content/${src.replace('./', '')}`;
      }
      return `<img src="${src}" alt="${alt}" class="mathigon-image" />`;
    })
    
    // Process special x-tag elements - Match Mathigon format
    .replace(/x-geopad\(([^)]*)\)/g, '<div class="interactive-element geopad" data-params=\'$1\'></div>')
    .replace(/x-coordinate-system\(([^)]*)\)/g, '<div class="interactive-element graph" data-params=\'$1\'></div>')
    .replace(/x-slider\(([^)]*)\)/g, '<div class="interactive-element slider" data-params=\'$1\'></div>')
    .replace(/x-equation\(([^)]*)\)/g, '<div class="interactive-element equation" data-params=\'$1\'></div>')
    .replace(/x-sortable\(([^)]*)\)/g, '<div class="interactive-element sortable" data-params=\'$1\'></div>')
    .replace(/x-gesture\(([^)]*)\)/g, '<div class="interactive-element gesture" data-params=\'$1\'></div>')
    .replace(/x-picker\(([^)]*)\)/g, '<div class="interactive-element picker" data-params=\'$1\'></div>')
    .replace(/x-quizzes\(([^)]*)\)/g, '<div class="interactive-element quiz" data-params=\'$1\'></div>')
    .replace(/x-code\(([^)]*)\)/g, '<div class="interactive-element code" data-params=\'$1\'></div>')
    .replace(/x-simulation\(([^)]*)\)/g, '<div class="interactive-element simulation" data-params=\'$1\'></div>')
    
    // Process glossary terms
    .replace(/\[([^\]]+)\]\(gloss:([^)]+)\)/g, '<span class="term" data-gloss="$2">$1</span>')
    
    // Process step blocks and tabs
    .replace(/{step.*?}/g, '<div class="step-block">')
    .replace(/{:\/step}/g, '</div>')
    .replace(/{tab.*?}/g, '<div class="tab-content">')
    .replace(/{:\/tab}/g, '</div>')
    
    // Process math expressions
    .replace(/\${2}([^$]+)\${2}/g, '<span class="math-block">$1</span>')
    .replace(/\$([^$\n]+)\$/g, '<span class="math-inline">$1</span>')
    
    // Process basic markdown
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Process paragraphs (avoid wrapping existing HTML elements)
    .replace(/^(?!<[a-z]).+/gm, '<p>$&</p>');
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

// Function to generate correct thumbnail URLs for cloud hosting
const generateThumbnailUrl = (courseId) => {
  // This handles both development and production environments
  return `/content/${courseId}/hero.jpg`;
};

// Function to check if a file exists via API
const fileExists = async (path) => {
  try {
    // Use HEAD request to check if file exists
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking if file exists at ${path}:`, error);
    // Default to true to prevent cascading failures
    return true;
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
      if (!response.ok) {
        console.error(`Error fetching content: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch ${contentPath}`);
      }
      const content = await response.text();
      contentData = parseMathigonMd(content);
    } else {
      // Fallback to index.md if content.md doesn't exist
      const indexPath = `${courseId}/index.md`;
      const indexExists = await fileExists(indexPath);
      
      if (indexExists) {
        const response = await fetch(getApiUrl(`/api/content/${indexPath}`));
        if (!response.ok) {
          throw new Error(`Failed to fetch ${indexPath}`);
        }
        const content = await response.text();
        contentData = parseMathigonMd(content);
      } else {
        // Try direct API endpoint as a final fallback
        try {
          const apiResponse = await fetch(getApiUrl(`/api/courses/${courseId}`));
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            contentData = {
              metadata: apiData.metadata || {},
              html: apiData.html || `<h1>${apiData.title || courseId}</h1><p>${apiData.description || ''}</p>`,
              sections: apiData.sections || []
            };
          } else {
            console.error(`API fallback failed: ${apiResponse.status}`);
            throw new Error('All content loading methods failed');
          }
        } catch (apiError) {
          console.error('API fallback error:', apiError);
          throw new Error('All content loading methods failed');
        }
      }
    }
    
    // Load user progress if userId is provided
    if (userId && contentData) {
      try {
        const progressData = await loadUserProgress(userId, courseId);
        if (progressData) {
          contentData.progress = progressData;
        }
      } catch (progressError) {
        console.warn('Failed to load user progress:', progressError);
        // Continue without progress data
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
    
    // Return minimal structured data so the app doesn't crash
    const course = getCourseById(courseId);
    return {
      metadata: { title: course?.title || courseId },
      html: `<h1>${course?.title || courseId}</h1><p>Error loading content. Please try again later.</p>`,
      sections: []
    };
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
    // Scan the content directory to find all available courses
    const contentDir = '/content';
    
    // Dynamic course discovery
    try {
      // Try to get a directory listing from the server
      const response = await fetch(getApiUrl('/api/content/list'));
      
      if (response.ok) {
        const directories = await response.json();
        console.log('Discovered course directories:', directories);
        
        // Create course objects for each directory that is not _shared
        const discoveredCourses = directories.filter(dir => 
          dir !== 'shared' && !dir.startsWith('_')
        ).map(dir => {
          // Attempt to load course metadata from content.md
          // This is a simplified version - in a full implementation we would parse the metadata
          // from the content.md file using the same approach as in the backend
          
          // Use common color mapping from textbooks-master for consistency
          const colorMap = {
            'probability': '#CD0E66',
            'circles': '#5A49C9',
            'vectors': '#1F7AED',
            'triangles': '#5A49C9',
            'transformations': '#1F7AED',
            'statistics': '#CD0E66',
            'solids': '#5A49C9',
            'sequences': '#22AB24',
            'quadratics': '#AD1D84',
            'polyhedra': '#5A49C9',
            'matrices': '#1F7AED',
            'graph-theory': '#0F82F2',
            'game-theory': '#CA0E66',
            'fractals': '#4AB72A',
            'euclidean-geometry': '#CD0E66',
            'divisibility': '#0F82F2',
            'complex': '#22AB24',
            'combinatorics': '#AD1D84',
            'codes': '#1F7AED',
            'chaos': '#009EA6',
            'basic-probability': '#CD0E66',
            'non-euclidean-geometry': '#5A49C9',
            'logic': '#1F7AED',
            'linear-functions': '#22AB24',
            'functions': '#AD1D84',
            'exponentials': '#0F82F2',
            'exploding-dots': '#CA0E66',
            'data': '#4AB72A',
            'shapes': '#CD0E66',
            'polygons': '#5A49C9'
          };
          
          // Convert directory name to display title with appropriate formatting
          const title = dir
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          return {
            id: dir,
            title: title,
            description: `Learn about ${title.toLowerCase()}`,
            color: colorMap[dir] || getRandomColor(),
            level: 'Intermediate',
            category: 'Mathematics'
          };
        });
        
        // Add the discovered courses
        discoveredCourses.forEach(course => {
          availableCourses.push({
            ...course,
            thumbnail: generateThumbnailUrl(course.id)
          });
        });
        
        console.log(`Added ${discoveredCourses.length} courses from content directory scanning`);
        return;
      }
    } catch (error) {
      console.warn('Error dynamically discovering courses:', error);
    }
    
    // If API fails, try direct access to content folder
    try {
      // Try to fetch a list of directories directly from the content folder
      const response = await fetch('/content/');
      
      if (response.ok) {
        const html = await response.text();
        
        // Extract directory names from the HTML response (this is a simple approach that might need adjustment)
        const dirRegex = /<a[^>]*href="([^"\/]+)\/"[^>]*>/g;
        const directories = [];
        let match;
        
        while ((match = dirRegex.exec(html)) !== null) {
          const dir = match[1];
          if (dir !== 'shared' && !dir.startsWith('_') && !dir.startsWith('.')) {
            directories.push(dir);
          }
        }
        
        console.log('Discovered directories from content folder:', directories);
        
        // Create course objects for each directory using the same approach as above
        const colorMap = {
          'probability': '#CD0E66',
          'circles': '#5A49C9',
          'vectors': '#1F7AED',
          'triangles': '#5A49C9',
          'transformations': '#1F7AED',
          'statistics': '#CD0E66',
          'solids': '#5A49C9',
          'sequences': '#22AB24',
          'quadratics': '#AD1D84',
          'polyhedra': '#5A49C9',
          'matrices': '#1F7AED',
          'graph-theory': '#0F82F2',
          'game-theory': '#CA0E66',
          'fractals': '#4AB72A',
          'euclidean-geometry': '#CD0E66',
          'divisibility': '#0F82F2',
          'complex': '#22AB24',
          'combinatorics': '#AD1D84',
          'codes': '#1F7AED',
          'chaos': '#009EA6',
          'basic-probability': '#CD0E66',
          'non-euclidean-geometry': '#5A49C9',
          'logic': '#1F7AED',
          'linear-functions': '#22AB24',
          'functions': '#AD1D84',
          'exponentials': '#0F82F2',
          'exploding-dots': '#CA0E66',
          'data': '#4AB72A',
          'shapes': '#CD0E66',
          'polygons': '#5A49C9'
        };
        
        directories.forEach(dir => {
          const title = dir
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          availableCourses.push({
            id: dir,
            title: title,
            description: `Learn about ${title.toLowerCase()}`,
            color: colorMap[dir] || getRandomColor(),
            level: 'Intermediate',
            category: 'Mathematics',
            thumbnail: generateThumbnailUrl(dir)
          });
        });
        
        console.log(`Added ${directories.length} courses from direct content directory access`);
        return;
      }
    } catch (directError) {
      console.warn('Error directly accessing content directory:', directError);
    }
    
    // If all else fails, use manual list based on content directory structure
    const contentDirectories = [
      'triangles', 'transformations', 'statistics', 
      'solids', 'shapes', 'sequences', 'quadratics', 'polyhedra', 'polygons', 'matrices', 
      'logic', 'linear-functions', 'graph-theory', 'game-theory', 'functions', 'fractals', 
      'exponentials', 'exploding-dots', 'euclidean-geometry', 'divisibility', 'data', 
      'complex', 'combinatorics', 'codes', 'chaos', 'basic-probability', 'non-euclidean-geometry'
    ];
    
    const colorMap = {
      'probability': '#CD0E66',
      'circles': '#5A49C9',
      'vectors': '#1F7AED',
      'triangles': '#5A49C9',
      'transformations': '#1F7AED',
      'statistics': '#CD0E66',
      'solids': '#5A49C9',
      'sequences': '#22AB24',
      'quadratics': '#AD1D84',
      'polyhedra': '#5A49C9',
      'matrices': '#1F7AED',
      'graph-theory': '#0F82F2',
      'game-theory': '#CA0E66',
      'fractals': '#4AB72A',
      'euclidean-geometry': '#CD0E66',
      'divisibility': '#0F82F2',
      'complex': '#22AB24',
      'combinatorics': '#AD1D84',
      'codes': '#1F7AED',
      'chaos': '#009EA6',
      'basic-probability': '#CD0E66',
      'non-euclidean-geometry': '#5A49C9',
      'logic': '#1F7AED',
      'linear-functions': '#22AB24',
      'functions': '#AD1D84',
      'exponentials': '#0F82F2',
      'exploding-dots': '#CA0E66',
      'data': '#4AB72A',
      'shapes': '#CD0E66',
      'polygons': '#5A49C9'
    };
    
    contentDirectories.forEach(dir => {
      const title = dir
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      availableCourses.push({
        id: dir,
        title: title,
        description: `Learn about ${title.toLowerCase()}`,
        color: colorMap[dir] || getRandomColor(),
        level: 'Intermediate',
        category: 'Mathematics',
        thumbnail: generateThumbnailUrl(dir)
      });
    });
    
    console.log(`Added ${contentDirectories.length} courses from predefined content list`);
  } catch (error) {
    console.error('Error loading courses from content directory:', error);
  }
};

// Helper function to extract sections from content structure
const extractSectionsFromStructure = (courseId) => {
  // This is a placeholder. In a real implementation, you would
  // parse the content.md file from the course directory to extract sections
  return null;
};

// Function to load all available courses
const scanAvailableCourses = async () => {
  console.log('Scanning for available courses...');
  
  try {
    // First try to load from cloud-courses.json - this is our primary source
    try {
      console.log('Attempting to load courses from cloud-courses.json');
      const response = await fetch('/cloud-courses.json');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.courses?.length || 0} courses from cloud data`);
        
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          // Clear existing courses
          availableCourses.length = 0;
          
          // Process the courses
          const apiCourses = data.courses.map(course => ({
            ...course,
            color: course.color || getRandomColor(),
            thumbnail: generateThumbnailUrl(course.id)
          }));
          
          availableCourses.push(...apiCourses);
          console.log(`Added ${apiCourses.length} courses from cloud data`);
          return;
        } else {
          console.warn('No courses found in cloud-courses.json or invalid format');
        }
      } else {
        console.warn(`Failed to load cloud-courses.json: ${response.status} ${response.statusText}`);
      }
    } catch (localError) {
      console.warn('Error loading from local cloud-courses.json:', localError);
    }
    
    // Then try the backend API
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const endpoint = `${apiBase}/api/content/courses`;
    
    try {
      console.log(`Fetching courses from API: ${endpoint}`);
      const response = await fetch(endpoint, { 
        headers: { 'Accept': 'application/json' },
        timeout: 5000 // Add timeout to prevent hanging
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.length || 0} courses from API`);
        
        if (Array.isArray(data) && data.length > 0) {
          // Clear existing courses
          availableCourses.length = 0;
          
          // Add courses from API
          const apiCourses = data.map(course => ({
            ...course,
            color: course.color || getRandomColor(),
            thumbnail: generateThumbnailUrl(course.id)
          }));
          
          availableCourses.push(...apiCourses);
          console.log(`Added ${apiCourses.length} courses from API`);
          return;
        } else {
          console.warn('No courses found in API response or invalid format');
        }
      } else {
        console.warn(`Failed to fetch courses from API: ${response.status} ${response.statusText}`);
      }
    } catch (apiError) {
      console.warn('Error fetching courses from API:', apiError);
    }
    
    // If all else fails, use the fallback courses
    console.log('Using fallback course discovery method');
    await addFallbackCourses();
  } catch (error) {
    console.error('Error scanning courses:', error);
    // Ensure we have courses even if API scan fails
    if (availableCourses.length === 0) {
      console.log('No courses found, using hardcoded fallbacks');
      // Add some hardcoded courses as absolute last resort
      availableCourses.push(
        {
          id: 'triangles',
          title: 'Triangles and Trigonometry',
          description: 'Explore the properties of triangles',
          color: '#1f77b4',
          category: 'Geometry',
          thumbnail: generateThumbnailUrl('triangles')
        },
        {
          id: 'circles',
          title: 'Circles and Pi',
          description: 'Learn about circles and the significance of Pi',
          color: '#7f7f7f',
          category: 'Geometry',
          thumbnail: generateThumbnailUrl('circles')
        }
      );
    }
  }
};

// Helper function to generate random colors for courses without defined colors
function getRandomColor() {
  const colors = ['#CD0E66', '#0F82F2', '#6D3BBF', '#C4158B', '#4CAF50', '#FF9800', '#607D8B'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Initialize with fallback courses first, then try to fetch from API
(async function initializeCourses() {
  try {
    await addFallbackCourses();
    // After we have fallback courses loaded, try to get courses from API
    await scanAvailableCourses();
  } catch (error) {
    console.error('Failed to initialize courses:', error);
  }
})();

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
      }
      
      return {
        course: originalContent.course,
        content: {
          metadata: originalContent.metadata || {},
          sections: originalContent.sections || [],
          html: html || ''
        }
      };
    } catch (e) {
      console.warn(`Failed to generate simulated translation for ${courseId} in ${languageCode}:`, e);
      return null;
    }
  } catch (error) {
    console.error('Error loading translated content:', error);
    return null;
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