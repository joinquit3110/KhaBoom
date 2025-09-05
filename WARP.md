# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is Mathigon Studio (customized as KhaBoom), an interactive online course platform built with TypeScript, Node.js, and MongoDB. The platform creates and serves educational content with interactive components.

## Development Commands

### Build Commands

```bash
# Build frontend assets (JS/CSS) for all configured locales
npx mgon-build --assets

# Build with minification for production
npx mgon-build --assets --minify

# Build and watch for development
npx mgon-build --assets --watch

# Build search index (when enabled in config.yaml)
npx mgon-build --search

# Build course thumbnails
npx mgon-build --thumbnails

# Build all assets for specific locales
npx mgon-build --assets --locales=en,vi
```

### Server Commands

```bash
# Start development server on port 5000
npx mgon-serve

# The server runs at http://localhost:5000 by default
```

### Testing & Quality

```bash
# Run Markdown parser tests
npm test

# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint-fix

# Generate screenshots for visual testing
npx mgon-screenshots
```

### Translation

```bash
# Translate content (requires Google Cloud service account)
npx mgon-build --translate --key google-service-account.json

# Translate all content including existing translations
npx mgon-build --translate --all --key google-service-account.json
```

## Architecture Overview

### Directory Structure

- **`/content`**: Course content organized by topic
  - Each course folder contains:
    - `content.md`: Main course content in custom Markdown format
    - `functions.ts`: Course-specific TypeScript logic
    - `styles.scss`: Course-specific styling
    - `hints.yaml`: Hint definitions for interactive elements
    - `components/`: Custom course components
    - `images/`, `svg/`, `audio/`: Media assets

- **`/frontend`**: Client-side application code
  - `main.ts/scss`: Core application entry point
  - `course.js/css`: Course viewer functionality
  - `accounts.ts/scss`: User account system
  - `dashboard.ts/scss`: User dashboard
  - `/components`: Reusable interactive components (blank, gallery, slideshow, etc.)

- **`/server`**: Express.js backend application
  - `app.ts`: Main application class (MathigonStudioApp)
  - `serve.ts`: Development server entry point
  - `accounts.ts`: User authentication and management
  - `/models`: Mongoose schemas for MongoDB
  - `/templates`: Pug templates for server-side rendering

- **`/build`**: Build tools and utilities
  - `assets.js`: Asset bundling (SCSS→CSS, TS→JS with ESBuild)
  - `markdown/`: Custom Markdown parser for course content
  - `tools/`: Various build utilities (search, translate, thumbnails)

### Key Configuration

**`config.yaml`**: Main configuration file
- MongoDB connection: Configured in `accounts.mongodb`
- Locales: Defined in `locales` array (default: ['en'])
- Search settings: Enable/disable and configure popular searches
- Account system: Authentication, age restrictions, privacy policies
- Tutor settings: AI assistant configuration (Archie)

### Database

The project uses MongoDB (via Mongoose) with connection string stored in `config.yaml`. The database stores:
- User accounts and progress
- Course completion data
- Interactive element responses

### Build Pipeline

1. **TypeScript/JavaScript**: Uses ESBuild for bundling
   - Supports Pug template imports
   - Vue.js external dependency handling
   - Localization string replacement (`<<string>>` syntax)

2. **SCSS/CSS**: Uses Sass + PostCSS
   - Autoprefixer for browser compatibility
   - RTL CSS generation for right-to-left languages
   - CSS nano for minification
   - Safe area insets for iOS devices

3. **Markdown Courses**: Custom parser that:
   - Converts course content to JSON
   - Processes interactive components
   - Handles MathJax equations
   - Supports custom HTML elements and attributes

### Interactive Components

The platform includes numerous interactive educational components exported from `index.ts`:
- Blank (fill-in-the-blank exercises)
- Gallery, Slideshow (media display)
- Sortable, Draggable elements
- Video players with custom controls
- Progress indicators
- Mathematical visualization tools

### Content Format

Courses use a custom Markdown format with:
- Step-based structure (separated by `---`)
- Interactive elements via custom HTML tags
- MathJax support for mathematical notation
- Embedded components using `x-` prefixed tags
- Hint system integration
- Multi-language support

### Development Workflow

1. Content is edited in `/content/{course}/content.md`
2. Assets are built using `mgon-build --assets --watch`
3. Development server runs via `mgon-serve`
4. Changes are hot-reloaded in the browser
5. Custom course logic goes in `/content/{course}/functions.ts`
6. Course styling in `/content/{course}/styles.scss`

### Testing Approach

- Markdown parser tests in `/tests/markdown/`
- Screenshot generation for visual regression testing
- ESLint for code quality enforcement
- TypeScript for type safety
