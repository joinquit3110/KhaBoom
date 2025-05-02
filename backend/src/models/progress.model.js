import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  courseId: { 
    type: String, 
    required: true 
  },
  sections: [{
    sectionId: String,
    completed: Boolean,
    lastAccessed: Date,
    exercises: [{
      exerciseId: String,
      completed: Boolean,
      score: Number,
      attempts: Number,
      lastAttemptDate: Date
    }]
  }],
  completionPercentage: { 
    type: Number, 
    default: 0 
  },
  lastAccessed: { 
    type: Date, 
    default: Date.now 
  },
  certificateEarned: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Create compound index for userId and courseId
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Progress", ProgressSchema);
