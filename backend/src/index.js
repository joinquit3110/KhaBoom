import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import contentRoutes from "./routes/content.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Get allowed origins from environment variables or use default for development
const allowedOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000,https://khaboom.netlify.app';

// Enable CORS for specified origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    const originsArray = allowedOrigins.split(',');
    if (originsArray.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // Cache preflight request results for 24 hours
}));

// Set CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const originsArray = allowedOrigins.split(',');
    if (originsArray.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

app.use(express.json());

// Connect to database
try {
  connectDB();
  console.log("Database connection successful");
} catch (err) {
  console.log("Database connection error:", err.message);
}

// Main routes
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);

// Simple API endpoints for user and progress
app.get("/api/users/me", (req, res) => {
  res.status(200).json({ message: "User API endpoint", userId: "demo-user" });
});

app.get("/api/progress/:courseId", (req, res) => {
  res.status(200).json({ 
    courseId: req.params.courseId,
    completed: [],
    progress: 0
  });
});

app.post("/api/progress/:courseId", (req, res) => {
  const { courseId } = req.params;
  const { completed, progress } = req.body;
  
  res.status(200).json({
    success: true,
    courseId,
    completed: completed || [],
    progress: progress || 0
  });
});

// Serve static content
app.use('/content', express.static(path.join(rootDir, 'content')));
app.use('/translations', express.static(path.join(rootDir, 'translations')));
app.use('/assets', express.static(path.join(rootDir, 'frontend/assets')));

// Cache file handling
app.get('/cache.json', (req, res) => {
  const cachePath = path.join(rootDir, 'public/cache.json');
  if (fs.existsSync(cachePath)) {
    res.sendFile(cachePath);
  } else {
    res.json({});
  }
});

// Serve course data
app.get('/course/:id', (req, res) => {
  const filePath = path.join(rootDir, 'content', req.params.id, 'content.md');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Course content not found" });
  }
});

app.get("/", (_, res) => res.json({ msg: "Kha-Boom API up", version: "1.0.0" }));

// Handle all other routes (SPA support for frontend)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.json({ msg: "Kha-Boom API endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Content path: ${path.resolve(process.cwd(), '../content')}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});
