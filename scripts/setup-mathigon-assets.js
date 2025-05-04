/**
 * Setup Mathigon Assets Script
 * 
 * This script copies essential Mathigon assets from the originalweb/textbooks-master
 * to the public directory to ensure proper rendering.
 */

const fs = require('fs');
const path = require('path');

// Paths
const SOURCE_DIR = path.join(__dirname, '..', 'originalweb', 'textbooks-master');
const TARGET_DIR = path.join(__dirname, '..', 'frontend', 'public', 'mathigon-assets');

// Assets to copy
const ASSETS_TO_COPY = [
  { 
    src: path.join(SOURCE_DIR, 'frontend', 'assets', 'course.js'),
    dest: path.join(TARGET_DIR, 'js', 'course.js')
  },
  { 
    src: path.join(SOURCE_DIR, 'frontend', 'assets', 'course.css'),
    dest: path.join(TARGET_DIR, 'css', 'course.css')
  },
  // Add other assets as needed: images, SVGs, etc.
];

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

// Main function
function setupMathigonAssets() {
  console.log('Setting up Mathigon assets...');
  
  // Create main target directory
  createDirIfNotExists(TARGET_DIR);
  
  // Copy each asset
  let successCount = 0;
  for (const asset of ASSETS_TO_COPY) {
    if (copyFile(asset.src, asset.dest)) {
      successCount++;
    }
  }
  
  // Create symbolic links for SVG directories
  try {
    const svgSourceDir = path.join(SOURCE_DIR, 'content');
    const svgTargetDir = path.join(TARGET_DIR, 'svg');
    
    // Create the svg target directory
    createDirIfNotExists(svgTargetDir);
    
    // Copy SVG directories from content folders
    if (fs.existsSync(svgSourceDir)) {
      const contentDirs = fs.readdirSync(svgSourceDir);
      
      for (const dir of contentDirs) {
        const svgDir = path.join(svgSourceDir, dir, 'svg');
        if (fs.existsSync(svgDir)) {
          const targetSvgDir = path.join(svgTargetDir, dir);
          
          // Create directory for this course's SVGs
          createDirIfNotExists(targetSvgDir);
          
          // Copy all SVG files
          const svgFiles = fs.readdirSync(svgDir);
          for (const file of svgFiles) {
            if (file.endsWith('.svg')) {
              copyFile(path.join(svgDir, file), path.join(targetSvgDir, file));
              successCount++;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error setting up SVG directories: ${err.message}`);
  }
  
  console.log(`Completed setup: ${successCount} files copied.`);
}

// Run the setup
setupMathigonAssets(); 