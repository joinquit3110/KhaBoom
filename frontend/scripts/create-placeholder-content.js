/**
 * create-placeholder-content.js
 * 
 * This script creates placeholder JSON files for Mathigon courses 
 * that might be referenced but don't have content.
 * It helps prevent errors when a course is requested but not available.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirp } from 'mkdirp';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the public mathigon content directory
const PUBLIC_CONTENT_DIR = path.join(__dirname, '../public/mathigon/content');
const DIST_CONTENT_DIR = path.join(__dirname, '../dist/mathigon/content');

// List of common course IDs that might be referenced
const COMMON_COURSES = [
  'circles',
  'triangles',
  'probability',
  'algebra',
  'functions',
  'sequences',
  'polyhedra',
  'quadratics',
  'transformations',
  'graphs-and-networks'
];

// Create a minimal placeholder content.json
const placeholderContent = {
  sections: [
    {
      id: 'intro',
      title: 'Introduction',
      content: '<p>This is a placeholder content for this course. The actual content is not available at this time.</p>'
    }
  ]
};

/**
 * Creates placeholder content.json files for all courses in the list
 */
async function createPlaceholderContent() {
  console.log('Creating placeholder content files...');
  
  // Ensure the target directory exists
  await mkdirp(DIST_CONTENT_DIR);
  
  // Process each course
  for (const courseId of COMMON_COURSES) {
    const courseDir = path.join(DIST_CONTENT_DIR, courseId);
    const publicCourseDir = path.join(PUBLIC_CONTENT_DIR, courseId);
    const jsonPath = path.join(courseDir, 'content.json');
    
    // If the actual content exists in public directory, don't create a placeholder
    if (fs.existsSync(path.join(publicCourseDir, 'content.json'))) {
      console.log(`✓ Actual content exists for ${courseId}`);
      continue;
    }
    
    // Create course directory if it doesn't exist
    await mkdirp(courseDir);
    
    // Create the placeholder content.json file
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(placeholderContent, null, 2)
    );
    
    console.log(`✓ Created placeholder content for ${courseId}`);
  }
  
  console.log('✅ Placeholder content creation complete');
}

// Run the script
createPlaceholderContent().catch(err => {
  console.error('Error creating placeholder content:', err);
  process.exit(1);
}); 