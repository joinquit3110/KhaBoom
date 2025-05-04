/**
 * Setup Content Script
 * 
 * This script sets up content files from the content directory to the public/content directory 
 * for easy access by the CourseReader. Rather than copying from originalweb, we use 
 * the existing content directory directly.
 * 
 * Run with: node scripts/setup-content.js
 * 
 * Note: To use the createHeroImages function, you'll need to install the canvas package:
 * npm install canvas
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Uncomment to use canvas for hero image generation
// const { createCanvas } = require('canvas');

// Paths - use content directory directly 
const SOURCE_DIR = path.join(__dirname, '..', 'content');
const TARGET_DIR = path.join(__dirname, '..', 'public', 'content');

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
  console.log(`Creating directory: ${TARGET_DIR}`);
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Check if source directory exists
if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`Source directory not found: ${SOURCE_DIR}`);
  console.error('Please make sure the content directory exists');
  process.exit(1);
}

// Get list of course directories in source
console.log('Scanning source directory for courses...');
const sourceDirs = fs.readdirSync(SOURCE_DIR).filter(name => 
  fs.statSync(path.join(SOURCE_DIR, name)).isDirectory() && 
  name !== 'shared' && 
  !name.startsWith('_') && 
  !name.startsWith('.')
);

console.log(`Found ${sourceDirs.length} course directories`);

// Copy each course directory
sourceDirs.forEach(courseDir => {
  const sourcePath = path.join(SOURCE_DIR, courseDir);
  const targetPath = path.join(TARGET_DIR, courseDir);
  
  // Check if content.md exists
  const contentMdPath = path.join(sourcePath, 'content.md');
  if (!fs.existsSync(contentMdPath)) {
    console.warn(`Warning: No content.md found in ${sourcePath}, skipping`);
    return;
  }
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    console.log(`Creating directory: ${targetPath}`);
    fs.mkdirSync(targetPath, { recursive: true });
  }
  
  // Copy content.md
  console.log(`Copying content for ${courseDir}...`);
  fs.copyFileSync(contentMdPath, path.join(targetPath, 'content.md'));
  
  // Copy styles.scss if it exists
  const stylesPath = path.join(sourcePath, 'styles.scss');
  if (fs.existsSync(stylesPath)) {
    fs.copyFileSync(stylesPath, path.join(targetPath, 'styles.scss'));
  }
  
  // Copy functions.ts if it exists
  const functionsPath = path.join(sourcePath, 'functions.ts');
  if (fs.existsSync(functionsPath)) {
    fs.copyFileSync(functionsPath, path.join(targetPath, 'functions.ts'));
  }
  
  // Copy any images
  const imagesDir = path.join(sourcePath, 'images');
  if (fs.existsSync(imagesDir) && fs.statSync(imagesDir).isDirectory()) {
    const targetImagesDir = path.join(targetPath, 'images');
    if (!fs.existsSync(targetImagesDir)) {
      fs.mkdirSync(targetImagesDir, { recursive: true });
    }
    
    // Use rsync or recursive copy depending on platform
    if (process.platform === 'win32') {
      // Windows - use recursive copy
      console.log(`Copying images for ${courseDir}...`);
      copyDirRecursiveSync(imagesDir, targetImagesDir);
    } else {
      // Unix-like OS - use rsync
      console.log(`Copying images for ${courseDir} using rsync...`);
      exec(`rsync -avh "${imagesDir}/" "${targetImagesDir}/"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error copying images for ${courseDir}: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Error copying images for ${courseDir}: ${stderr}`);
          return;
        }
      });
    }
  }
  
  // Copy hero.jpg if it exists, or create one
  const heroPath = path.join(sourcePath, 'hero.jpg');
  if (fs.existsSync(heroPath)) {
    fs.copyFileSync(heroPath, path.join(targetPath, 'hero.jpg'));
  } else {
    // Uncomment to create hero images
    // createHeroImage(courseDir);
  }
});

// Copy shared directory if it exists
const sharedSourceDir = path.join(SOURCE_DIR, 'shared');
if (fs.existsSync(sharedSourceDir) && fs.statSync(sharedSourceDir).isDirectory()) {
  const sharedTargetDir = path.join(TARGET_DIR, 'shared');
  if (!fs.existsSync(sharedTargetDir)) {
    fs.mkdirSync(sharedTargetDir, { recursive: true });
  }
  
  // Copy shared files
  console.log('Copying shared content...');
  if (process.platform === 'win32') {
    copyDirRecursiveSync(sharedSourceDir, sharedTargetDir);
  } else {
    exec(`rsync -avh "${sharedSourceDir}/" "${sharedTargetDir}/"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error copying shared content: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error copying shared content: ${stderr}`);
        return;
      }
    });
  }
}

// Create a thumbnail for courses
function createHeroImage(courseDir) {
  // Requires the 'canvas' npm package
  // npm install canvas
  try {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 450);
    gradient.addColorStop(0, '#1f7aed');
    gradient.addColorStop(1, '#0d47a1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 450);
    
    // Text
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(courseDir.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 400, 225);
    
    // Save to file
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(TARGET_DIR, courseDir, 'hero.jpg'), buffer);
    console.log(`Created hero image for ${courseDir}`);
  } catch (error) {
    console.error(`Error creating hero image for ${courseDir}: ${error.message}`);
    console.error('Make sure you have installed the canvas package: npm install canvas');
  }
}

// Helper function for recursive directory copy (Windows)
function copyDirRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyDirRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Content setup completed!');
console.log(`Copied content for ${sourceDirs.length} courses to ${TARGET_DIR}`);
console.log('You can now access the content at /content/{courseId}/content.md'); 