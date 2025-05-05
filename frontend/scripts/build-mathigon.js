/**
 * KHA-BOOM! Mathigon Build System
 * Based on Mathigon Studio's build system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { mkdirp } from 'mkdirp';
import matter from 'gray-matter';
import crypto from 'crypto';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration and directories
const PUBLIC_DIR = path.join(__dirname, '../public/mathigon');
const CONTENT_SRC_DIR = path.join(__dirname, '../src/courses');
const CONTENT_DEST_DIR = path.join(PUBLIC_DIR, 'content');
const ASSETS_DEST_DIR = path.join(PUBLIC_DIR, 'assets');
const CACHE_FILE = path.join(PUBLIC_DIR, 'cache.json');

// Default courses to include placeholders for
const DEFAULT_COURSES = [
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

// Utilities for file operations
function readFile(file, fallback = '') {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : fallback;
}

async function writeFile(file, content) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) await mkdirp(dir);
  return fs.writeFileSync(file, content);
}

async function copyFile(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) await mkdirp(dir);
  return fs.copyFileSync(src, dest);
}

function textHash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// Console utilities for logging
function success(file, duration) {
  console.log(`✅ Built ${file} in ${duration}ms`);
}

function warning(message) {
  console.log(`⚠️ WARNING: ${message}`);
}

function error(file) {
  return (err) => {
    console.error(`❌ ERROR building ${file}:\n`, err);
    // We don't exit the process to allow build to continue with other files
  };
}

/**
 * Load and parse Markdown content, extracting frontmatter
 * @param {string} courseDir - Directory of the course
 * @param {string} filePath - Path to the markdown file
 * @returns {Object} - Parsed content and metadata
 */
function parseMarkdownContent(courseDir, filePath) {
  const fileContent = readFile(filePath);
  if (!fileContent) return null;
  
  // Generate hash for caching
  const hash = textHash(fileContent);
  const courseId = path.basename(courseDir);
  
  // Extract YAML frontmatter
  const { content, data: frontMatter } = matter(fileContent);
  
  // Process the content
  return {
    content,
    frontMatter,
    hash,
    courseId
  };
}

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
 * @param {Object} cache - Cache object for tracking changes
 * @returns {Promise<void>} 
 */
async function processCourse(courseDir, cache = {}) {
  const start = Date.now();
  const courseName = path.basename(courseDir);
  console.log(`Processing course: ${courseName}...`);
  
  // Ensure destination directories exist
  const courseDestDir = path.join(CONTENT_DEST_DIR, courseName);
  await mkdirp(courseDestDir);
  
  // Process content.md file
  const contentFile = path.join(courseDir, 'content.md');
  if (fs.existsSync(contentFile)) {
    const parsed = parseMarkdownContent(courseDir, contentFile);
    
    // Skip if content hasn't changed (using cache)
    if (cache[courseName] === parsed.hash) {
      console.log(`✓ No changes for ${courseName}, using cached version`);
    } else {
      // Convert to Mathigon JSON format
      const jsonContent = convertToMathigonJSON(parsed.content, parsed.frontMatter);
      
      // Write JSON file
      await writeFile(
        path.join(courseDestDir, 'content.json'),
        JSON.stringify(jsonContent, null, 2)
      );
      
      // Also copy the original MD file for reference
      await copyFile(contentFile, path.join(courseDestDir, 'content.md'));
      
      console.log(`✓ Generated content.json for ${courseName}`);
      
      // Update cache
      cache[courseName] = parsed.hash;
    }
  } else {
    console.warn(`⚠️ No content.md found for ${courseName}`);
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
  
  // Copy other important files
  const specialFiles = [
    { file: 'hero.jpg', required: false },
    { file: 'functions.ts', required: false },
    { file: 'styles.scss', required: false }
  ];
  
  for (const { file, required } of specialFiles) {
    const srcFile = path.join(courseDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(courseDestDir, file));
      console.log(`✓ Copied ${file} for ${courseName}`);
    } else if (required) {
      console.warn(`⚠️ Required file ${file} missing for ${courseName}`);
    }
  }
  
  const ms = Date.now() - start;
  success(courseName, ms);
  return cache;
}

