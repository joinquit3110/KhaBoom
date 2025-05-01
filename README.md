# Kha-Boom!

A modern learning web application with user authentication system, built with the MERN stack (MongoDB, Express, React, Node.js).

<p align="center">
  <img src="frontend/public/favicon.svg" alt="Kha-Boom Logo" width="200" />
</p>

## Project Overview

Kha-Boom! is a full-stack web application featuring:

- Modern React frontend with Vite build tool
- Express.js backend API with MongoDB integration
- Complete user authentication system (register/login)
- JWT-based authorization
- Deployment configuration for Netlify (frontend) and Render (backend)
- Colorful, modern, and creative user interface

## Project Structure

```
kha-boom/
├── frontend/               # Netlify site
│   ├── netlify.toml        # Netlify config
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           └── Navbar.jsx
│
├── backend/                # Render service
│   ├── render.yaml         # Render deploy spec
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── config/
│       │   └── db.js
│       ├── models/
│       │   └── user.model.js
│       ├── routes/
│       │   └── auth.routes.js
│       └── middleware/
│           └── auth.middleware.js
```

## Key Features

### Advanced User System

- Registration and login with JWT authentication
- Comprehensive user profiles with fields:
  - Username (name)
  - Full name (fullName)
  - Class (class)
  - Birth date (birthdate)
  - Primary email (email)
  - Optional Gmail account (gmail)
  - Automatic avatar generation (avatar)

### Modern Interface

- Responsive design for all devices
- Colorful and dynamic interface
- Smooth transition effects
- Full Vietnamese language support

## Getting Started

### System Requirements

- Node.js v16 or later
- npm (Node Package Manager)
- MongoDB account (Atlas or other provider)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/joinquit3110/KhaBoom.git
   cd KhaBoom
   ```

2. **Set up the backend**
   ```bash
   cd backend
   cp .env.example .env  # Create .env file
   # Edit .env file with your MongoDB connection string and JWT secret
   npm install
   npm start
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment

### Frontend (Netlify)

1. In Netlify dashboard, select "New site from Git"
2. Connect to your GitHub repository
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Set environment variables:
   - `VITE_API_BASE`: URL of your backend API (from Render)

### Backend (Render)

1. In Render dashboard, select "New Web Service"
2. Connect to your GitHub repository
3. Set build settings:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
4. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PORT`: 10000 (optional)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password }`
  - Response: `{ id }`

- `POST /api/auth/login` - Login a user
  - Body: `{ email, password }`
  - Response: `{ token }`

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

- [joinquit3110](https://github.com/joinquit3110)
