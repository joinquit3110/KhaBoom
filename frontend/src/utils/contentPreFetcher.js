/**
 * KhaBoom Content Pre-Fetcher
 * 
 * This utility pre-fetches course content in the background to improve
 * user experience and enable offline access to courses.
 */

import api from '../services/api';
import cacheManager from './cacheManager';

class ContentPreFetcher {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.concurrentFetches = 2;
    this.activeFetches = 0;
  }

  /**
   * Add course to pre-fetch queue
   * @param {string} courseId - Course ID to pre-fetch
   * @param {number} priority - Priority (1-10, 10 being highest)
   */
  queueCourse(courseId, priority = 5) {
    // Check if already in queue
    if (this.queue.some(item => item.courseId === courseId)) {
      return;
    }
    
    this.queue.push({
      courseId,
      priority,
      timestamp: Date.now()
    });
    
    this.queue.sort((a, b) => b.priority - a.priority);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the pre-fetch queue
   */
  async processQueue() {
    if (this.queue.length === 0 || this.activeFetches >= this.concurrentFetches) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && this.activeFetches < this.concurrentFetches) {
      const item = this.queue.shift();
      this.activeFetches++;
      
      this.fetchCourseContent(item.courseId)
        .finally(() => {
          this.activeFetches--;
          // Continue processing the queue
          if (this.queue.length > 0) {
            this.processQueue();
          } else {
            this.isProcessing = false;
          }
        });
    }
  }

  /**
   * Fetch and cache course content
   * @param {string} courseId - Course ID to fetch
   */
  async fetchCourseContent(courseId) {
    try {
      console.log(`Pre-fetching course: ${courseId}`);
      
      // Step 1: Fetch course metadata
      const courseData = await api.get(`/api/courses/${courseId}`);
      
      // Cache course data
      cacheManager.set(
        `course_${courseId}`, 
        courseData.data, 
        cacheManager.DURATIONS.COURSE_CONTENT,
        'local'
      );
      
      // Step 2: Fetch all sections content
      if (courseData.data && courseData.data.sections) {
        const sections = courseData.data.sections;
        
        // Pre-fetch each section content (one at a time to not overwhelm the server)
        for (const section of sections) {
          await api.get(`/api/content/${courseId}/${section.id}`).then(response => {
            // Cache section content
            cacheManager.set(
              `content_${courseId}_${section.id}`,
              response.data,
              cacheManager.DURATIONS.COURSE_CONTENT,
              'local'
            );
          });
          
          // Small delay between requests to not overwhelm the server
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`Completed pre-fetching course: ${courseId}`);
      
      // Fire event for successful pre-fetch
      window.dispatchEvent(new CustomEvent('contentPrefetched', {
        detail: { courseId }
      }));
      
      return true;
    } catch (error) {
      console.error(`Error pre-fetching course ${courseId}:`, error);
      return false;
    }
  }

  /**
   * Pre-fetch all available courses (use with caution)
   */
  async preFetchAllCourses() {
    try {
      const response = await api.get('/api/courses');
      const courses = response.data;
      
      courses.forEach((course, index) => {
        // Queue each course with decreasing priority
        this.queueCourse(course.id, 10 - index);
      });
      
      return true;
    } catch (error) {
      console.error('Error pre-fetching all courses:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const contentPreFetcher = new ContentPreFetcher();
export default contentPreFetcher;
