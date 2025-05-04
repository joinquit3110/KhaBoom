import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CourseRenderer from '../components/CourseRenderer';
import CourseReader from '../components/CourseReader';
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
      
      {/* Course home page - Using CourseReader for Mathigon format */}
      <Route path="/:courseId" element={<CourseReader />} />
      
      {/* Course section page - Using CourseReader for Mathigon format */}
      <Route path="/:courseId/:sectionId" element={<CourseReader />} />
      
      {/* Legacy renderer - keeping as fallback */}
      <Route path="/legacy/:courseId" element={<CourseRenderer userId={userId} />} />
      <Route path="/legacy/:courseId/:sectionId" element={<CourseRenderer userId={userId} />} />
      
      {/* 404 Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CourseRoutes;
