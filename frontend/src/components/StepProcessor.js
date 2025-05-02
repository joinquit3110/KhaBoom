import React, { useEffect, useRef, useState } from 'react';
import interactiveHandler from '../utils/interactiveHandler';
import { useParams } from 'react-router-dom';

/**
 * StepProcessor Component
 * 
 * Renders and processes interactive Mathigon course steps with MongoDB integration
 */
const StepProcessor = ({ 
  stepId, 
  stepContent,
  userId,
  onComplete = () => {}
}) => {
  const [completed, setCompleted] = useState(false);
  const [interactives, setInteractives] = useState([]);
  const stepRef = useRef(null);
  const { courseId } = useParams();
  
  // Process step content and initialize interactives
  useEffect(() => {
    if (!stepRef.current || !stepId || !stepContent) return;
    
    // Check if step has already been completed in MongoDB
    const checkProgress = async () => {
      if (userId) {
        const loaded = await interactiveHandler.loadInteractives(stepId, courseId, userId);
        if (loaded) {
          setCompleted(true);
          onComplete(stepId);
        }
      }
    };
    
    checkProgress();
    
    // Find and initialize all interactive elements
    const container = stepRef.current;
    
    // Process interactive elements
    const sliders = container.querySelectorAll('.interactive-element.slider');
    const pickers = container.querySelectorAll('.interactive-element.picker');
    const geopads = container.querySelectorAll('.interactive-element.geopad');
    const blanks = container.querySelectorAll('input[type="text"]');
    
    const interactiveElements = [];
    
    // Process sliders
    sliders.forEach((slider, index) => {
      const params = slider.dataset.params ? JSON.parse(slider.dataset.params) : {};
      params.id = index;
      
      const handler = interactiveHandler.createInteractiveHandlers.slider(
        slider, 
        params, 
        stepId
      );
      
      if (handler) {
        interactiveElements.push({
          type: 'slider',
          element: slider,
          handler
        });
      }
    });
    
    // Process pickers (multiple choice)
    pickers.forEach((picker, index) => {
      const params = picker.dataset.params ? JSON.parse(picker.dataset.params) : {};
      params.id = index;
      
      const handler = interactiveHandler.createInteractiveHandlers.picker(
        picker, 
        params, 
        stepId
      );
      
      if (handler) {
        interactiveElements.push({
          type: 'picker',
          element: picker,
          handler
        });
      }
    });
    
    // Process geopads
    geopads.forEach((geopad, index) => {
      const params = geopad.dataset.params ? JSON.parse(geopad.dataset.params) : {};
      params.id = index;
      
      const handler = interactiveHandler.createInteractiveHandlers.geopad(
        geopad, 
        params, 
        stepId
      );
      
      if (handler) {
        interactiveElements.push({
          type: 'geopad',
          element: geopad,
          handler
        });
      }
    });
    
    // Process blanks (input fields)
    blanks.forEach((blank, index) => {
      // Extract the correct answer from the data-answer attribute
      const answer = blank.dataset.answer;
      if (!answer) return;
      
      const params = { 
        id: index,
        answer
      };
      
      const handler = interactiveHandler.createInteractiveHandlers.blank(
        blank, 
        params, 
        stepId
      );
      
      if (handler) {
        // Add event listener to the input field
        blank.addEventListener('input', (e) => {
          const value = e.target.value;
          const isCorrect = value === answer;
          handler.onInput(value, isCorrect);
        });
        
        interactiveElements.push({
          type: 'blank',
          element: blank,
          handler
        });
      }
    });
    
    setInteractives(interactiveElements);
    
    // Check for completion whenever interactives change
    const checkCompletion = () => {
      if (interactiveHandler.isStepCompleted(stepId)) {
        setCompleted(true);
        onComplete(stepId);
      }
    };
    
    // Set up an interval to periodically check for completion
    const intervalId = setInterval(checkCompletion, 1000);
    
    // Clean up event listeners when component unmounts
    return () => {
      clearInterval(intervalId);
      blanks.forEach(blank => {
        blank.removeEventListener('input', blank._inputHandler);
      });
    };
  }, [stepId, stepContent, userId]);
  
  return (
    <div 
      ref={stepRef} 
      className={`step ${completed ? 'completed' : ''}`} 
      data-step-id={stepId}
    >
      <div dangerouslySetInnerHTML={{ __html: stepContent }} />
      
      {/* Visual indicator for completion status */}
      {completed && (
        <div className="completion-indicator">
          <span className="checkmark">✓</span> Step completed
        </div>
      )}
    </div>
  );
};

export default StepProcessor;
