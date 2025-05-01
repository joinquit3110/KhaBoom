import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

// Import other routes
import authRoutes from './auth.routes.js';
import contentRoutes from './content.routes.js';

// Use imported routes
router.use('/auth', authRoutes);
router.use('/content', contentRoutes);

// Course listing endpoint
router.get('/courses', (req, res) => {
  const contentDir = path.join(rootDir, 'content');
  try {
    // Check if the content directory exists
    if (!fs.existsSync(contentDir)) {
      console.error(`Content directory not found: ${contentDir}`);
      return res.status(404).json({ 
        error: 'Content directory not found',
        courses: [] 
      });
    }

    // Get all subdirectories in the content directory
    const dirs = fs.readdirSync(contentDir);
    
    // Filter valid course directories
    const courses = dirs
      .filter(dir => {
        // Skip if directory doesn't exist or is special
        if (dir === 'shared' || dir.startsWith('_')) return false;
        
        const dirPath = path.join(contentDir, dir);
        // Skip if not a directory
        if (!fs.statSync(dirPath).isDirectory()) return false;
        
        // Check if content.md exists
        const contentFile = path.join(dirPath, 'content.md');
        return fs.existsSync(contentFile);
      })
      .map(dir => {
        // Extract title from content.md if possible
        const contentFile = path.join(contentDir, dir, 'content.md');
        let title = dir.charAt(0).toUpperCase() + dir.slice(1).replace(/-/g, ' ');
        
        try {
          // Try to parse the title from the content file
          const content = fs.readFileSync(contentFile, 'utf8');
          const titleMatch = content.match(/# ([^\n]+)/);
          if (titleMatch) {
            title = titleMatch[1];
          }
        } catch (error) {
          console.warn(`Could not parse title from ${contentFile}`);
        }
        
        return {
          id: dir,
          title: title,
          url: `/course/${dir}`
        };
      });
    
    console.log(`Found ${courses.length} courses`);
    res.json({ courses });
  } catch (err) {
    console.error('Error reading courses:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve course list',
      courses: [] 
    });
  }
});

export default router; 