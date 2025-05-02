import mongoose from "mongoose";

export const connectDB = async () => {
  // Only attempt to connect if MONGODB_URI is provided
  if (!process.env.MONGODB_URI) {
    console.log("No MongoDB URI provided, continuing without database");
    return Promise.resolve();
  }

  // Modern connection options - older options have been removed from the MongoDB driver
  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("✅ MongoDB connected successfully");
    
    // Handle connection events for better monitoring
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected, attempting to reconnect...");
    });
    
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully");
    });
    
    return mongoose.connection;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    console.log("⚠️ Application running without database connection");
    return null;
  }
};
