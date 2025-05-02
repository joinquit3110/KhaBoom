import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  courseId: { 
    type: String, 
    required: true,
    unique: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  sections: [{
    sectionId: String,
    title: String,
    order: Number,
    exercises: [{
      exerciseId: String,
      title: String,
      type: String
    }]
  }],
  coverImage: String,
  language: {
    type: String,
    default: 'en'
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  published: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Course", CourseSchema);
