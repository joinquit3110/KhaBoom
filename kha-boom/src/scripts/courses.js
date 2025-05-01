import { Browser } from '@mathigon/boost';
import { ChatBot } from './chatbot.js';
import { Notification } from './notification.js';
import { CourseLoader } from './course-loader.js';

/**
 * Manages the courses listing page
 */
class CoursesPage {
  constructor() {
    this.courseLoader = new CourseLoader();
    this.initChatBot();
    this.initNotifications();
    this.loadCourses();
    this.setupSearch();
    this.setupFilters();
  }
  
  /**
   * Initializes the chat bot
   */
  initChatBot() {
    this.chatBot = new ChatBot({
      containerSelector: '#tutor-panel',
      headerSelector: '.tutor-header',
      messagesSelector: '.tutor-messages',
      inputSelector: '.tutor-input input',
      sendButtonSelector: '.send-btn',
      closeButtonSelector: '.close-btn'
    });
  }
  
  /**
   * Initializes the notification system
   */
  initNotifications() {
    this.notification = new Notification({
      containerSelector: '#notification-container'
    });
    
    this.notification.show({
      type: 'info',
      title: 'Browse Courses',
      message: 'Explore our interactive math courses or use the search to find specific topics',
      duration: 4000
    });
  }
  
  /**
   * Loads courses and displays them
   */
  loadCourses() {
    this.courseLoader.loadFeaturedCourses();
  }
  
  /**
   * Sets up the search functionality
   */
  setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    
    if (!searchInput || !searchButton) return;
    
    // Search function
    const performSearch = () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        this.loadCourses();
        return;
      }
      
      // Filter courses based on query
      const filteredCourses = this.courseLoader.courses.filter(course => {
        return (
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.level.toLowerCase().includes(query)
        );
      });
      
      // Clear existing courses
      const courseGrid = document.getElementById('course-grid');
      courseGrid.innerHTML = '';
      
      // Show filtered courses
      if (filteredCourses.length > 0) {
        filteredCourses.forEach(course => {
          const card = this.courseLoader._createCourseCard(course);
          courseGrid.appendChild(card);
        });
        
        this.notification.show({
          type: 'success',
          title: 'Search Results',
          message: `Found ${filteredCourses.length} courses matching "${query}"`,
          duration: 3000
        });
      } else {
        // Show no results message
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
          <h3>No courses found</h3>
          <p>No courses match your search for "${query}". Try a different search term.</p>
          <button class="btn btn-primary">Show All Courses</button>
        `;
        
        // Add event listener to "Show All Courses" button
        noResults.querySelector('button').addEventListener('click', () => {
          searchInput.value = '';
          this.loadCourses();
        });
        
        courseGrid.appendChild(noResults);
        
        this.notification.show({
          type: 'info',
          title: 'No Results',
          message: `No courses found matching "${query}"`,
          duration: 3000
        });
      }
    };
    
    // Set up event listeners
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  /**
   * Sets up the filter functionality
   */
  setupFilters() {
    const levelFilter = document.querySelector('.filter-options select:first-child');
    const topicFilter = document.querySelector('.filter-options select:last-child');
    
    if (!levelFilter || !topicFilter) return;
    
    const applyFilters = () => {
      const levelValue = levelFilter.value.toLowerCase();
      const topicValue = topicFilter.value.toLowerCase();
      
      // Apply filters
      const filteredCourses = this.courseLoader.courses.filter(course => {
        const levelMatch = !levelValue || course.level.toLowerCase() === levelValue;
        
        // For topics, we'd need to have topic data in the courses
        // This is a simplification
        const topicMatch = !topicValue;
        
        return levelMatch && topicMatch;
      });
      
      // Clear existing courses
      const courseGrid = document.getElementById('course-grid');
      courseGrid.innerHTML = '';
      
      // Show filtered courses
      if (filteredCourses.length > 0) {
        filteredCourses.forEach(course => {
          const card = this.courseLoader._createCourseCard(course);
          courseGrid.appendChild(card);
        });
        
        this.notification.show({
          type: 'info',
          title: 'Filters Applied',
          message: `Showing ${filteredCourses.length} filtered courses`,
          duration: 2000
        });
      } else {
        // Show no results message
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
          <h3>No courses found</h3>
          <p>No courses match your selected filters. Try different filter options.</p>
          <button class="btn btn-primary">Reset Filters</button>
        `;
        
        // Add event listener to "Reset Filters" button
        noResults.querySelector('button').addEventListener('click', () => {
          levelFilter.value = '';
          topicFilter.value = '';
          this.loadCourses();
        });
        
        courseGrid.appendChild(noResults);
      }
    };
    
    // Set up event listeners
    levelFilter.addEventListener('change', applyFilters);
    topicFilter.addEventListener('change', applyFilters);
  }
}

// Initialize the courses page when the DOM is ready
Browser.ready.then(() => {
  new CoursesPage();
}); 