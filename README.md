<div align="center">
  <img src="frontend/public/logo.png" alt="KHA-BOOM! Logo" width="500">
</div>

# Kha-Boom Learning Platform

A modern, interactive learning platform built with React, deployed on Netlify, with a Render backend and MongoDB database.

## Architecture

- **Frontend**: React application hosted on Netlify
- **Backend**: Node.js API hosted on Render
- **Database**: MongoDB Atlas for course progress and user data
- **Content**: Hosted on Render backend with Mathigon-format course content

## Deployment

### Frontend (Netlify)

The frontend is automatically deployed to Netlify when changes are pushed to the main branch.

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-NETLIFY-BADGE-ID/deploy-status)](https://app.netlify.com/sites/khaboom/deploys)

Manual deployment:

```
npm install -g netlify-cli
netlify login
npm run deploy
```

### Backend (Render)

The backend is deployed to Render and will automatically update when changes are pushed to the main branch.

## Cloud Infrastructure

- **Netlify**: Hosts the frontend application with built-in CDN
- **Render**: Hosts the backend API and serves course content
- **MongoDB Atlas**: Cloud database for user accounts and progress tracking

## Content Structure

Course content follows the Mathigon format:
- Each course is in its own directory under `/content`
- Course metadata and content is in `content.md` files
- Hero images are at `/content/{courseId}/hero.jpg`

## Development

To run the project locally:

```
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## Deployment Configuration

- `netlify.toml`: Configuration for Netlify deployment
- `frontend/netlify.toml`: Frontend-specific Netlify settings
- `frontend/postbuild.cjs`: Post-build script for Netlify deployment 

## Production URLs

- Frontend: https://khaboom.netlify.app
- Backend API: https://kha-boom-backend.onrender.com

## Project Overview
KHA-BOOM! is an interactive educational platform that brings mathematics to life through engaging, interactive content. Built on the foundation of Mathigon's educational framework, KHA-BOOM! transforms complex mathematical concepts into an immersive learning experience.

## Features

- **Interactive Mathematics**: Dynamic and explorable mathematical content that responds to user interactions
- **Multi-language Support**: Available in 16 languages including English, Spanish, French, Chinese, and more
- **Responsive Design**: Optimized experience across all devices and screen sizes
- **Guided Learning**: Interactive tutor functionality to assist learners through difficult concepts
- **Visualizations**: Powerful mathematical visualization tools and animations

## Project Structure

- **`/frontend`**: React-based user interface built with Vite
- **`/backend`**: Express.js API server with MongoDB integration
- **`/content`**: Educational content and interactive course materials
- **`/translations`**: Multilingual support files
- **`/public`**: Static assets and resources

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v6.0.0 or higher)
- MongoDB (for backend development)
- Accounts on Netlify, Render, and MongoDB Atlas (for deployment)

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/joinquit3110/KhaBoom.git

# Navigate to the project directory
cd KhaBoom

# Install dependencies
npm install

# Start the development server
npm start
```

This will start both the frontend and backend in development mode. The application will be available at `http://localhost:3000`.

### Environment Configuration

Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,https://khaboom.netlify.app
```

**Frontend (.env)**
```
VITE_API_BASE=http://localhost:10000
VITE_APP_TITLE=KhaBoom Learning Platform
```

### Development Workflow

```bash
# Frontend development only
cd frontend
npm run dev

# Backend development only
cd backend
npm run dev

# Building assets
npm run assets
```

## Technologies

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **Animation**: Framer Motion
- **HTTP Client**: Axios
- **Math Libraries**: Mathigon (Boost, Core, Euclid, Fermat, Hilbert)

### Backend
- **Server**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT & bcrypt
- **Environment**: Node.js

## Documentation

For more detailed documentation about the development and usage of KHA-BOOM!, please refer to the following resources:

- **[Setup Guide](docs/setup.md)**: Instructions for setting up the development environment
- **[API Testing](docs/api-testing.md)**: Guide for testing the backend API
- **[Deployment Guide](docs/deployment.md)**: Detailed deployment instructions
- **[Mathigon Documentation](https://github.com/mathigon/textbooks)**: Original textbooks repository
- **[Live Demo](https://khaboom.netlify.app/)**: KHA-BOOM! deployed site

## Contributing

We welcome contributions to improve KHA-BOOM! and make it even more impactful for learners worldwide.

## License

This project contains proprietary code and licensed components. Please refer to the specific license terms in the repository.

---

<div align="center">
  <p>© 2025 KHA-BOOM! All Rights Reserved.</p>
</div>
