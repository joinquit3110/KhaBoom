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
  const metadataRegex = /> (\w+): (.+)/g;
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
    
    // Process images
    .replace(/x-img\(src="([^"]+)" width=(\d+) height=(\d+)\)/g, '<img src="$1" width="$2" height="$3" />')
    
    // Process gloss terms
    .replace(/\[__([^_]+)__\]\(gloss:([^\)]+)\)/g, '<span class="term" data-gloss="$2">$1</span>')
    
    // Process interactive sections
    .replace(/x-geopad\(([^\)]+)\)/g, '<div class="interactive-element geopad" data-params="$1"><div class="placeholder-text">Interactive Diagram</div></div>')
    
    // Process basic markdown
    .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<em>$1</em>')
    
    // Process paragraphs
    .replace(/^([^<].*)/gm, '<p>$1</p>')
    
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
    
    // Then check if the file exists on the server by making a HEAD request
    // This will check for files that might be in our content directory but not predefined
    const response = await fetch(`/api/content/exists?path=${encodeURIComponent(path)}`, {
      method: 'HEAD'
    });
    return response.ok;
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
  // Base courses are defined here, but will be extended with content from the filesystem
  {
    id: 'circles',
    title: 'Circles and Pi',
    description: 'Learn about circles, their properties, and the significance of Pi in mathematics.',
    level: 'Intermediate',
    category: 'Geometry',
    color: '#5A49C9',
  },
  {
    id: 'graph-theory',
    title: 'Graph Theory',
    description: 'Explore the mathematical structures used to model pairwise relations between objects.',
    level: 'Advanced',
    category: 'Discrete Mathematics',
    color: '#2196F3',
  },
  {
    id: 'probability',
    title: 'Probability',
    description: 'Understanding chance, randomness, and likelihood in mathematics.',
    level: 'Intermediate',
    category: 'Statistics',
    color: '#4CAF50',
  },
  {
    id: 'transformations',
    title: 'Transformations',
    description: 'Learn about mathematical transformations and how they affect geometric shapes.',
    level: 'Intermediate',
    category: 'Geometry',
    color: '#E91E63'
  },
  {
    id: 'polyhedra',
    title: 'Polyhedra',
    description: 'Discover the fascinating world of 3D geometric shapes.',
    level: 'Intermediate',
    category: 'Geometry',
    color: '#FF9800'
  },
  {
    id: 'fractals',
    title: 'Fractals',
    description: 'Explore the beauty of self-similar patterns in mathematics.',
    level: 'Advanced',
    category: 'Chaos Theory',
    color: '#9C27B0'
  },
  {
    id: 'triangles',
    title: 'Triangles',
    description: 'Learn about the fundamental shape in geometry.',
    level: 'Beginner',
    category: 'Geometry',
    color: '#00BCD4'
  },
  {
    id: 'transformations',
    title: 'Transformations',
    description: 'Learn about geometric transformations and symmetry.',
    level: 'Intermediate',
    category: 'Geometry',
    color: '#607D8B'
  },
  {
    id: 'sequences',
    title: 'Sequences',
    description: 'Explore patterns and progressions in number sequences.',
    level: 'Intermediate',
    category: 'Algebra',
    color: '#8BC34A'
  },
  {
    id: 'euclidean-geometry',
    title: 'Euclidean Geometry',
    description: 'Discover the classical principles of geometric construction.',
    level: 'Intermediate',
    category: 'Geometry',
    color: '#3F51B5'
  },
  {
    id: 'chaos',
    title: 'Chaos Theory',
    description: 'Learn about deterministic systems with chaotic behavior.',
    level: 'Advanced',
    category: 'Mathematics',
    color: '#9C27B0'
  }
];