/**
 * Processes shared assets for all courses
 */
async function processSharedAssets() {
  const start = Date.now();
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
  
  const ms = Date.now() - start;
  success('shared assets', ms);
}

/**
 * Builds and bundles Mathigon SVG icons
 */
async function bundleIcons() {
  const start = Date.now();
  const iconsDir = path.join(__dirname, '../src/assets/icons');
  
  if (fs.existsSync(iconsDir)) {
    const iconFiles = await glob(`${iconsDir}/*.svg`);
    const icons = iconFiles.map(src => {
      const id = path.basename(src, '.svg');
      return readFile(src).replace(' xmlns="http://www.w3.org/2000/svg"', '')
        .replace('<svg ', `<symbol id="${id}" `)
        .replace('</svg>', '</symbol>');
    });
    
    const symbols = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${icons.join('')}</svg>`;
    
    // Add cache bust with hash
    const hash = textHash(symbols).slice(0, 8);
    const iconsPath = `icons.${hash}.svg`;
    
    await writeFile(path.join(ASSETS_DEST_DIR, 'icons.svg'), symbols);
    success('icons.svg', Date.now() - start);
    
    return iconsPath;
  }
  
  console.warn('⚠️ Icons directory not found');
  return 'icons.svg';
}

/**
 * Creates placeholder content for courses that aren't defined yet
 */
async function createPlaceholderContent() {
  console.log('Creating placeholder content files...');
  
  // Create a minimal valid course JSON
  const placeholderContent = {
    sections: [
      {
        id: "intro",
        title: "Introduction",
        content: "<p>This is a placeholder content for this course. The actual content is not available at this time.</p>"
      }
    ]
  };
  
  // Process each course
  for (const courseId of DEFAULT_COURSES) {
    const courseDir = path.join(CONTENT_DEST_DIR, courseId);
    const srcCourseDir = path.join(CONTENT_SRC_DIR, courseId);
    const jsonPath = path.join(courseDir, 'content.json');
    
    // If the actual content exists in src directory, don't create a placeholder
    if (fs.existsSync(path.join(srcCourseDir, 'content.md'))) {
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

/**
 * Main function to build all Mathigon content
 */
async function buildMathigonContent() {
  try {
    const startTime = Date.now();
    
    // Create base directories
    await mkdirp(CONTENT_DEST_DIR);
    await mkdirp(ASSETS_DEST_DIR);
    
    // Load cache
    let cache = {};
    if (fs.existsSync(CACHE_FILE)) {
      try {
        cache = JSON.parse(readFile(CACHE_FILE));
      } catch (e) {
        console.warn('⚠️ Failed to load cache file, rebuilding everything');
      }
    }
    
    // Build icons
    await bundleIcons();
    
    // Find all course directories
    const courseDirPattern = path.join(CONTENT_SRC_DIR, '/*');
    const courseDirs = await glob(courseDirPattern);
    
    // Process each course directory
    for (const courseDir of courseDirs) {
      if (fs.statSync(courseDir).isDirectory() && !path.basename(courseDir).startsWith('_')) {
        cache = await processCourse(courseDir, cache);
      }
    }
    
    // Process shared assets
    await processSharedAssets();
    
    // Create placeholder content for missing courses
    await createPlaceholderContent();
    
    // Save cache
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
    
    console.log(`✅ All content processed successfully in ${Date.now() - startTime}ms!`);
  } catch (error) {
    console.error('❌ Error processing courses:', error);
    process.exit(1);
  }
}

// Run the script directly or export functions
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildMathigonContent();
}

export {
  buildMathigonContent,
  bundleIcons,
  processCourse,
  createPlaceholderContent
}; 