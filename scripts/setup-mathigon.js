/**
 * Setup Complete Mathigon Integration
 * 
 * This script creates the necessary structure for Mathigon integration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const MATHIGON_PUBLIC_DIR = path.join(PUBLIC_DIR, 'mathigon');
const MATHIGON_SRC_DIR = path.join(FRONTEND_DIR, 'src', 'mathigon');

// Create directory function (recursive)
function createDirIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Main function
function setupMathigon() {
  console.log('=== Setting up Mathigon Integration ===');
  
  // 1. Setup directories
  createDirIfNotExists(MATHIGON_PUBLIC_DIR);
  createDirIfNotExists(MATHIGON_SRC_DIR);
  createDirIfNotExists(path.join(MATHIGON_PUBLIC_DIR, 'content'));
  createDirIfNotExists(path.join(MATHIGON_PUBLIC_DIR, 'assets'));
  
  // 2. Create direct wrapper component 
  const wrapperComponent = `import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * MathigonCourse Component
 * 
 * This component directly integrates and renders the original Mathigon course
 * using their custom implementation.
 */
const MathigonCourse = () => {
  const { courseId, sectionId } = useParams();
  const containerRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load Mathigon scripts
    if (typeof window !== 'undefined' && containerRef.current) {
      // Start with a clean container
      containerRef.current.innerHTML = '';
      
      // Add Mathigon stylesheet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/mathigon/assets/course.css';
      document.head.appendChild(link);
      
      try {
        // Load Mathigon script
        window.courseId = courseId || 'circles';
        window.steps = sectionId || null;
        
        const script = document.createElement('script');
        script.src = '/mathigon/assets/course.js';
        script.onload = () => {
          console.log('Mathigon course.js loaded successfully');
          // Mathigon's course.js will handle the content loading and rendering
        };
        script.onerror = (err) => {
          console.error('Failed to load Mathigon script:', err);
          containerRef.current.innerHTML = '<div class="error">Failed to load Mathigon course.</div>';
        };
        
        document.body.appendChild(script);
        
        // Set up event listener for section navigation
        window.addEventListener('section-change', (e) => {
          if (e.detail && e.detail.id) {
            navigate(\`/courses/\${courseId}/\${e.detail.id}\`, { replace: true });
          }
        });
      } catch (err) {
        console.error('Error setting up Mathigon:', err);
      }
    }
    
    // Cleanup function
    return () => {
      // Remove any global variables or event listeners when component unmounts
      if (typeof window !== 'undefined') {
        window.removeEventListener('section-change', () => {});
      }
    };
  }, [courseId, sectionId, navigate]);
  
  return (
    <div className="mathigon-wrapper">
      <div id="mathigon-container" ref={containerRef} />
    </div>
  );
};

export default MathigonCourse;`;

  const wrapperPath = path.join(MATHIGON_SRC_DIR, 'MathigonCourse.jsx');
  if (!fs.existsSync(wrapperPath)) {
    fs.writeFileSync(wrapperPath, wrapperComponent);
    console.log(`Created wrapper component at ${wrapperPath}`);
  }
  
  // 3. Create index.html for the Mathigon iframe
  const mathigonHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mathigon Textbook</title>
  <link rel="stylesheet" href="/mathigon/assets/course.css">
</head>
<body>
  <script>
    // Get course parameters from URL or parent frame
    const urlParams = new URLSearchParams(window.location.search);
    window.courseId = urlParams.get('course') || 'circles';
    window.steps = urlParams.get('section') || null;
  </script>
  <script src="/mathigon/assets/course.js"></script>
</body>
</html>`;

  const htmlPath = path.join(MATHIGON_PUBLIC_DIR, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    fs.writeFileSync(htmlPath, mathigonHtml);
    console.log(`Created Mathigon HTML file at ${htmlPath}`);
  }
  
  console.log('\n=== Integration Complete ===');
  console.log('Please ensure you have course content in frontend/public/mathigon/content/');
  console.log('And course assets in frontend/public/mathigon/assets/');
}

// Run the setup
setupMathigon(); 