import express from "express";
import mongoose from "mongoose";
import Progress from "../models/progress.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get user's progress for all courses
router.get("/", authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user.userId });
    res.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's progress for a specific course
router.get("/:courseId", authMiddleware, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user.userId,
      courseId: req.params.courseId,
    });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    res.json(progress);
  } catch (error) {
    console.error("Error fetching course progress:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update progress for a course
router.post("/:courseId", authMiddleware, async (req, res) => {
  try {
    const { sectionId, exerciseId, completed, score } = req.body;
    
    // Find or create progress document
    let progress = await Progress.findOne({
      userId: req.user.userId,
      courseId: req.params.courseId,
    });

    if (!progress) {
      progress = new Progress({
        userId: req.user.userId,
        courseId: req.params.courseId,
        sections: [],
        completionPercentage: 0,
        lastAccessed: new Date()
      });
    } else {
      progress.lastAccessed = new Date();
    }

    // Update section and exercise data
    if (sectionId) {
      let section = progress.sections.find(s => s.sectionId === sectionId);
      
      if (!section) {
        section = {
          sectionId,
          completed: completed || false,
          lastAccessed: new Date(),
          exercises: []
        };
        progress.sections.push(section);
      } else {
        section.lastAccessed = new Date();
        if (completed !== undefined) {
          section.completed = completed;
        }
      }

      // Update exercise if provided
      if (exerciseId) {
        let exercise = section.exercises.find(e => e.exerciseId === exerciseId);
        
        if (!exercise) {
          exercise = {
            exerciseId,
            completed: completed || false,
            score: score || 0,
            attempts: 1,
            lastAttemptDate: new Date()
          };
          section.exercises.push(exercise);
        } else {
          if (completed !== undefined) {
            exercise.completed = completed;
          }
          if (score !== undefined) {
            exercise.score = score;
          }
          exercise.attempts += 1;
          exercise.lastAttemptDate = new Date();
        }
      }
    }

    // Calculate completion percentage
    if (progress.sections.length > 0) {
      const totalSections = progress.sections.length;
      const completedSections = progress.sections.filter(s => s.completed).length;
      progress.completionPercentage = Math.floor((completedSections / totalSections) * 100);
      
      // Award certificate if 100% complete
      if (progress.completionPercentage === 100) {
        progress.certificateEarned = true;
      }
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
