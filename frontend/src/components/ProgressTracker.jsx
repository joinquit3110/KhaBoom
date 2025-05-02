import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * ProgressTracker Component
 * 
 * This component tracks a user's progress through courses and interactives,
 * saving progress to MongoDB via the Render backend API.
 */
const ProgressTracker = ({ 
  courseId, 
  currentSection = '', 
  currentStep = '',
  userId = null,
  onProgressLoaded = () => {},
}) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user progress when component mounts
  useEffect(() => {
    if (!userId || !courseId) {
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch(`${api.defaults.baseURL}/api/progress/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProgress(data);
          onProgressLoaded(data);
        } else if (response.status === 404) {
          // No progress found, create initial progress
          await createInitialProgress();
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Error loading progress:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [courseId, userId]);

  // Create initial progress record when user starts a course
  const createInitialProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return null;
      }

      const response = await fetch(`${api.defaults.baseURL}/api/progress/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sectionId: currentSection || 'introduction',
          completed: false,
          lastAccessed: new Date()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        onProgressLoaded(data);
        return data;
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error creating initial progress:', err);
      setError(err.message);
      return null;
    }
  };

  // Update progress for a step or section
  const updateProgress = async (stepId, completed = true) => {
    if (!userId || !courseId) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Extract section from step ID
      const sectionId = stepId.split('-')[0];

      const response = await fetch(`${api.defaults.baseURL}/api/progress/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sectionId,
          exerciseId: stepId,
          completed,
          lastAccessed: new Date()
        })
      });

      if (response.ok) {
        const updatedProgress = await response.json();
        setProgress(updatedProgress);
        return updatedProgress;
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setError(err.message);
      return null;
    }
  };

  // Get completion percentage for a course
  const getCompletionPercentage = () => {
    if (!progress) return 0;
    return progress.completionPercentage || 0;
  };

  // Check if a specific step has been completed
  const isStepCompleted = (stepId) => {
    if (!progress || !progress.sections) return false;
    
    // Find the section containing this step
    const section = progress.sections.find(s => 
      s.exercises?.some(e => e.exerciseId === stepId)
    );
    
    if (!section) return false;
    
    // Find the exercise for this step
    const exercise = section.exercises.find(e => e.exerciseId === stepId);
    return exercise?.completed || false;
  };

  // Navigate to next uncompleted section
  const continueProgress = () => {
    if (!progress || !progress.sections) {
      navigate(`/course/${courseId}`);
      return;
    }

    // Find first incomplete section
    const incompleteSection = progress.sections.find(section => !section.completed);
    
    if (incompleteSection) {
      navigate(`/course/${courseId}/${incompleteSection.sectionId}`);
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  // Provide tracking methods to parent components
  useEffect(() => {
    if (onProgressLoaded && progress) {
      onProgressLoaded({
        progress,
        getCompletionPercentage,
        isStepCompleted,
        updateProgress,
        continueProgress
      });
    }
  }, [progress]);

  return (
    <div className="progress-tracker" style={{ display: 'none' }}>
      {loading && <span className="loading">Loading progress...</span>}
      {error && <span className="error">Error: {error}</span>}
      {/* This is an invisible component that just provides tracking functionality */}
    </div>
  );
};

export default ProgressTracker;
