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
    const courses = fs.readdirSync(contentDir)
      .filter(dir => {
        return dir !== 'shared' && 
              !dir.startsWith('_') && 
              fs.statSync(path.join(contentDir, dir)).isDirectory() &&
              fs.existsSync(path.join(contentDir, dir, 'content.md'));
      })
      .map(dir => {
        // Basic course info
        return {
          id: dir,
          title: dir.charAt(0).toUpperCase() + dir.slice(1).replace(/-/g, ' '),
          url: `/course/${dir}`
        };
      });
    
    res.json({ courses });
  } catch (err) {
    console.error('Error reading courses:', err);
    res.status(500).json({ error: 'Failed to retrieve course list' });
  }
});

export default router; 