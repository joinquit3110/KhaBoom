# API Testing Guide for KhaBoom

This guide provides instructions for testing the KhaBoom API endpoints after deployment.

## Prerequisites

- [Postman](https://www.postman.com/downloads/) or any API testing tool
- A deployed instance of the KhaBoom backend at Render
- User account credentials for authentication testing

## Base URL

For production: `https://kha-boom-backend.onrender.com`
For local development: `http://localhost:10000`

## Available Endpoints

### Authentication

#### Register a New User

- **Endpoint:** `POST /api/auth/register`
- **Body:**
  ```json
  {
    "name": "testuser",
    "fullName": "Test User",
    "class": "Class A",
    "birthdate": "2000-01-01",
    "email": "test@example.com",
    "gender": "male",
    "password": "password123"
  }
  ```
- **Expected Response:** 
  ```json
  {
    "user": {
      "_id": "user_id",
      "name": "testuser",
      "email": "test@example.com"
    },
    "token": "jwt_token"
  }
  ```

#### Login

- **Endpoint:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Expected Response:** 
  ```json
  {
    "user": {
      "_id": "user_id",
      "name": "testuser",
      "email": "test@example.com"
    },
    "token": "jwt_token"
  }
  ```

### Content

#### Get Course List

- **Endpoint:** `GET /api/courses`
- **Authorization:** None (Public endpoint)
- **Expected Response:**
  ```json
  [
    {
      "courseId": "geometry",
      "title": "Geometry",
      "description": "Learn about shapes and spaces",
      "difficulty": "intermediate",
      "category": "mathematics"
    },
    {
      "courseId": "algebra",
      "title": "Algebra",
      "description": "Master the language of mathematics",
      "difficulty": "advanced",
      "category": "mathematics"
    }
  ]
  ```

#### Get Course Details

- **Endpoint:** `GET /api/courses/{courseId}`
- **Authorization:** None (Public endpoint)
- **Expected Response:**
  ```json
  {
    "courseId": "geometry",
    "title": "Geometry",
    "description": "Learn about shapes and spaces",
    "difficulty": "intermediate",
    "category": "mathematics",
    "tags": ["shapes", "angles", "theorems"],
    "sections": [
      {
        "sectionId": "intro",
        "title": "Introduction to Geometry",
        "order": 1
      }
    ]
  }
  ```

### User Progress

#### Get User Progress

- **Endpoint:** `GET /api/progress`
- **Authorization:** Bearer Token (from login)
- **Expected Response:**
  ```json
  [
    {
      "courseId": "geometry",
      "completionPercentage": 75,
      "lastAccessed": "2023-05-01T12:00:00Z",
      "sections": [
        {
          "sectionId": "intro",
          "completed": true
        }
      ]
    }
  ]
  ```

#### Update Progress

- **Endpoint:** `POST /api/progress/{courseId}`
- **Authorization:** Bearer Token (from login)
- **Body:**
  ```json
  {
    "sectionId": "intro",
    "exerciseId": "exercise1",
    "completed": true,
    "score": 100
  }
  ```
- **Expected Response:**
  ```json
  {
    "courseId": "geometry",
    "completionPercentage": 75,
    "lastAccessed": "2023-05-01T12:00:00Z",
    "sections": [
      {
        "sectionId": "intro",
        "completed": true,
        "exercises": [
          {
            "exerciseId": "exercise1",
            "completed": true,
            "score": 100
          }
        ]
      }
    ]
  }
  ```

## Testing Authentication Flow

1. Register a new user with `POST /api/auth/register`
2. Copy the token from the response
3. Use this token in the Authorization header for subsequent requests:
   - `Authorization: Bearer your_token_here`

## Common Error Responses

- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid request parameters
- **500 Server Error**: Internal server error

## Automated Testing Script

You can use this curl script to test the basic API functionality:

```bash
#!/bin/bash
API_URL="https://kha-boom-backend.onrender.com"

echo "Testing API health..."
curl -s "$API_URL/" | grep "Kha-Boom API up"

echo "Registering test user..."
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"testuser","fullName":"Test User","class":"Class A","birthdate":"2000-01-01","email":"test@example.com","gender":"male","password":"password123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to register. Trying to login instead..."
  RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')
  TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

echo "Testing courses endpoint..."
curl -s "$API_URL/api/courses"

echo "Testing user progress with authentication..."
curl -s "$API_URL/api/progress" -H "Authorization: Bearer $TOKEN"
```

This script registers a new user (or logs in if the user already exists), then tests the courses and progress endpoints.
