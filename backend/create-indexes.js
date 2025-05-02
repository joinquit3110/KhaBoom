// MongoDB index creation script for better performance
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://joinquit:31102004@khaboomdb.cqugkeo.mongodb.net/?retryWrites=true&w=majority&appName=KhaBoomDB';

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Creating indexes...');
    
    try {
      // Get handle to the User collection
      const userCollection = mongoose.connection.db.collection('users');
      
      // Create indexes for the User collection
      console.log('Creating User collection indexes...');
      await userCollection.createIndex({ email: 1 }, { unique: true });
      await userCollection.createIndex({ name: 1 });
      console.log('User collection indexes created successfully');
      
      // Get handle to the Progress collection
      const progressCollection = mongoose.connection.db.collection('progresses');
      
      // Create indexes for the Progress collection
      console.log('Creating Progress collection indexes...');
      await progressCollection.createIndex({ userId: 1, courseId: 1 }, { unique: true });
      await progressCollection.createIndex({ userId: 1 });
      await progressCollection.createIndex({ courseId: 1 });
      console.log('Progress collection indexes created successfully');
      
      // Get handle to the Course collection
      const courseCollection = mongoose.connection.db.collection('courses');
      
      // Create indexes for the Course collection
      console.log('Creating Course collection indexes...');
      await courseCollection.createIndex({ courseId: 1 }, { unique: true });
      await courseCollection.createIndex({ category: 1 });
      await courseCollection.createIndex({ difficulty: 1 });
      await courseCollection.createIndex({ 
        title: "text", 
        description: "text", 
        tags: "text" 
      }, { 
        weights: { 
          title: 10, 
          description: 5, 
          tags: 3 
        },
        name: "course_search_index" 
      });
      console.log('Course collection indexes created successfully');
      
      console.log('All indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
