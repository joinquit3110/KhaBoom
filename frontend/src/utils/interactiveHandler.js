/**
 * Interactive Elements Handler for KhaBoom
 * 
 * This utility processes interactive elements from Mathigon courses
 * and connects them to the MongoDB backend for progress tracking.
 */

import api from '../services/api';

// Store active interactives by stepId
const activeInteractives = new Map();

// Initialize interactive element for a specific step
export const initInteractive = (stepId, element, type, params = {}) => {
  if (!stepId || !element) return null;
  
  // Create interactive context
  const interactive = {
    stepId,
    element,
    type,
    params,
    completed: false,
    state: {},
    watchers: new Set()
  };
  
  // Store in active interactives map
  if (!activeInteractives.has(stepId)) {
    activeInteractives.set(stepId, new Map());
  }
  
  // Generate a unique ID for this interactive within the step
  const interactiveId = `${type}-${activeInteractives.get(stepId).size}`;
  activeInteractives.get(stepId).set(interactiveId, interactive);
  
  // Return the interactive object
  return interactive;
};

// Mark an interactive as completed
export const completeInteractive = async (stepId, interactiveId, userId = null) => {
  if (!activeInteractives.has(stepId)) return false;
  
  const step = activeInteractives.get(stepId);
  if (!step.has(interactiveId)) return false;
  
  const interactive = step.get(interactiveId);
  interactive.completed = true;
  
  // Notify watchers
  interactive.watchers.forEach(watcher => {
    try {
      watcher(interactive);
    } catch (e) {
      console.error('Error in interactive watcher:', e);
    }
  });
  
  // Track progress in MongoDB if userId is provided
  if (userId) {
    try {
      const courseId = stepId.split('-')[0]; // Extract course ID from step ID
      
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(api.defaults.baseURL + '/api/progress/' + courseId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sectionId: stepId.split('-')[0], // Course ID as section ID
          exerciseId: stepId,
          completed: true
        })
      });
      
      if (response.ok) {
        console.log(`Progress saved for ${stepId}`);
        return true;
      }
      
      console.error('Failed to save progress:', response.statusText);
      return false;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }
  
  return true;
};

// Check if all interactives in a step are completed
export const isStepCompleted = (stepId) => {
  if (!activeInteractives.has(stepId)) return false;
  
  const step = activeInteractives.get(stepId);
  if (step.size === 0) return true; // No interactives means it's completed
  
  // Check if all interactives are completed
  for (const interactive of step.values()) {
    if (!interactive.completed) return false;
  }
  
  return true;
};

// Load interactives for a specific step
export const loadInteractives = async (stepId, courseId, userId = null) => {
  if (!stepId || !courseId) return false;
  
  try {
    // Clear any existing interactives for this step
    if (activeInteractives.has(stepId)) {
      activeInteractives.delete(stepId);
    }
    
    // If userId is provided, load progress from MongoDB
    if (userId) {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await fetch(api.defaults.baseURL + '/api/progress/' + courseId, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const progressData = await response.json();
        
        // Find the section containing this step
        const section = progressData.sections?.find(s => 
          s.exercises?.some(e => e.exerciseId === stepId)
        );
        
        if (section) {
          // Find the exercise for this step
          const exercise = section.exercises.find(e => e.exerciseId === stepId);
          
          if (exercise && exercise.completed) {
            // Mark all interactives as completed
            const step = new Map();
            step.set('auto-completed', {
              stepId,
              completed: true,
              state: {}
            });
            activeInteractives.set(stepId, step);
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error loading interactives for ${stepId}:`, error);
    return false;
  }
};

// Function to create specialized interactive handlers for different types
export const createInteractiveHandlers = {
  // Handler for sliders
  slider: (element, params, stepId) => {
    const interactive = initInteractive(stepId, element, 'slider', params);
    if (!interactive) return null;
    
    return {
      onChange: (value) => {
        interactive.state.value = value;
        
        // Check if this slider completed a goal
        if (params.goal && value === params.goal) {
          completeInteractive(stepId, `slider-${params.id || 0}`);
        }
      },
      onComplete: () => completeInteractive(stepId, `slider-${params.id || 0}`)
    };
  },
  
  // Handler for multiple choice questions
  picker: (element, params, stepId) => {
    const interactive = initInteractive(stepId, element, 'picker', params);
    if (!interactive) return null;
    
    return {
      onSelect: (choice, isCorrect) => {
        interactive.state.choice = choice;
        interactive.state.isCorrect = isCorrect;
        
        if (isCorrect) {
          completeInteractive(stepId, `picker-${params.id || 0}`);
        }
      }
    };
  },
  
  // Handler for blank inputs
  blank: (element, params, stepId) => {
    const interactive = initInteractive(stepId, element, 'blank', params);
    if (!interactive) return null;
    
    return {
      onInput: (value, isCorrect) => {
        interactive.state.value = value;
        
        if (isCorrect) {
          completeInteractive(stepId, `blank-${params.id || 0}`);
        }
      }
    };
  },
  
  // Handler for geopads
  geopad: (element, params, stepId) => {
    const interactive = initInteractive(stepId, element, 'geopad', params);
    if (!interactive) return null;
    
    return {
      onDraw: (points) => {
        interactive.state.points = points;
      },
      onComplete: () => completeInteractive(stepId, `geopad-${params.id || 0}`)
    };
  }
};

export default {
  initInteractive,
  completeInteractive,
  isStepCompleted,
  loadInteractives,
  createInteractiveHandlers
};
