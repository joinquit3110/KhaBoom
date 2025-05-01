import React, { useState, useEffect, useRef } from 'react';
import GeoPad from './GeoPad';
import GraphPlotter from './GraphPlotter';
import CodeEditor from './CodeEditor';
import Quiz from './Quiz';
import Simulation from './Simulation';

/**
 * Main interactive component that renders different types of interactive elements
 * based on the specified type and parameters
 */
const InteractiveComponent = ({ type, params, courseId }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Simulate loading the interactive component
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [type]);
  
  const renderComponent = () => {
    switch (type) {
      case 'geopad':
        return <GeoPad params={params} courseId={courseId} />;
      case 'graph':
        return <GraphPlotter params={params} courseId={courseId} />;
      case 'code':
        return <CodeEditor params={params} courseId={courseId} />;
      case 'quiz':
        return <Quiz params={params} courseId={courseId} />;
      case 'simulation':
        return <Simulation params={params} courseId={courseId} />;
      default:
        return (
          <div className="interactive-fallback">
            <h3>Interactive Component: {type}</h3>
            <p>This interactive component type is not yet supported.</p>
            <pre>{JSON.stringify(params, null, 2)}</pre>
          </div>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="interactive-loading">
        <div className="spinner"></div>
        <p>Loading interactive component...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="interactive-error">
        <h3>Error Loading Interactive Component</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="interactive-container" ref={containerRef}>
      {renderComponent()}
    </div>
  );
};

export default InteractiveComponent;
