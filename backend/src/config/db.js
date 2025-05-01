import mongoose from "mongoose";
export const connectDB = () => {
  // Only attempt to connect if MONGODB_URI is provided
  if (process.env.MONGODB_URI) {
    return mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => console.log("MongoDB connected"))
      .catch(err => { 
        console.error("MongoDB connection error:", err); 
        console.log("Continuing without database connection");
      });
  } else {
    console.log("No MongoDB URI provided, continuing without database");
    return Promise.resolve();
  }
};
