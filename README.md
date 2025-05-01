<div align="center">
  <img src="frontend/public/logo.png" alt="KHA-BOOM! Logo" width="300">
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

For more detailed documentation about the development and usage of KHA-BOOM!, please refer to the Mathigon documentation and resources:

- [GitHub Repository](https://github.com/mathigon/textbooks)
- [Live Website](https://mathigon.org/courses)

## Contributing

We welcome contributions to improve KHA-BOOM! and make it even more impactful for learners worldwide.

## License

This project contains proprietary code and licensed components. Please refer to the specific license terms in the repository.

---

<div align="center">
  <p>© 2025 KHA-BOOM! All Rights Reserved.</p>
</div>