// Circle course content (extracted from actual content files)
const circlesContent = {
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `
        <p>For as long as humans have existed, we have looked to the sky and tried to explain life on Earth using the motion of stars, planets and the moon.</p>
        <p>Ancient Greek astronomers were the first to discover that all celestial objects move on regular paths, called <strong>orbits</strong>. They believed that these orbits are always circular. After all, circles are the "most perfect" of all shapes: symmetric in every direction, and thus a fitting choice for the underlying order of our universe.</p>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/geocentric.svg" alt="Earth at the center of the Ptolemaic universe" />
            <p class="caption">Earth is at the center of the <em>Ptolemaic universe</em>.</p>
          </div>
        </div>
      `
    },
    {
      id: 'radius',
      title: 'Circle Properties',
      content: `
        <p>Every point on a <strong>circle</strong> has the same distance from its center. This means that they can be drawn using a compass.</p>
        <p>There are three important measurements related to circles that you need to know:</p>
        <ul>
          <li>The <strong>radius</strong> is the distance from the center of a circle to its outer rim.</li>
          <li>The <strong>diameter</strong> is the distance between two opposite points on a circle. It goes through its center, and its length is twice the radius.</li>
          <li>The <strong>circumference</strong> (or perimeter) is the distance around a circle.</li>
        </ul>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/circle-properties.svg" alt="Circle properties: radius, diameter, and circumference" />
            <p>Interactive compass demonstration would appear here in the full version.</p>
          </div>
        </div>
      `
    },
    {
      id: 'pi-definition',
      title: 'Pi and Circumference',
      content: `
        <p>You might remember that, for similar polygons, the ratio between corresponding sides is always constant. Something similar works for circles: the ratio between the <strong>circumference</strong> and the <strong>diameter</strong> is equal for <em>all circles</em>. It is always 3.14159… – a mysterious number called <strong>Pi</strong>, which is often written as the Greek letter π for "p". Pi has infinitely many decimal digits that go on forever without any specific pattern.</p>
        <p>For a circle with diameter <em>d</em>, the circumference is <strong>C = π × d</strong>. Similarly, for a circle with radius <em>r</em>, the circumference is <strong>C = 2 π r</strong>.</p>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/pi-spiral.svg" alt="Pi Spiral Visualization" />
            <p>Interactive Pi visualization would appear here in the full version.</p>
          </div>
        </div>
      `
    },
    {
      id: 'nature',
      title: 'Circles in Nature',
      content: `
        <p>Circles are perfectly symmetric, and they don't have any "weak points" like the corners of a polygon. This is one of the reasons why they can be found everywhere in nature:</p>
        <div class="image-grid">
          <div>
            <img src="/images/flower.svg" alt="Flower" />
            <p>Flowers</p>
          </div>
          <div>
            <img src="/images/earth.svg" alt="Earth" />
            <p>Planets</p>
          </div>
          <div>
            <img src="/images/ripples.svg" alt="Ripples" />
            <p>Ripples</p>
          </div>
        </div>
      `
    },
    {
      id: 'area',
      title: 'The Area of a Circle',
      content: `
        <p>But how do we actually calculate the area of a circle? Let's try the same technique we used for finding the area of quadrilaterals: we cut the shape into multiple pieces and rearrange them.</p>
        <p>If we divide a circle into multiple wedges and arrange them as shown, we can form a shape that resembles a rectangle. As we increase the number of wedges, this shape starts to look more and more like a rectangle.</p>
        <p>The height of the rectangle is equal to the radius of the circle. The width of the rectangle is equal to half the circumference of the circle. Therefore the total area is approximately:</p>
        <div class="formula">A = πr²</div>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/circle-area.jpg" alt="Calculating the area of a circle" />
            <p>Interactive area calculation demonstration would appear here.</p>
          </div>
        </div>
      `
    },
    {
      id: 'history',
      title: 'History of Pi',
      content: `
        <p>Ancient civilizations knew that the ratio between a circle's circumference and its diameter was constant, and they tried to calculate this constant (which we now call Pi) as accurately as possible.</p>
        <p>The Babylonians used the approximation 3.125, while the Egyptian Rhind Papyrus gives a value of 3.1605. The first theoretical calculation was carried out by Archimedes of Syracuse.</p>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/archimedes.svg" alt="Archimedes method of approximating Pi" />
            <p>Interactive demonstration of Archimedes calculation would appear here.</p>
          </div>
        </div>
      `
    },
    {
      id: 'applications',
      title: 'Applications of Circles',
      content: `
        <p>Circles have countless applications in science, engineering, and everyday life. From the wheels on your car to the gears in a watch, circular shapes are fundamental to mechanical systems. In architecture, circles and arcs are used for their aesthetic appeal and structural strength.</p>
        <p>In mathematics, circles form the basis for the study of trigonometry and are essential for understanding periodic functions. The properties of circles allow us to make precise measurements and create accurate designs.</p>
      `
    }
  ]
};

// Graph theory course content
const graphTheoryContent = {
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `
        <p>Graph theory is a fascinating branch of mathematics that studies the relationships between objects. A graph consists of a set of vertices (or nodes) connected by edges (or links). Despite its simple definition, graph theory has applications in countless areas, from computer science and social networks to biology and transportation.</p>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/konigsberg.svg" alt="The seven bridges of Königsberg" />
            <p class="caption">The famous seven bridges of Königsberg problem initiated the study of graph theory.</p>
          </div>
        </div>
      `
    },
    {
      id: 'euler',
      title: 'Euler Contribution',
      content: `
        <p>In 1736, the mathematician Leonhard Euler solved the famous Königsberg bridge problem by representing it as a graph. The city of Königsberg (now Kaliningrad) had seven bridges connecting four land areas. People wondered if it was possible to walk through the city crossing each bridge exactly once.</p>
        <p>Euler proved this was impossible by creating a simplified representation - what we now call a graph. He showed that such a path (now called an Eulerian path) can only exist if the graph has exactly zero or two vertices with an odd number of edges - the Königsberg graph had four such vertices.</p>
        <div class="interactive-element">
          <div class="interactive-placeholder">
            <img src="/images/euler-graph.svg" alt="Euler Graph of Königsberg" />
            <p>Interactive demonstration of the Königsberg problem would appear here.</p>
          </div>
        </div>
      `
    }
  ]
};

