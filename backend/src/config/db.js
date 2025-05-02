import mongoose from "mongoose";

export const connectDB = async () => {
  // Only attempt to connect if MONGODB_URI is provided
  if (!process.env.MONGODB_URI) {
    console.log("No MongoDB URI provided, continuing without database");
    return Promise.resolve();
  }

  // Modern connection options with more generous timeouts
  const options = {
    serverSelectionTimeoutMS: 30000, // Increased from 5000
    connectTimeoutMS: 30000,        // Increased from 10000
    socketTimeoutMS: 60000,         // Increased from 45000
    retryWrites: true,
    w: "majority",
    maxPoolSize: 10                 // Connection pooling for better performance
  };

  // Retry logic for MongoDB connection
  let retries = 5;
  while (retries > 0) {
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
      retries--;
      if (retries === 0) {
        console.error("❌ MongoDB connection failed after multiple attempts:", err);
        console.log("⚠️ Application running without database connection");
        return null;
      }
      console.log(`⚠️ MongoDB connection attempt failed. ${retries} retries left. Retrying in 5 seconds...`);
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
