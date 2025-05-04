import React from 'react';
import { Route, Routes } from 'react-router-dom';
import CourseRenderer from '../components/CourseRenderer';
import CourseReader from '../components/CourseReader';
import Dashboard from '../components/Dashboard';
import NotFound from '../components/NotFound';
import MathigonCourse from '../mathigon/MathigonCourse';

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
      
      {/* Course pages - Using MathigonCourse for exact Mathigon format */}
      <Route path="/:courseId" element={<MathigonCourse />} />
      <Route path="/:courseId/:sectionId" element={<MathigonCourse />} />
      
      {/* Legacy routes - keeping as fallbacks */}
      <Route path="/reader/:courseId" element={<CourseReader />} />
      <Route path="/reader/:courseId/:sectionId" element={<CourseReader />} />
      <Route path="/legacy/:courseId" element={<CourseRenderer userId={userId} />} />
      <Route path="/legacy/:courseId/:sectionId" element={<CourseRenderer userId={userId} />} />
      
      {/* 404 Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CourseRoutes;
