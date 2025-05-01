# Kha-Boom! Math Learning Platform

A modern, interactive mathematics learning platform inspired by Mathigon, featuring a chatbot tutor, interactive elements, and rich course content.

## Features

- **Interactive Course Content**: Engaging visualizations and dynamic exercises that help students explore mathematical concepts.
- **AI Chatbot Tutor**: A virtual tutor that provides personalized help and explanations for mathematical concepts.
- **Notification System**: Informative notifications for user feedback and progress tracking.
- **Beautiful UI/UX**: Modern interface with smooth animations and responsive design.
- **Progress Tracking**: Track your learning progress through courses with step indicators.

## Technologies Used

- **Frontend Framework**: Vanilla JavaScript with Vite for bundling
- **Styling**: SCSS for modular and maintainable styling
- **Mathematical Libraries**:
  - `@mathigon/boost`: UI components and utilities
  - `@mathigon/euclid`: Geometry and drawing utilities
  - `@mathigon/fermat`: Mathematical calculations
  - `@mathigon/hilbert`: Expression parsing and rendering
  - `@mathigon/core`: Core utilities

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kha-boom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run serve
```

## Project Structure

```
kha-boom/
├── public/               # Static assets
│   └── index.html        # Main HTML file
├── src/
│   ├── components/       # Web components
│   │   └── step-bar.js   # StepBar progress component
│   ├── scripts/          # JavaScript files
│   │   ├── main.js       # Main application entry point
│   │   ├── chatbot.js    # Chatbot implementation
│   │   ├── notification.js # Notification system
│   │   └── course-loader.js # Course loading utilities
│   ├── styles/           # SCSS stylesheets
│   │   ├── main.scss     # Main stylesheet
│   │   ├── variables.scss # Variables and settings
│   │   └── courses.scss  # Course-specific styles
│   └── content/          # Course content
├── vite.config.js        # Vite configuration
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## License

[MIT License](LICENSE)

## Acknowledgments

This project is inspired by [Mathigon](https://mathigon.org), an innovative mathematics education platform. 