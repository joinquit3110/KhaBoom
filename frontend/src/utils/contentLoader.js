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
const availableCourses = [
  // Fallback courses that match the original Mathigon courses
  {
    id: 'probability',
    title: 'Introduction to Probability',
    description: 'Learn about randomness, games, and chance',
    color: '#CD0E66',
    level: 'Foundations',
    thumbnail: '/content/probability/images/thumbnail.jpg',
    sections: [
      { id: 'intro', title: 'Introduction' },
      { id: 'computing', title: 'Computing Probabilities' },
      { id: 'trees', title: 'Probability Trees' },
      { id: 'simulations', title: 'Venn Diagrams' }
    ]
  },
  {
    id: 'chaos',
    title: 'Chaos Theory',
    description: 'Unpredictable mathematics',
    color: '#0F82F2',
    level: 'Advanced',
    thumbnail: '/content/chaos/images/thumbnail.jpg',
    sections: [
      { id: 'intro', title: 'Introduction' },
      { id: 'pendulum', title: 'Mathematical Billiard' },
      { id: 'threebody', title: 'The Three Body Problem' },
      { id: 'fractals', title: 'Phase Space and Strange Attractors' },
      { id: 'logistic', title: 'The Logistic Map' }
    ]
  },
  {
    id: 'circles',
    title: 'Circles and Pi',
    description: 'Round shapes and transcendental numbers',
    color: '#6D3BBF',
    level: 'Intermediate',
    thumbnail: '/content/circles/images/thumbnail.jpg',
    sections: [
      { id: 'intro', title: 'Introduction' },
      { id: 'degrees', title: 'Degrees and Radians' },
      { id: 'tangets', title: 'Tangents, Chords and Arcs' },
      { id: 'theorems', title: 'The Circle Theorems' },
      { id: 'polygons', title: 'Cyclic Polygons' },
      { id: 'spheres', title: 'Spheres, Cones and Cylinders' },
      { id: 'conic', title: 'Conic Sections' }
    ]
  },
  {
    id: 'codes',
    title: 'Codes and Ciphers',
    description: 'Cryptography and secret messages',
    color: '#C4158B',
    level: 'Intermediate',
    thumbnail: '/content/codes/images/thumbnail.jpg',
    sections: [
      { id: 'intro', title: 'Introduction' },
      { id: 'binary', title: 'Binary Numbers' },
      { id: 'detection', title: 'Error Detection' },
      { id: 'secret', title: 'Secret Codes' },
      { id: 'enigma', title: 'The Enigma' },
      { id: 'encryption', title: 'Public Key Cryptography' }
    ]
  }
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
    // In a production environment, we would fetch this from the server
    // For demonstration purposes, let's generate some sample content for the Introduction section
    // that matches the original Mathigon course format
    
    // Use the course ID to determine which content to serve
    let html = '';
    
    if (courseId === 'probability') {
      html = `
        <h1>Introduction to Probability</h1>
        <div class="section" data-section="introduction">
          <h2 id="intro">Introduction</h2>
          <div class="subsection" id="intro">
            <p>In previous courses, we have seen how we can use science and mathematics to try to predict the future. For example, we can predict when a car will arrive at its destination if it is driving at a constant speed.</p>
            
            <p>However, there are many examples in life where it is impossible to predict exactly what will happen. This could be because we don't have all the information we need, because the decisions of other people might influence the result, or just because it is incredibly complicated.</p>
            
            <div class="column" style="width: 200px;">
              <img src="/content/probability/images/weather.jpg" width="200" height="150" class="mathigon-image" />
              <p class="caption">The atmosphere consists of billions of molecules that interact with each other. That's why it is impossible to exactly predict the weather.</p>
            </div>
            
            <div class="column" style="width: 200px;">
              <img src="/content/probability/images/election.jpg" width="200" height="150" class="mathigon-image" />
              <p class="caption">You don't know how people are going to vote in an election. That's why it is impossible to exactly predict the outcome.</p>
            </div>
            
            <div class="column" style="width: 200px;">
              <img src="/content/probability/images/cards.jpg" width="200" height="150" class="mathigon-image" />
              <p class="caption">After shuffling, you don't know the order of the cards in a deck. That's why it is impossible to exactly predict the colour of the next card.</p>
            </div>
          </div>
          
          <div class="interactive-element geopad" data-params="id: 'dartboard'">
            <div class="placeholder-text">Dart Board Interactive Element</div>
          </div>
          
          <p>Our language has many words we can use to describe the answer to these questions, without knowing exactly what will happen. Try to move each of these events to the best possible description:</p>
          
          <p>From this, you might deduce that the next throw has a 5/20=0.25 chance to also land in the center. We say that 0.25 is the probability of hitting the center.</p>
          
          <p>For many centuries, mathematicians have struggled to deal with these uncertain situations – until the development of probability theory. In this course, we will explore what probability is, and give you some amazing new tools to be able to predict the future.</p>
          
          <p>If you move the sliders above, you might notice that the probability is always between <span class="math-inline">0</span> (if you never hit the center) and <span class="math-inline">1</span> (if you always hit the center).</p>
          
          <p>Probabilities always lie between 0 and 1. An event with a smaller probability (like 0.2) is always less likely than an event with a larger probability (like 0.8). If an outcome is impossible, we say it has probability 0. If it is certain, we say it has probability 1. If an event is equally likely to happen or not happen, its probability is exactly in the middle: <span class="math-inline">0.5</span>.</p>
        </div>
      `;
    } else if (courseId === 'chaos') {
      html = `
        <h1>Chaos Theory</h1>
        <div class="section" data-section="introduction">
          <h2 id="intro">Introduction</h2>
          <div class="subsection" id="intro">
            <p>Chaos theory is a branch of mathematics that deals with complex systems whose behavior is highly sensitive to slight changes in conditions. Small differences in initial conditions yield widely diverging outcomes, rendering long-term prediction impossible.</p>
            
            <p>The butterfly effect is one of the most commonly used examples of chaos theory. It describes how a small change, like the flap of a butterfly's wings in Brazil, might cause a tornado in Texas. This isn't meant to be taken literally, but rather as a metaphor for how small changes can lead to big effects.</p>
            
            <div class="interactive-element simulation" data-params="id: 'pendulum'">
              <div class="placeholder-text">Double Pendulum Simulation</div>
            </div>
            
            <p>One of the simplest systems that demonstrates chaotic behavior is the double pendulum. Unlike a regular pendulum that swings back and forth in a predictable manner, the double pendulum's movement quickly becomes chaotic and impossible to predict over longer periods.</p>
          </div>
        </div>
      `;
    } else if (courseId === 'circles') {
      html = `
        <h1>Circles and Pi</h1>
        <div class="section" data-section="introduction">
          <h2 id="intro">Introduction</h2>
          <div class="subsection" id="intro">
            <p>Circles are among the most fundamental shapes in geometry. They appear everywhere in nature, from ripples in water to celestial bodies. The principles of circles underpin countless aspects of science, engineering, and mathematics.</p>
            
            <p>The ratio of a circle's circumference to its diameter is always the same value, which we call <span class="term" data-gloss="pi">π</span>. This number is approximately 3.14159, but its decimal expansion goes on forever without repeating.</p>
            
            <div class="interactive-element geopad" data-params="id: 'circle'">
              <div class="placeholder-text">Interactive Circle</div>
            </div>
            
            <p>Understanding circles and pi is essential for many areas of mathematics, including trigonometry, calculus, and even number theory.</p>
          </div>
        </div>
      `;
    } else if (courseId === 'codes') {
      html = `
        <h1>Codes and Ciphers</h1>
        <div class="section" data-section="introduction">
          <h2 id="intro">Introduction</h2>
          <div class="subsection" id="intro">
            <p>Cryptography is the science of secret communication. Throughout history, people have developed ways to encrypt messages so that only the intended recipient could read them.</p>
            
            <p>One of the simplest ciphers is the Caesar cipher, where each letter in the plaintext is shifted a certain number of places down the alphabet. For example, with a shift of 1, A would be replaced by B, B would become C, and so on.</p>
            
            <div class="interactive-element code" data-params="id: 'caesar'">
              <div class="placeholder-text">Caesar Cipher Interactive</div>
            </div>
            
            <p>Modern cryptography relies on complex mathematical problems that are easy to compute in one direction but very difficult to reverse, making it the foundation of secure communication in the digital age.</p>
          </div>
        </div>
      `;
    } else {
      // Default for any other course ID
      html = `
        <h1>${course.title}</h1>
        <div class="section" data-section="introduction">
          <h2 id="intro">Introduction</h2>
          <div class="subsection" id="intro">
            <p>This course is currently under development. Please check back later for content.</p>
          </div>
        </div>
      `;
    }
    
    // Parse the HTML content
    const parsed = parseMathigonMd(html);
    
    return {
      course,
      content: parsed
    };
      
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
    // In a real app, we'd fetch this from an API endpoint
    // For now, hardcode available languages to match the original Mathigon site
    
    // Standard set of languages available for all courses
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
      { code: 'zh', name: '中文' },
      { code: 'ko', name: '한국어' },
      { code: 'ja', name: '日本語' }
    ];
    
    // Different courses might have different available translations
    // You could customize this based on courseId if needed
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
