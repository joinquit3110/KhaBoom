// Import Mathigon libraries
import { Component, Browser, ElementView, $html, $body, $N } from '@mathigon/boost';
import { Point } from '@mathigon/euclid';
import { animate } from '@mathigon/boost';

// Import local components
import { CourseLoader } from './course-loader.js';
import { ChatBot } from './chatbot.js';
import { Notification } from './notification.js';

// Register custom components
import { StepBar } from '../components/step-bar.js';
Component.register('x-step-bar', StepBar);

/**
 * Initializes the application when the DOM is ready
 */
function initApp() {
  // Initialize course loader
  const courseLoader = new CourseLoader();
  courseLoader.loadFeaturedCourses();
  
  // Initialize chatbot
  const chatBot = new ChatBot({
    containerSelector: '#tutor-panel',
    headerSelector: '.tutor-header',
    messagesSelector: '.tutor-messages',
    inputSelector: '.tutor-input input',
    sendButtonSelector: '.send-btn',
    closeButtonSelector: '.close-btn'
  });
  
  // Initialize notifications system
  const notificationSystem = new Notification({
    containerSelector: '#notification-container'
  });
  
  // Show welcome notification
  notificationSystem.show({
    type: 'info',
    title: 'Welcome to Kha-Boom!',
    message: 'Explore our interactive math courses and discover a new way of learning.',
    duration: 5000
  });
  
  // Add some interactivity to the hero section
  initHeroAnimation();
}

/**
 * Creates an interactive animation in the hero section
 */
function initHeroAnimation() {
  const hero = new ElementView('.hero');
  
  // Create floating math symbols
  const symbols = ['π', '∑', '∫', '√', '×', '÷', '+', '−', '='];
  const container = hero.$('.container');
  
  symbols.forEach(symbol => {
    const el = $N('div', {
      class: 'floating-symbol',
      style: `
        position: absolute;
        opacity: 0.1;
        font-size: ${Math.random() * 30 + 20}px;
        font-weight: bold;
        color: var(--primary-color);
        z-index: 0;
        transform: translate(
          ${Math.random() * 100}vw,
          ${Math.random() * 100}%
        );
      `
    }, symbol);
    
    container.prepend(el);
    
    // Animate each symbol
    const duration = Math.random() * 10000 + 5000;
    const startPosition = new Point(Math.random() * 100, Math.random() * 100);
    const endPosition = new Point(Math.random() * 100, Math.random() * 100);
    
    animate({
      duration,
      draw(progress) {
        const x = startPosition.x + (endPosition.x - startPosition.x) * progress;
        const y = startPosition.y + (endPosition.y - startPosition.y) * progress;
        el.style.transform = `translate(${x}vw, ${y}%)`;
      },
      easing: t => Math.sin(t * Math.PI / 2),
      repeat: true,
      alternate: true
    });
  });
}

// Initialize the app when the document is ready
Browser.ready.then(initApp); 