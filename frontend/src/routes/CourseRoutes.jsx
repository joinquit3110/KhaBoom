import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';
import CourseView from '../components/CourseView';

// Lazy load the MathigonCourse component to improve performance
const MathigonCourse = lazy(() => import('../mathigon/MathigonCourse'));

/**
 * CourseRoutes Component
 * 
 * Defines the routes for course-related pages, including course list, 
 * course content, and section navigation.
 * 
 * Includes fallback to CourseView if MathigonCourse fails
 */
const CourseRoutes = ({ userId, user }) => {
  return (
    <Routes>
      {/* Course listing page - using Dashboard component */}
      <Route path="/" element={<Dashboard user={user} />} />
      
      {/* Course pages with fallback mechanism */}
      <Route path="/:courseId" element={
        <Suspense fallback={<div className="loading-container"><div className="spinner"></div><p>Loading course...</p></div>}>
          <MathigonCourse />
        </Suspense>
      } />
      
      <Route path="/:courseId/:sectionId" element={
        <Suspense fallback={<div className="loading-container"><div className="spinner"></div><p>Loading course section...</p></div>}>
          <MathigonCourse />
        </Suspense>
      } />
      
      {/* Fallback routes that use CourseView instead of MathigonCourse */}
      <Route path="/fallback/:courseId" element={<CourseView />} />
      <Route path="/fallback/:courseId/:sectionId" element={<CourseView />} />
      
      {/* 404 Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CourseRoutes;
