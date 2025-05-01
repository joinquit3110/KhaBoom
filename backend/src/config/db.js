import mongoose from "mongoose";
export const connectDB = () =>
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => { console.error(err); process.exit(1); });
