/**
 * build-content-json.js
 * 
 * This script converts Markdown content files to JSON format required by Mathigon.
 * It processes all course content in the specified directories and outputs JSON files
 * that contain the properly formatted content for Mathigon's interactive components.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const matter = require('gray-matter');
const glob = promisify(require('glob'));
const mkdirp = require('mkdirp');

// Configuration
const CONTENT_SRC_DIR = path.join(__dirname, '../src/courses');
const CONTENT_DEST_DIR = path.join(__dirname, '../public/mathigon/content');
const ASSETS_DEST_DIR = path.join(__dirname, '../public/mathigon/assets');

/**
 * Converts Markdown content to the Mathigon JSON format
 * @param {string} markdown - The markdown content
 * @param {Object} frontMatter - The frontmatter metadata
 * @returns {Object} - The formatted JSON object
 */
function convertToMathigonJSON(markdown, frontMatter) {
  // Split the markdown into sections (separated by ---)
  const sections = markdown.split(/^---$/m).filter(section => section.trim());
  
  // Process each section
  const processedSections = sections.map(section => {
    // Extract section metadata (lines starting with >)
    const metaLines = section.match(/^>\s.+$/gm) || [];
    const metaText = metaLines.map(line => line.replace(/^>\s/, '')).join('\n');
    const meta = matter('---\n' + metaText + '\n---').data;
    
    // Remove metadata lines from content
    let content = section.replace(/^>\s.+$/gm, '').trim();
    
    // Create section object
    return {
      id: meta.id || null,
      section: meta.section || null,
      title: meta.title || null,
      color: meta.color ? `"${meta.color}"` : null, // Ensure color is properly quoted
      level: meta.level || null,
      next: meta.next || null,
      goals: meta.goals || null,
      content: content
    };
  });
  
  // Create the final JSON structure
  return {
    sections: processedSections.filter(section => section.content)
  };
}

/**
 * Processes a single course directory
 * @param {string} courseDir - Path to the course directory
 */
async function processCourse(courseDir) {
  const courseName = path.basename(courseDir);
  console.log(`Processing course: ${courseName}...`);
  
  // Ensure destination directories exist
  const courseDestDir = path.join(CONTENT_DEST_DIR, courseName);
  await mkdirp(courseDestDir);
  
  // Process content.md file
  const contentFile = path.join(courseDir, 'content.md');
  if (fs.existsSync(contentFile)) {
    const fileContent = fs.readFileSync(contentFile, 'utf8');
    const { content, data: frontMatter } = matter(fileContent);
    
    // Convert to Mathigon JSON format
    const jsonContent = convertToMathigonJSON(content, frontMatter);
    
    // Write JSON file
    fs.writeFileSync(
      path.join(courseDestDir, 'content.json'),
      JSON.stringify(jsonContent, null, 2)
    );
    
    // Also copy the original MD file for reference
    fs.copyFileSync(contentFile, path.join(courseDestDir, 'content.md'));
    
    console.log(`✓ Generated content.json for ${courseName}`);
  } else {
    console.warn(`⚠ No content.md found for ${courseName}`);
  }
  
  // Copy other assets (images, etc.)
  const assetDirs = ['images', 'svg', 'audio', 'components'];
  for (const dir of assetDirs) {
    const srcAssetDir = path.join(courseDir, dir);
    if (fs.existsSync(srcAssetDir)) {
      const destAssetDir = path.join(courseDestDir, dir);
      await mkdirp(destAssetDir);
      
      // Copy all files from the asset directory
      const assetFiles = await glob(`${srcAssetDir}/**/*.*`);
      for (const file of assetFiles) {
        const destFile = path.join(destAssetDir, path.relative(srcAssetDir, file));
        await mkdirp(path.dirname(destFile));
        fs.copyFileSync(file, destFile);
      }
      console.log(`✓ Copied ${dir} assets for ${courseName}`);
    }
  }
  
  // Copy hero image if exists
  const heroImage = path.join(courseDir, 'hero.jpg');
  if (fs.existsSync(heroImage)) {
    fs.copyFileSync(heroImage, path.join(courseDestDir, 'hero.jpg'));
    console.log(`✓ Copied hero image for ${courseName}`);
  }
  
  // Copy functions.ts if exists
  const functionsFile = path.join(courseDir, 'functions.ts');
  if (fs.existsSync(functionsFile)) {
    fs.copyFileSync(functionsFile, path.join(courseDestDir, 'functions.ts'));
    console.log(`✓ Copied functions.ts for ${courseName}`);
  }
  
  // Copy styles.scss if exists
  const stylesFile = path.join(courseDir, 'styles.scss');
  if (fs.existsSync(stylesFile)) {
    fs.copyFileSync(stylesFile, path.join(courseDestDir, 'styles.scss'));
    console.log(`✓ Copied styles.scss for ${courseName}`);
  }
}

/**
 * Main function to process all courses
 */
async function main() {
  try {
    // Ensure destination directories exist
    await mkdirp(CONTENT_DEST_DIR);
    await mkdirp(ASSETS_DEST_DIR);
    
    // Find all course directories
    const courseDirs = await glob(`${CONTENT_SRC_DIR}/*`);
    
    // Process each course directory
    for (const courseDir of courseDirs) {
      if (fs.statSync(courseDir).isDirectory()) {
        await processCourse(courseDir);
      }
    }
    
    // Copy shared assets
    const sharedDir = path.join(CONTENT_SRC_DIR, 'shared');
    if (fs.existsSync(sharedDir)) {
      const sharedDestDir = path.join(CONTENT_DEST_DIR, 'shared');
      await mkdirp(sharedDestDir);
      
      // Copy shared files
      const sharedFiles = await glob(`${sharedDir}/**/*.*`);
      for (const file of sharedFiles) {
        const destFile = path.join(sharedDestDir, path.relative(sharedDir, file));
        await mkdirp(path.dirname(destFile));
        fs.copyFileSync(file, destFile);
      }
      console.log('✓ Copied shared assets');
    }
    
    console.log('✅ All courses processed successfully!');
  } catch (error) {
    console.error('❌ Error processing courses:', error);
    process.exit(1);
  }
}

// Run the script
main(); 