import express from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// Basic status endpoint - public
router.get("/", (req, res) => {
  const status = {
    service: "KhaBoom Backend API",
    status: "operational",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime()
  };
  
  res.json(status);
});

// Detailed health check - restricted to authenticated users
router.get("/health", authMiddleware, async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 
      ? "connected" 
      : "disconnected";
    
    // Get system information
    const health = {
      service: "KhaBoom Backend API",
      status: "operational",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        host: mongoose.connection.host || "unknown",
        name: mongoose.connection.name || "unknown"
      },
      memory: {
        rss: process.memoryUsage().rss / (1024 * 1024), // MB
        heapTotal: process.memoryUsage().heapTotal / (1024 * 1024), // MB
        heapUsed: process.memoryUsage().heapUsed / (1024 * 1024) // MB
      }
    };
    
    // If db is connected, add additional info
    if (dbStatus === "connected") {
      try {
        // Get collection stats if available
        const collections = await mongoose.connection.db.listCollections().toArray();
        health.database.collections = collections.map(c => c.name);
      } catch (err) {
        health.database.collections = ["Error fetching collections"];
      }
    }
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: "Error fetching health status",
      error: error.message
    });
  }
});

export default router;
