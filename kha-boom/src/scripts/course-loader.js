import { ElementView, $N } from '@mathigon/boost';

/**
 * A class for loading and displaying course content from Mathigon.
 */
export class CourseLoader {
  constructor() {
    this.courseGrid = new ElementView('.course-grid');
    
    // Sample course data (in a real implementation, this would come from an API)
    this.courses = [
      {
        id: 'polygons',
        title: 'Polygons and Polyhedra',
        description: 'Investigate the properties of two- and three-dimensional shapes.',
        level: 'Intermediate',
        duration: '3 hours',
        image: 'https://mathigon.org/images/thumbnails/polygons.jpg'
      },
      {
        id: 'circles',
        title: 'Circles and Pi',
        description: 'Explore the mathematical properties of circles and discover the value of π.',
        level: 'Beginner',
        duration: '2 hours',
        image: 'https://mathigon.org/images/thumbnails/circles.jpg'
      },
      {
        id: 'graph-theory',
        title: 'Graph Theory',
        description: 'Discover the mathematical properties of networks and connections.',
        level: 'Advanced',
        duration: '4 hours',
        image: 'https://mathigon.org/images/thumbnails/graph-theory.jpg'
      }
    ];
  }
  
  /**
   * Loads and displays featured courses on the homepage
   */
  loadFeaturedCourses() {
    // Clear any existing courses
    this.courseGrid.removeChildren();
    
    // Add course cards
    this.courses.forEach(course => {
      const card = this._createCourseCard(course);
      this.courseGrid.append(card);
    });
  }
  
  /**
   * Creates a course card element
   * @param {Object} course - The course data
   * @returns {HTMLElement} The course card element
   * @private
   */
  _createCourseCard(course) {
    const card = $N('div', { class: 'course-card' });
    
    // Create image container
    const imageContainer = $N('div', { class: 'course-image' });
    const image = $N('img', { 
      src: course.image, 
      alt: course.title,
      loading: 'lazy'
    });
    imageContainer.append(image);
    
    // Create content container
    const content = $N('div', { class: 'course-content' });
    
    // Create title
    const title = $N('h3', { class: 'course-title' });
    const titleLink = $N('a', { href: `/courses/${course.id}` }, course.title);
    title.append(titleLink);
    
    // Create description
    const description = $N('p', { class: 'course-description' }, course.description);
    
    // Create metadata
    const metadata = $N('div', { class: 'course-metadata' });
    
    const level = $N('span', { class: 'course-level' }, course.level);
    const duration = $N('span', { class: 'course-duration' }, course.duration);
    
    metadata.append(level, duration);
    
    // Create button
    const button = $N('a', { 
      class: 'btn btn-primary course-button',
      href: `/courses/${course.id}`
    }, 'Start Learning');
    
    // Assemble card
    content.append(title, description, metadata, button);
    card.append(imageContainer, content);
    
    // Add interactive effects
    this._addInteractiveEffects(card, course);
    
    return card;
  }
  
  /**
   * Adds interactive effects to a course card
   * @param {HTMLElement} card - The course card element
   * @param {Object} course - The course data
   * @private
   */
  _addInteractiveEffects(card, course) {
    // Add hover effect
    card.on('mouseenter', () => {
      card.addClass('hover');
    });
    
    card.on('mouseleave', () => {
      card.removeClass('hover');
    });
    
    // Add click event for the whole card
    card.on('click', (event) => {
      // But only if the click wasn't on a link or button
      const isLinkOrButton = event.target.tagName === 'A' || event.target.tagName === 'BUTTON';
      if (!isLinkOrButton) {
        window.location.href = `/courses/${course.id}`;
      }
    });
  }
  
  /**
   * Loads a specific course by ID
   * @param {string} courseId - The course ID to load
   * @returns {Promise<Object>} The course data
   */
  async loadCourse(courseId) {
    // In a real implementation, this would fetch data from an API
    // For now, we'll just find the course in our sample data
    const course = this.courses.find(c => c.id === courseId);
    
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }
    
    return course;
  }
  
  /**
   * Loads course content based on ID and section
   * @param {string} courseId - The course ID
   * @param {string} [sectionId='introduction'] - The section ID
   * @returns {Promise<Object>} The section content
   */
  async loadCourseContent(courseId, sectionId = 'introduction') {
    // In a real implementation, this would fetch content from an API
    // For demo purposes, we'll just return a placeholder
    return {
      title: `${courseId} - ${sectionId}`,
      content: `<p>This is the content for ${sectionId} section of the ${courseId} course.</p>`,
      interactive: true
    };
  }
} 