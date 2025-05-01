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

app.use(cors());
app.use(express.json());

connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);

// Routes
import apiRoutes from './routes/index.js';
app.use('/api', apiRoutes);

// Serve Mathigon content
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

app.get("/", (_, res) => res.json({ msg: "Kha-Boom API up" }));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
