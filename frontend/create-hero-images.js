/**
 * Script to create placeholder hero images for courses
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Working directory:', __dirname);

// Create placeholder hero images for courses
const courseDirs = [
  'functions',
  'vectors',
  'logic',
  'combinatorics',
  'non-euclidean-geometry',
  'shared'
];

console.log('🖼️ Creating placeholder hero images for courses...');
courseDirs.forEach(course => {
  const contentDir = path.join(__dirname, 'public', 'content', course);
  console.log(`Processing directory: ${contentDir}`);
  
  // Create course content directory if it doesn't exist
  if (!fs.existsSync(contentDir)) {
    try {
      fs.mkdirSync(contentDir, { recursive: true });
      console.log(`Created directory: ${contentDir}`);
    } catch (err) {
      console.error(`Failed to create directory ${contentDir}:`, err);
    }
  }
  
  // Create hero image
  const heroPath = path.join(contentDir, 'hero.jpg');
  console.log(`Hero image path: ${heroPath}`);
  
  if (!fs.existsSync(heroPath)) {
    // Copy logo.png as a placeholder or create an empty file
    try {
      const logoPath = path.join(__dirname, 'public', 'logo.png');
      console.log(`Looking for logo at: ${logoPath}`);
      console.log(`Logo exists: ${fs.existsSync(logoPath)}`);
      
      if (fs.existsSync(logoPath)) {
        fs.copyFileSync(logoPath, heroPath);
        console.log(`Copied logo to: ${heroPath}`);
      } else {
        // Create a minimal empty JPEG file as placeholder
        const minimalJpeg = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 
          0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
          0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 
          0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
          0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 
          0x00, 0xFF, 0xD9
        ]);
        fs.writeFileSync(heroPath, minimalJpeg);
        console.log(`Created minimal JPEG at: ${heroPath}`);
      }
      console.log(`✅ Created hero image for ${course}: ${heroPath}`);
    } catch (err) {
      console.error(`❌ Failed to create hero image for ${course}:`, err);
    }
  } else {
    console.log(`Hero image already exists for ${course}`);
  }
});

console.log('🎉 Hero images creation completed!'); 