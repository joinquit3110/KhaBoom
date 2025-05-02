# KhaBoom Deployment Guide

This document contains instructions for deploying the KhaBoom learning platform to Netlify, Render, and MongoDB Atlas.

## Prerequisites

- GitHub account for source code management
- Netlify account for frontend deployment
- Render account for backend API deployment
- MongoDB Atlas account for database hosting

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project named "KhaBoomDB"
3. Build a new cluster (Free tier is sufficient for development)
4. Create a database user with read and write permissions
5. Add your IP address to the IP Access List or set to allow access from anywhere (0.0.0.0/0) for development
6. Get your connection string from the "Connect" button, it should look like:
   ```
   mongodb+srv://joinquit:31102004@khaboomdb.cqugkeo.mongodb.net/?retryWrites=true&w=majority&appName=KhaBoomDB
   ```
7. Replace the username and password with your database credentials

## Backend Deployment on Render

1. Push your code to GitHub
2. Log in to Render [https://render.com](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Configure the service:
   - Name: kha-boom-backend
   - Root Directory: backend (if your repo contains both frontend and backend)
   - Environment: Node
   - Build Command: npm install
   - Start Command: npm start
6. Add the following environment variables:
   - `PORT`: 10000
   - `MONGODB_URI`: Your MongoDB connection string 
   - `JWT_SECRET`: A secure random string for JWT token encryption
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: https://khaboom.netlify.app

7. Deploy the service

## Frontend Deployment on Netlify

1. Push your code to GitHub
2. Log in to Netlify [https://netlify.com](https://netlify.com)
3. Create a new site from Git
4. Connect your GitHub repository
5. Configure the build settings:
   - Base directory: frontend (if your repo contains both frontend and backend)
   - Build command: npm run build
   - Publish directory: dist
6. Add the following environment variables:
   - `VITE_API_BASE`: https://kha-boom-backend.onrender.com (your Render backend URL)
   - `VITE_SITE_URL`: https://khaboom.netlify.app
   - `NODE_ENV`: production
7. Deploy the site

## Setting up Continuous Deployment

Both Netlify and Render support continuous deployment from GitHub. When you push changes to your repository:

1. Netlify will automatically rebuild and deploy your frontend
2. Render will automatically rebuild and deploy your backend

## Local Development Setup

For local development:

1. Clone the repository
2. Copy `.env.example` to `.env` in both frontend and backend directories
3. Update the values in the `.env` files:

   Backend:
   ```
   PORT=10000
   MONGODB_URI=mongodb+srv://joinquit:31102004@khaboomdb.cqugkeo.mongodb.net/?retryWrites=true&w=majority&appName=KhaBoomDB
   JWT_SECRET=development-secret-key
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173,https://khaboom.netlify.app
   ```

   Frontend:
   ```
   VITE_API_BASE=http://localhost:10000
   VITE_APP_TITLE=KhaBoom Learning Platform
   ```

4. Install dependencies in both directories:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

5. Start the development servers:
   ```bash
   # Terminal 1 (Backend)
   cd backend && npm run dev
   
   # Terminal 2 (Frontend)
   cd frontend && npm run dev
   ```

## Troubleshooting

### CORS Issues

If you experience CORS issues:
- Verify the `CORS_ORIGIN` environment variable on your backend
- Check that your frontend is making requests to the correct backend URL

### MongoDB Connection Issues

If you can't connect to MongoDB:
- Verify your MongoDB Atlas network access settings
- Check that your connection string is correct
- Ensure your database user has the correct permissions

### Netlify Build Failures

If your Netlify build fails:
- Check the build logs for errors
- Ensure all dependencies are listed in your package.json
- Verify that the build command and publish directory are correctly set
