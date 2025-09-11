# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

KhaBoom is an educational platform for creating and hosting interactive, online courses. It's built on top of Mathigon Studio framework and provides a comprehensive learning management system with user accounts, progress tracking, and interactive course content.

## Architecture

### High-Level Structure

The project follows a **monolithic architecture** with separate frontend/backend concerns:

- **Frontend**: TypeScript/SCSS components with custom web components
- **Backend**: Express.js application with MongoDB for persistence
- **Build System**: Custom Node.js build scripts with esbuild bundling
- **Content Management**: YAML-based configuration with Pug templating

### Key Directories

- `frontend/` - Client-side TypeScript components and styles
  - `components/` - Interactive course components (blank, gallery, video, etc.)
  - `main.ts` - Main application entry point
  - `accounts.ts` - User authentication frontend
- `server/` - Express.js backend application
  - `app.ts` - Main Express application class
  - `accounts.ts` - Authentication endpoints
  - `interfaces.ts` - TypeScript type definitions
- `build/` - Build system and asset compilation
  - `index.js` - Main build script
  - `assets.js` - Asset bundling logic
- `content/` - Course content and materials
- `translations/` - Internationalization files

### Core Components

**MathigonStudioApp Class**: Central Express application wrapper providing:
- Authentication middleware
- Course routing and progress tracking
- Static asset serving
- Security headers and CSRF protection

**Interactive Components**: Frontend components for educational content:
- `Blank` - Fill-in-the-blank exercises
- `Gallery` - Image galleries
- `Video` - Video players with controls
- `Slideshow` - Interactive presentations
- `Progress` - Course progress indicators

**User Management**: Full authentication system with:
- User registration/login
- Progress tracking per course/section
- Dashboard with statistics and leaderboards
- OAuth integration support

## Development Commands

### Build & Development

```bash
# Development build with watch mode
npm run build:watch

# Development build (no minification)
npm run build:dev

# Production build (with minification and optimization)
npm run build

# Start development server (port 5000)
npx ts-node server/serve.ts
# OR using npm script
npm run dev
```

### Testing & Quality

```bash
# Run linter
npm run lint

# Fix linting issues automatically  
npm run lint-fix

# Run tests
npm test

# Generate screenshots for testing
npx mgon-screenshots
```

### Content Management

```bash
# Translate content using Google Cloud
npm run translate

# Build search index
npx mgon-build --search

# Generate course thumbnails
npx mgon-build --thumbnails
```

### Specialized Commands

```bash
# Run example documentation site
npm run example

# Manage secrets (Google Cloud integration)
npx mgon-secrets

# Check dependency licenses
npx mgon-build --licenses
```

## Configuration

### Environment Setup

1. Copy `.env.example` to `.env` and configure:
   - MongoDB connection string
   - Google Cloud service account (for translation)
   - SendGrid API key (for emails)

2. Main configuration in `config.yaml`:
   - Site settings (name, locales, search)
   - Account system configuration
   - Course display options
   - Social media integration

### TypeScript Configuration

- Base config: `tsconfig.base.json`
- Module-specific configs in `frontend/`, `server/`, `content/`
- Strict mode enabled with experimental decorators

### ESLint Rules

Extended from Google style guide with TypeScript support:
- Comma-dangle: never
- No unused vars (with underscore prefix exception)
- Sort imports enabled
- Relaxed JSDoc requirements for development

## Course Development

### Content Structure

Courses are organized as:
- `Course` - Top-level container with metadata
- `Section` - Individual lessons within a course
- `Step` - Granular learning units within sections

### Interactive Components

When adding new interactive components:
1. Create component in `frontend/components/[name]/`
2. Export type in `index.ts`
3. Register component in `frontend/components/index.ts`
4. Add corresponding SCSS styles

### Progress Tracking

User progress is automatically tracked:
- Section completion status
- Individual step scores
- Time spent per section
- Analytics for course engagement

## Database Models

### Key Collections

- `users` - User accounts and profiles
- `progress` - Course progress per user
- `course_analytics` - Usage statistics and leaderboards
- `login_analytics` - User session tracking

### Progress Data Structure

Each user's progress includes:
- Course completion percentage
- Active step tracking
- Score data per step
- Custom user data and preferences

## Authentication

### Supported Methods

- Email/password registration
- OAuth providers (configurable in `config.yaml`)
- Temporary user sessions for anonymous browsing

### Access Control

- Course access can require authentication
- Progress tracking requires user account
- Admin features controlled via user roles

## Build Process

### Asset Pipeline

1. **TypeScript Compilation**: `esbuild` for bundling
2. **SCSS Processing**: Sass compilation with autoprefixer
3. **Asset Optimization**: Minification for production
4. **Cache Busting**: Automatic versioning for static assets

### Localization

- Content translation via Google Cloud Translate
- YAML-based string management
- RTL language support with `rtlcss`

## Common Development Workflows

### Adding a New Course

1. Create content directory structure
2. Define course metadata in YAML
3. Build course sections and steps
4. Run `npm run build:dev` to compile
5. Test in development server

### Debugging Issues

1. Check browser console for frontend errors
2. Monitor server logs for backend issues
3. Verify database connections and queries
4. Use `npm run lint` to catch code issues

### Deployment Preparation

1. Run `npm run build` for production assets
2. Ensure all environment variables are set
3. Verify database migrations are complete
4. Test authentication and course access
