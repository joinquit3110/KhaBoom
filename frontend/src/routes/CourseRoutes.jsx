import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CourseRenderer from '../components/CourseRenderer';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';

/**
 * CourseRoutes Component
 * 
 * Defines the routes for course-related pages, including course list, 
 * course content, and section navigation.
 */
const CourseRoutes = ({ userId, user }) => {
  return (
    <Routes>
      {/* Course listing page - using Dashboard component */}
      <Route path="/" element={<Dashboard user={user} />} />
      
      {/* Course home page */}
      <Route path="/:courseId" element={<CourseRenderer userId={userId} />} />
      
      {/* Course section page */}
      <Route path="/:courseId/:sectionId" element={<CourseRenderer userId={userId} />} />
      
      {/* 404 Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CourseRoutes;
