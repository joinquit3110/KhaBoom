/**
 * Deployment Script for KhaBoom Learning Platform
 * This script ensures all necessary files and configuration are properly set up
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const PUBLIC_DIR = path.join(FRONTEND_DIR, 'public');
const MATHIGON_PUBLIC_DIR = path.join(PUBLIC_DIR, 'mathigon');
const MATHIGON_ASSETS_DIR = path.join(MATHIGON_PUBLIC_DIR, 'assets');
const SOURCE_DIR = path.join(ROOT_DIR, 'sourcecode', 'textbooks-master');

// Display welcome message
console.log('===================================');
console.log('KhaBoom Learning Platform Deployment');
console.log('===================================');
console.log('This script will prepare the project for deployment\n');

// Create directories if they don't exist
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Copy file or directory
function copyFileOrDir(src, dest, options = {}) {
  if (!fs.existsSync(src)) {
    console.error(`Source does not exist: ${src}`);
    return false;
  }
  
  try {
    if (fs.lstatSync(src).isDirectory()) {
      // If it's a directory, use recursive copy
      if (process.platform === 'win32') {
        execSync(`xcopy "${src}" "${dest}" /E /I /Y`);
      } else {
        execSync(`cp -R "${src}" "${dest}"`);
      }
    } else {
      // Simple file copy
      fs.copyFileSync(src, dest);
    }
    console.log(`Copied: ${src} to ${dest}`);
    return true;
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error.message);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log('Starting deployment process...');
  
  // Create necessary directories
  createDirIfNotExists(MATHIGON_PUBLIC_DIR);
  createDirIfNotExists(MATHIGON_ASSETS_DIR);
  
  console.log('\nSetting up Mathigon assets...');
  // Copy Mathigon assets from sourcecode
  if (fs.existsSync(SOURCE_DIR)) {
    console.log('Found sourcecode directory, copying original Mathigon assets...');
    
    // Copy assets
    const assetsSrc = path.join(SOURCE_DIR, 'frontend', 'assets');
    if (fs.existsSync(assetsSrc)) {
      ['course.js', 'course.css', 'icons.svg'].forEach(file => {
        const srcFile = path.join(assetsSrc, file);
        const destFile = path.join(MATHIGON_ASSETS_DIR, file);
        copyFileOrDir(srcFile, destFile);
      });
    } else {
      console.warn('⚠️ Original Mathigon assets not found in sourcecode');
    }
    
    // Copy content
    const contentSrc = path.join(SOURCE_DIR, 'content');
    const contentDest = path.join(MATHIGON_PUBLIC_DIR, 'content');
    if (fs.existsSync(contentSrc) && !fs.existsSync(contentDest)) {
      console.log('Copying Mathigon content from sourcecode...');
      copyFileOrDir(contentSrc, contentDest);
    } else if (fs.existsSync(contentDest)) {
      console.log('Content directory already exists, skipping copy.');
    } else {
      console.warn('⚠️ Original Mathigon content not found in sourcecode');
    }
  } else {
    console.warn('⚠️ Sourcecode directory not found. Checking for existing assets...');
    
    // Check if assets already exist
    const requiredAssets = ['course.js', 'course.css', 'icons.svg'].map(
      file => path.join(MATHIGON_ASSETS_DIR, file)
    );
    
    const missingAssets = requiredAssets.filter(file => !fs.existsSync(file));
    
    if (missingAssets.length > 0) {
      console.error('❌ Some required Mathigon assets are missing:');
      missingAssets.forEach(file => console.error(`   - ${file}`));
      console.error('\nPlease copy these files manually, or specify the sourcecode location.');
      process.exit(1);
    } else {
      console.log('✅ All required Mathigon assets found.');
    }
    
    // Check if content exists
    const contentDir = path.join(MATHIGON_PUBLIC_DIR, 'content');
    if (!fs.existsSync(contentDir)) {
      console.error('❌ Mathigon content directory is missing.');
      console.error('Please copy the content manually, or specify the sourcecode location.');
      process.exit(1);
    } else {
      console.log('✅ Mathigon content directory found.');
    }
  }
  
  console.log('\nVerifying configuration...');
  // Check if index.html exists
  const mathigonIndex = path.join(MATHIGON_PUBLIC_DIR, 'index.html');
  if (!fs.existsSync(mathigonIndex)) {
    console.log('Creating Mathigon index.html...');
    
    const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mathigon Textbooks</title>
  <link rel="stylesheet" href="/mathigon/assets/course.css">
  <script>
    // Global configuration
    window.mathigonConfig = {
      assetsPrefix: '/mathigon/assets/',
      contentPrefix: '/mathigon/content/'
    };
    
    // Get course parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    window.courseId = urlParams.get('course') || 'circles';
    window.steps = urlParams.get('section') || null;
  </script>
</head>
<body>
  <div id="mathigon-textbook"></div>
  <script src="/mathigon/assets/course.js"></script>
</body>
</html>`;
    
    fs.writeFileSync(mathigonIndex, indexContent);
    console.log('✅ Created Mathigon index.html');
  } else {
    console.log('✅ Mathigon index.html exists');
  }
  
  // Ensure service worker exists
  const serviceWorkerPath = path.join(PUBLIC_DIR, 'service-worker.js');
  if (!fs.existsSync(serviceWorkerPath)) {
    console.warn('⚠️ Service worker not found, this may affect offline functionality.');
  } else {
    console.log('✅ Service worker found');
  }
  
  // Ensure deployment files exist
  const netlifyConfig = path.join(ROOT_DIR, 'netlify.toml');
  if (!fs.existsSync(netlifyConfig)) {
    console.warn('⚠️ netlify.toml not found, deployment to Netlify may fail.');
  } else {
    console.log('✅ netlify.toml found');
  }
  
  console.log('\n✅ Deployment preparation complete!');
  console.log('You can now deploy the application to Netlify or other hosting platforms.');
}

// Run the deployment script
deploy().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
}); 