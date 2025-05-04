/**
 * Setup Complete Mathigon Integration
 * 
 * This script copies and integrates the entire Mathigon textbooks-master application
 * into our frontend for direct use.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const SOURCE_DIR = path.join(__dirname, '..', 'originalweb', 'textbooks-master');
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

// Copy file function
function copyFile(src, dest) {
  try {
    // Create the target directory if it doesn't exist
    const destDir = path.dirname(dest);
    createDirIfNotExists(destDir);
    
    // Copy the file
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${src} -> ${dest}`);
    return true;
  } catch (err) {
    console.error(`Error copying ${src}: ${err.message}`);
    return false;
  }
}

// Copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    return 0;
  }
  
  createDirIfNotExists(dest);
  let count = 0;
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else {
      if (copyFile(srcPath, destPath)) {
        count++;
      }
    }
  }
  
  return count;
}

// Main function
function setupMathigon() {
  console.log('=== Setting up Complete Mathigon Integration ===');
  
  // 1. Setup directories
  createDirIfNotExists(MATHIGON_PUBLIC_DIR);
  createDirIfNotExists(MATHIGON_SRC_DIR);
  
  // 2. Copy frontend assets
  const assetsDir = path.join(SOURCE_DIR, 'frontend', 'assets');
  const destAssetsDir = path.join(MATHIGON_PUBLIC_DIR, 'assets');
  console.log('Copying frontend assets...');
  const assetsCount = copyDirRecursive(assetsDir, destAssetsDir);
  console.log(`Copied ${assetsCount} asset files`);
  
  // 3. Copy content directory
  const contentDir = path.join(SOURCE_DIR, 'content');
  const destContentDir = path.join(MATHIGON_PUBLIC_DIR, 'content');
  console.log('Copying content directory...');
  const contentCount = copyDirRecursive(contentDir, destContentDir);
  console.log(`Copied ${contentCount} content files`);
  
  // 4. Create direct wrapper component 
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
  fs.writeFileSync(wrapperPath, wrapperComponent);
  console.log(`Created wrapper component at ${wrapperPath}`);
  
  // 5. Create index.html for the Mathigon iframe
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
  fs.writeFileSync(htmlPath, mathigonHtml);
  console.log(`Created Mathigon HTML file at ${htmlPath}`);
  
  // 6. Modify routes to include Mathigon course rendering
  console.log('Setup complete! Please update your CourseRoutes.jsx to use the new MathigonCourse component.');
  
  console.log('\nAdd the following import to CourseRoutes.jsx:');
  console.log('import MathigonCourse from "../mathigon/MathigonCourse";');
  
  console.log('\nUpdate your routes to use the MathigonCourse component:');
  console.log('<Route path="/courses/:courseId/:sectionId?" element={<MathigonCourse />} />');
  
  console.log('\n=== Integration Complete ===');
  console.log('Total files copied:', assetsCount + contentCount + 2);
}

// Run the setup
setupMathigon(); 