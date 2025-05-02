<div align="center">
  <img src="frontend/public/logo.png" alt="KHA-BOOM! Logo" width="500">
</div>

# KHA-BOOM!

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

## Deployment

KHA-BOOM! is designed to be deployed on modern cloud platforms. We use the following setup:

- **Frontend**: Deployed on Netlify
- **Backend API**: Deployed on Render
- **Database**: MongoDB Atlas

### Frontend Deployment on Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - `VITE_API_BASE`: Your Render backend URL
   - `NODE_ENV`: `production`
5. Deploy the site

### Backend Deployment on Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Create a new Web Service
4. Configure the service:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your Netlify site URL

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Configure network access (whitelist your IPs)
4. Create a database user
5. Get your connection string from the "Connect" button
6. Use this connection string in your Render environment variables

For more detailed deployment instructions, see the [deployment guide](docs/deployment.md).

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
