import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  class: { type: String, required: true },
  birthdate: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  gmail: { type: String, required: false },
  avatar: { type: String, default: "https://api.dicebear.com/7.x/avataaars/svg?seed=default" },
  password: { type: String, required: true }
}, { timestamps: true });

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model("User", UserSchema);
