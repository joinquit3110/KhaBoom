import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProgressTracker from './ProgressTracker';
import StepProcessor from './StepProcessor';
import api from '../services/api';

/**
 * CourseRenderer Component
 * 
 * Renders Mathigon courses with interactive elements and tracks progress in MongoDB
 */
const CourseRenderer = ({ userId }) => {
  const { courseId, sectionId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(null);
  const [progressTools, setProgressTools] = useState(null);
  
  // Load course content
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        
        // Load course data from API
        const response = await api.get(`/api/courses/${courseId}`);
        const courseData = response.data;
        setCourse(courseData);
        
        // Load content data from API
        const contentResponse = await api.get(`/api/content/${courseId}`);
        const contentData = contentResponse.data;
        setContent(contentData);
        
        // Set initial step based on section or default to first step
        if (sectionId && contentData.sections) {
          const section = contentData.sections.find(s => s.id === sectionId);
          if (section && section.steps && section.steps.length > 0) {
            setCurrentStep(section.steps[0].id);
          }
        } else if (contentData.sections && contentData.sections[0].steps) {
          setCurrentStep(contentData.sections[0].steps[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course. Please try again later.');
        setLoading(false);
      }
    };
    
    if (courseId) {
      loadCourse();
    }
  }, [courseId, sectionId]);
  
  // Handle step completion
  const handleStepComplete = useCallback((stepId) => {
    if (!progressTools || !userId) return;
    
    // Update progress in MongoDB
    progressTools.updateProgress(stepId, true).then(() => {
      console.log(`Step ${stepId} completed and saved to MongoDB`);
      
      // Find next step
      if (content && content.sections) {
        // Find current section
        const sectionId = stepId.split('-')[0];
        const currentSection = content.sections.find(s => s.id === sectionId);
        
        if (currentSection && currentSection.steps) {
          // Find current step index
          const stepIndex = currentSection.steps.findIndex(s => s.id === stepId);
          
          // If there's a next step in this section, navigate to it
          if (stepIndex < currentSection.steps.length - 1) {
            const nextStep = currentSection.steps[stepIndex + 1];
            setCurrentStep(nextStep.id);
          } else {
            // Find next section
            const sectionIndex = content.sections.findIndex(s => s.id === sectionId);
            
            if (sectionIndex < content.sections.length - 1) {
              const nextSection = content.sections[sectionIndex + 1];
              
              // Mark section as completed
              progressTools.updateProgress(sectionId, true).then(() => {
                // If auto-advance is enabled, navigate to next section
                if (course?.autoAdvance) {
                  navigate(`/course/${courseId}/${nextSection.id}`);
                }
              });
            } else {
              // Course completed
              console.log('Course completed!');
              
              // Mark entire course as completed
              progressTools.updateProgress(`${courseId}-complete`, true);
            }
          }
        }
      }
    });
  }, [progressTools, userId, content, course, courseId, navigate]);
  
  // Handle progress loaded from MongoDB
  const handleProgressLoaded = useCallback((tools) => {
    setProgressTools(tools);
    setProgress(tools.progress);
    
    // If current step is already completed and auto-advance is enabled,
    // move to the first incomplete step
    if (tools.isStepCompleted(currentStep) && course?.autoAdvance) {
      // Find first incomplete step
      if (content && content.sections) {
        for (const section of content.sections) {
          for (const step of section.steps || []) {
            if (!tools.isStepCompleted(step.id)) {
              setCurrentStep(step.id);
              return;
            }
          }
        }
      }
    }
  }, [currentStep, course, content]);
  
  // Render current step
  const renderCurrentStep = () => {
    if (!content || !content.sections) return null;
    
    // Find step content
    for (const section of content.sections) {
      const step = (section.steps || []).find(s => s.id === currentStep);
      
      if (step) {
        return (
          <StepProcessor
            key={step.id}
            stepId={step.id}
            stepContent={step.content}
            userId={userId}
            onComplete={handleStepComplete}
          />
        );
      }
    }
    
    return <div className="error">Step not found</div>;
  };
  
  // Render section navigation
  const renderSectionNav = () => {
    if (!content || !content.sections) return null;
    
    return (
      <div className="section-nav">
        {content.sections.map(section => (
          <div 
            key={section.id}
            className={`section-nav-item ${sectionId === section.id ? 'active' : ''} ${
              progress?.sections?.find(s => s.sectionId === section.id)?.completed 
                ? 'completed' 
                : ''
            }`}
            onClick={() => navigate(`/course/${courseId}/${section.id}`)}
          >
            {section.title}
            {progress?.sections?.find(s => s.sectionId === section.id)?.completed && (
              <span className="checkmark">✓</span>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="course-renderer">
      {/* Progress tracking (invisible component) */}
      <ProgressTracker
        courseId={courseId}
        currentSection={sectionId}
        currentStep={currentStep}
        userId={userId}
        onProgressLoaded={handleProgressLoaded}
      />
      
      {loading ? (
        <div className="loading">Loading course content...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="course-content">
          {/* Course header */}
          <div className="course-header">
            <h1>{course?.title}</h1>
            {progress && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress.completionPercentage || 0}%` }}
                />
                <span className="progress-text">
                  {progress.completionPercentage || 0}% Complete
                </span>
              </div>
            )}
          </div>
          
          {/* Section navigation */}
          {renderSectionNav()}
          
          {/* Current step content */}
          <div className="step-content">
            {renderCurrentStep()}
          </div>
          
          {/* Step navigation */}
          <div className="step-nav">
            {progressTools && (
              <button 
                className="continue-button"
                onClick={() => progressTools.continueProgress()}
              >
                Continue Learning
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRenderer;
