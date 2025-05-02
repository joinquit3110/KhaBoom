/**
 * KhaBoom Progress Analytics Module
 * 
 * Provides insights and analytics on user progress through courses.
 * Helps visualize learning patterns and suggests optimal learning paths.
 */

/**
 * Calculate completion percentage for a course
 * @param {Object} progress - Course progress object
 * @returns {number} Completion percentage (0-100)
 */
export const calculateCompletion = (progress) => {
  if (!progress || !progress.sections || progress.sections.length === 0) {
    return 0;
  }

  const totalSections = progress.sections.length;
  const completedSections = progress.sections.filter(s => s.completed).length;
  
  return Math.round((completedSections / totalSections) * 100);
};

/**
 * Generate analytics based on user progress
 * @param {Object} progress - Course progress object
 * @returns {Object} Analytics data
 */
export const generateProgressAnalytics = (progress) => {
  if (!progress || !progress.sections) {
    return {
      completion: 0,
      lastActive: null,
      activeDays: 0,
      avgTimePerSection: 0,
      recommendedNextSection: null,
      learningStreak: 0,
      completionTrend: []
    };
  }

  // Calculate active days
  const activeDates = new Set();
  progress.sections.forEach(section => {
    if (section.lastAccessed) {
      const date = new Date(section.lastAccessed).toDateString();
      activeDates.add(date);
      
      // Also check exercise dates
      if (section.exercises) {
        section.exercises.forEach(exercise => {
          if (exercise.lastAttemptDate) {
            const exerciseDate = new Date(exercise.lastAttemptDate).toDateString();
            activeDates.add(exerciseDate);
          }
        });
      }
    }
  });

  // Identify incomplete sections
  const incompleteSections = progress.sections.filter(s => !s.completed);
  
  // Find recommended next section
  let recommendedNextSection = null;
  if (incompleteSections.length > 0) {
    // Sort by last accessed (most recent first)
    const sortedSections = [...incompleteSections].sort((a, b) => {
      if (!a.lastAccessed) return 1;
      if (!b.lastAccessed) return -1;
      return new Date(b.lastAccessed) - new Date(a.lastAccessed);
    });
    
    recommendedNextSection = sortedSections[0].sectionId;
  }

  // Calculate learning streak
  let learningStreak = 0;
  if (activeDates.size > 0) {
    const sortedDates = Array.from(activeDates)
      .map(date => new Date(date))
      .sort((a, b) => b - a); // Sort descending
    
    // Get most recent date
    const mostRecent = sortedDates[0];
    const today = new Date();
    
    // Reset streak if last activity was more than a day ago
    if ((today - mostRecent) > (24 * 60 * 60 * 1000)) {
      learningStreak = 0;
    } else {
      // Count consecutive days with activity
      learningStreak = 1; // Today
      let currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - 1); // Start checking from yesterday
      
      while (sortedDates.some(date => date.toDateString() === currentDate.toDateString())) {
        learningStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }
  }

  // Generate completion trend (last 5 days)
  const completionTrend = [];
  const endDate = new Date();
  for (let i = 4; i >= 0; i--) {
    const date = new Date();
    date.setDate(endDate.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Count completed sections as of this date
    const completedCount = progress.sections.filter(section => {
      if (!section.completed) return false;
      
      // If no completion date is recorded, use lastAccessed
      const completionDate = section.completionDate || section.lastAccessed;
      if (!completionDate) return false;
      
      return new Date(completionDate) <= date;
    }).length;
    
    const percentage = Math.round((completedCount / progress.sections.length) * 100);
    
    completionTrend.push({
      date: dateStr,
      percentage
    });
  }

  return {
    completion: calculateCompletion(progress),
    lastActive: progress.lastAccessed || null,
    activeDays: activeDates.size,
    recommendedNextSection,
    learningStreak,
    completionTrend
  };
};

/**
 * Generate learning insights for the user
 * @param {Object} progressData - User progress data for all courses
 * @returns {Array} Array of insights
 */
export const generateLearningInsights = (progressData) => {
  if (!progressData || !Array.isArray(progressData) || progressData.length === 0) {
    return [];
  }

  const insights = [];

  // Check for courses with high completion
  const nearlyCompleteCourses = progressData.filter(
    p => calculateCompletion(p) >= 75 && calculateCompletion(p) < 100
  );
  
  if (nearlyCompleteCourses.length > 0) {
    nearlyCompleteCourses.forEach(course => {
      insights.push({
        type: 'completion',
        courseId: course.courseId,
        message: `You're almost there! Just a few more sections to complete ${course.courseId}.`,
        priority: 'high'
      });
    });
  }

  // Check for inactive courses (started but not touched in 7+ days)
  const inactiveCourses = progressData.filter(course => {
    const lastAccessed = new Date(course.lastAccessed);
    const today = new Date();
    const daysSinceLastAccess = Math.floor((today - lastAccessed) / (1000 * 60 * 60 * 24));
    
    // Course has some progress but hasn't been accessed recently
    return calculateCompletion(course) > 0 && 
           calculateCompletion(course) < 100 && 
           daysSinceLastAccess >= 7;
  });
  
  if (inactiveCourses.length > 0) {
    inactiveCourses.forEach(course => {
      insights.push({
        type: 'inactivity',
        courseId: course.courseId,
        message: `It's been a while since you worked on ${course.courseId}. Ready to continue?`,
        priority: 'medium'
      });
    });
  }

  // Learning streak insights
  const hasStreak = progressData.some(course => {
    const analytics = generateProgressAnalytics(course);
    return analytics.learningStreak >= 3;
  });
  
  if (hasStreak) {
    insights.push({
      type: 'streak',
      courseId: null,
      message: 'Great job maintaining your learning streak! Keep it up!',
      priority: 'medium'
    });
  }

  return insights;
};

export default {
  calculateCompletion,
  generateProgressAnalytics,
  generateLearningInsights
};
