import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, fullName, email, password, class: className, birthdate, gmail } = req.body;
    
    // Validate required fields
    if (!name || !fullName || !email || !password || !className || !birthdate) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    
    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ msg: "Email already in use" });
    
    // Generate avatar URL using DiceBear
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/ /g, '')}`;
    
    // Create new user
    const user = await User.create({ 
      name, 
      fullName, 
      email, 
      password, 
      class: className, 
      birthdate: new Date(birthdate),
      gmail: gmail || email,
      avatar 
    });
    
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    // Send back user data (except password) and token
    const userData = user.toObject();
    delete userData.password;
    
    res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ msg: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ msg: "Invalid email or password" });
    
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    // Send back user data (except password) and token
    const userData = user.toObject();
    delete userData.password;
    
    res.json({ user: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: "Server error during login" });
  }
});

// Get current user profile
router.get("/profile", async (req, res) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: "No token provided" });
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user by id
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ msg: "Invalid or expired token" });
  }
});

export default router;
