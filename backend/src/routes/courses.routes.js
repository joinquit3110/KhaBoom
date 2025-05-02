import express from "express";
import Course from "../models/course.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

// Get all courses (public endpoint)
router.get("/", async (req, res) => {
  try {
    const { category, difficulty, language, search } = req.query;
    const filter = {};
    
    // Apply filters if provided
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const courses = await Course.find(filter)
      .select('-sections')
      .sort({ featured: -1, enrollmentCount: -1, createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a single course by ID
router.get("/:courseId", async (req, res) => {
  try {
    // First try to find the course in the database
    const course = await Course.findOne({ courseId: req.params.courseId });
    
    if (course) {
      return res.json(course);
    }
    
    // If not in DB, try to read from content directory
    const contentPath = path.join(rootDir, 'content', req.params.courseId);
    
    if (!fs.existsSync(contentPath)) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Read course metadata from content.md or metadata file
    const metadataPath = path.join(contentPath, 'content.md');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ message: "Course metadata not found" });
    }
    
    // Read the first few lines to extract metadata
    const content = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = parseMarkdownMetadata(content);
    
    res.json({
      courseId: req.params.courseId,
      title: metadata.title || req.params.courseId,
      description: metadata.description || '',
      difficulty: metadata.difficulty || 'intermediate',
      category: metadata.category || 'mathematics',
      tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
      language: metadata.language || 'en'
    });
    
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to parse metadata from markdown content
function parseMarkdownMetadata(content) {
  const metadata = {};
  const lines = content.split('\n');
  let inMetadata = false;
  
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inMetadata) {
        inMetadata = true;
        continue;
      } else {
        break;
      }
    }
    
    if (inMetadata) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        metadata[match[1].trim()] = match[2].trim();
      }
    }
  }
  
  return metadata;
}

// Admin routes (protected)
// Create or update course
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }
    
    // Check if course exists
    let course = await Course.findOne({ courseId });
    
    if (course) {
      // Update existing course
      Object.assign(course, req.body);
    } else {
      // Create new course
      course = new Course(req.body);
    }
    
    await course.save();
    res.json(course);
  } catch (error) {
    console.error("Error creating/updating course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a course (admin only)
router.delete("/:courseId", authMiddleware, async (req, res) => {
  try {
    const deleted = await Course.findOneAndDelete({ courseId: req.params.courseId });
    
    if (!deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
