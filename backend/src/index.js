import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import contentRoutes from "./routes/content.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import statusRoutes from "./routes/status.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

// Enable CORS for specified origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin || corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // Cache preflight request results for 24 hours (86400 seconds)
}));

// Set security headers for all responses
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json());

connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/status", statusRoutes);

// Routes
// We're handling API routes directly instead of using the index router
// to avoid route conflicts

// Serve Mathigon content directly (without API prefix for direct file access)
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
  // This would be replaced with your actual course serving logic
  res.sendFile(path.join(rootDir, 'content', req.params.id, 'content.md'));
});

// Health check endpoint for Render
app.get("/", (_, res) => res.json({ 
  msg: "Kha-Boom API up",
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  version: '1.0.0'
}));

// Simple health check endpoint specifically for monitoring
app.get("/health", (_, res) => res.status(200).send('OK'));

// SPA route handling - serve frontend for all non-API routes
app.use(express.static(path.join(rootDir, 'frontend/dist')));

// Catch-all route handler for client-side routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other routes, serve the frontend application
  res.sendFile(path.join(rootDir, 'frontend/dist/index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not connected'}`);
});
