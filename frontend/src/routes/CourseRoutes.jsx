import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CourseRenderer from '../components/CourseRenderer';
import CourseList from '../components/CourseList';
import NotFound from '../components/NotFound';

/**
 * CourseRoutes Component
 * 
 * Defines the routes for course-related pages, including course list, 
 * course content, and section navigation.
 */
const CourseRoutes = ({ userId }) => {
  return (
    <Routes>
      {/* Course listing page */}
      <Route path="/" element={<CourseList userId={userId} />} />
      
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
