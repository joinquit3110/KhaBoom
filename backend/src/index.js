import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import contentRoutes from "./routes/content.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);

app.get("/", (_, res) => res.json({ msg: "Kha-Boom API up" }));
app.listen(process.env.PORT || 5000);
