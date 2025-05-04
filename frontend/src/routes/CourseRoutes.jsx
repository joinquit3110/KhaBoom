import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';
import CourseView from '../components/CourseView';
import MathigonCourseView from '../components/MathigonCourseView';

/**
 * CourseRoutes Component
 * 
 * Defines the routes for course-related pages, including course list, 
 * course content, and section navigation.
 * 
 * Uses MathigonCourseView for Mathigon content rendering with full interactivity
 */
const CourseRoutes = ({ userId, user }) => {
  const LoadingIndicator = () => (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading course content...</p>
      <p className="small">This may take a moment for interactive elements</p>
    </div>
  );

  return (
    <Routes>
      {/* Course listing page - using Dashboard component */}
      <Route path="/" element={<Dashboard user={user} />} />
      
      {/* Main Mathigon course pages - using the dedicated MathigonCourseView component */}
      <Route path="/:courseId" element={
        <Suspense fallback={<LoadingIndicator />}>
          <MathigonCourseView />
        </Suspense>
      } />
      
      <Route path="/:courseId/:sectionId" element={
        <Suspense fallback={<LoadingIndicator />}>
          <MathigonCourseView />
        </Suspense>
      } />
      
      {/* Fallback routes that use the original CourseView as an alternative */}
      <Route path="/fallback/:courseId" element={<CourseView alternateView={true} />} />
      <Route path="/fallback/:courseId/:sectionId" element={<CourseView alternateView={true} />} />
      
      {/* Testing route for direct access to a specific course */}
      <Route path="/test/:courseId" element={
        <div style={{ padding: "20px" }}>
          <h2>Testing Mathigon Course</h2>
          <p>This is a direct iframe to test course rendering:</p>
          <iframe 
            src="/mathigon/index.html" 
            style={{ width: "100%", height: "80vh", border: "1px solid #ddd" }}
            title="Mathigon Test"
          />
          <div style={{ marginTop: "10px" }}>
            <a href="/" className="btn">Back to Dashboard</a>
          </div>
        </div>
      } />
      
      {/* 404 Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CourseRoutes;
