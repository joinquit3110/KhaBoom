import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, fullName, email, password, class: className, birthdate, gender } = req.body;
    
    // Validate required fields
    if (!name || !fullName || !email || !password || !className || !birthdate) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    
    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ msg: "Email already in use" });
    
    // Generate random avatar URL using DiceBear based on the gender
    const styles = gender === 'female' ? 'avataaars-female' : 'avataaars';
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const avatar = `https://api.dicebear.com/7.x/${styles}/svg?seed=${randomSeed}`;
    
    // Create new user
    const user = await User.create({ 
      name, 
      fullName, 
      email, 
      password, 
      class: className, 
      birthdate: new Date(birthdate),
      gender: gender || 'male',
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

// Update user preferences
router.patch("/preferences", async (req, res) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: "No token provided" });
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user by id
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    // Update preferences
    const { preferredLanguage } = req.body;
    
    // Only update fields that are provided
    if (preferredLanguage) {
      user.preferredLanguage = preferredLanguage;
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user without password
    const userData = user.toObject();
    delete userData.password;
    
    res.json(userData);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(401).json({ msg: "Invalid or expired token" });
  }
});

export default router;