// Function to get AI assistant response based on course content
const getAssistantResponse = (courseId, userMessage) => {
  const course = availableCourses.find(c => c.id === courseId);
  if (!course) return "I'm sorry, I don't have information about that course.";
  
  // Convert user message to lowercase for easier matching
  const lowerMessage = userMessage.toLowerCase();
  
  // Check if the message contains terms related to the course content
  if (courseId === 'circles') {
    if (lowerMessage.includes('pi') || lowerMessage.includes('π')) {
      return "Pi (π) is the ratio of a circle's circumference to its diameter, approximately equal to 3.14159. It's a fundamental constant in mathematics with infinite decimal places that never repeat or terminate.";
    } else if (lowerMessage.includes('radius') || lowerMessage.includes('diameter')) {
      return "The radius is the distance from the center of a circle to its edge. The diameter is twice the radius and goes through the center of the circle from one edge to the opposite edge.";
    } else if (lowerMessage.includes('area')) {
      return "The area of a circle is calculated using the formula A = πr², where r is the radius. This formula can be derived by dividing the circle into many small wedges and rearranging them to form a shape resembling a rectangle.";
    } else if (lowerMessage.includes('archimedes')) {
      return "Archimedes calculated an approximation of π by inscribing and circumscribing regular polygons around a circle. By using a 96-sided polygon, he determined that π was between 3 10/71 and 3 1/7, which in decimal is approximately between 3.1408 and 3.1429.";
    } else if (lowerMessage.includes('history')) {
      return "The history of pi dates back thousands of years. Ancient Egyptians and Babylonians used approximations like 3.125. Archimedes developed a method using polygons to calculate π more precisely. By the 20th century, computers allowed us to calculate π to trillions of digits.";
    }
  } else if (courseId === 'graph-theory') {
    if (lowerMessage.includes('konigsberg') || lowerMessage.includes('königsberg') || lowerMessage.includes('bridges')) {
      return "The Königsberg bridge problem involved finding a path through the city that would cross each of its seven bridges exactly once. Euler proved this was impossible by representing the problem as a graph, showing that such a path requires a graph to have exactly zero or two vertices with an odd number of edges.";
    } else if (lowerMessage.includes('euler') || lowerMessage.includes('eulerian')) {
      return "An Eulerian path is a path in a graph that visits every edge exactly once. An Eulerian circuit is a closed path that visits every edge exactly once and returns to the starting vertex. A graph has an Eulerian circuit if and only if every vertex has an even degree and the graph is connected.";
    }
  }
  
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
    // Fetch the list of available courses from the server
    const response = await fetch('/api/content/courses');
    
    if (response.ok) {
      const coursesFromServer = await response.json();
      
      // Merge with our predefined courses, preferring server data when there's overlap
      const mergedCourses = [...availableCourses];
      
      coursesFromServer.forEach(serverCourse => {
        const existingIndex = mergedCourses.findIndex(c => c.id === serverCourse.id);
        
        if (existingIndex >= 0) {
          // Update existing course with server data
          mergedCourses[existingIndex] = {
            ...mergedCourses[existingIndex],
            ...serverCourse
          };
        } else {
          // Add new course from server
          mergedCourses.push(serverCourse);
        }
      });
      
      // Replace our availableCourses array with the merged data
      availableCourses.length = 0;
      availableCourses.push(...mergedCourses);
    }
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
  
  // Load content
  let content;
  if (courseId === 'circles') {
    content = circlesContent;
  } else if (courseId === 'graph-theory') {
    content = graphTheoryContent;
  } else {
    // Default content structure for other courses
    content = await loadContentFile(courseId);
  }
  
  return {
    course,
    content
  };
};

export const getGlossaryDefinition = (term) => {
  return getGlossaryContent(term);
};

// Get available translations for a course
export const getAvailableTranslations = async (courseId) => {
  try {
    // Fetch available translations from the server
    const response = await fetch(`/api/translations/${courseId}`);
    
    if (response.ok) {
      return await response.json();
    }
    
    // Default to English if server request fails
    return [{ code: 'en', name: 'English' }];
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
    
    // Fetch translated content from the server
    const response = await fetch(`/api/translations/${courseId}/${languageCode}`);
    
    if (response.ok) {
      return await response.json();
    }
    
    // Fall back to English if translation not available
    return await getCourseContent(courseId);
  } catch (error) {
    console.error(`Error loading translation for ${languageCode}:`, error);
    return await getCourseContent(courseId);
  }
};

export { getAssistantResponse };
