import { Browser, Component, ElementView } from '@mathigon/boost';
import { Circle, Point } from '@mathigon/euclid';
import { ChatBot } from './chatbot.js';
import { Notification } from './notification.js';
import { StepBar } from '../components/step-bar.js';

// Register custom components
Component.register('x-step-bar', StepBar);

/**
 * Manages the interactive elements and navigation on course pages
 */
class CoursePage {
  constructor() {
    this.initNavigation();
    this.initStepBar();
    this.initChatBot();
    this.initNotifications();
    this.initInteractives();
  }
  
  /**
   * Initializes course page navigation
   */
  initNavigation() {
    // Handle navigation clicks
    const navLinks = document.querySelectorAll('.course-navigation a');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Update active state
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update step bar if needed
        const sectionId = link.getAttribute('href').substring(1);
        const sections = Array.from(navLinks).map(l => 
          l.getAttribute('href').substring(1));
        const index = sections.indexOf(sectionId);
        
        if (index >= 0) {
          const stepBar = document.querySelector('x-step-bar');
          if (stepBar) {
            stepBar.goToStep(index + 1);
          }
        }
        
        // Show notification
        this.notification.show({
          type: 'info',
          title: 'Section Changed',
          message: `Navigated to ${link.textContent.trim()} section`,
          duration: 2000
        });
      });
    });
    
    // Handle next/previous buttons
    const nextButton = document.querySelector('.btn-next');
    const prevButton = document.querySelector('.btn-prev');
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const stepBar = document.querySelector('x-step-bar');
        if (stepBar) {
          if (stepBar.next()) {
            const newSection = navLinks[stepBar.value - 1];
            if (newSection) {
              navLinks.forEach(l => l.classList.remove('active'));
              newSection.classList.add('active');
              nextButton.href = newSection.getAttribute('href');
            }
          }
        }
      });
    }
    
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        const stepBar = document.querySelector('x-step-bar');
        if (stepBar) {
          if (stepBar.prev()) {
            const newSection = navLinks[stepBar.value - 1];
            if (newSection) {
              navLinks.forEach(l => l.classList.remove('active'));
              newSection.classList.add('active');
              prevButton.href = newSection.getAttribute('href');
            }
          }
        }
      });
    }
  }
  
  /**
   * Initializes step bar component
   */
  initStepBar() {
    const stepBar = document.querySelector('x-step-bar');
    if (stepBar) {
      stepBar.addEventListener('step-change', (e) => {
        console.log('Step changed to', e.detail.value);
      });
    }
  }
  
  /**
   * Initializes chat bot
   */
  initChatBot() {
    this.chatBot = new ChatBot({
      containerSelector: '#tutor-panel',
      headerSelector: '.tutor-header',
      messagesSelector: '.tutor-messages',
      inputSelector: '.tutor-input input',
      sendButtonSelector: '.send-btn',
      closeButtonSelector: '.close-btn'
    });
    
    // Add course-specific responses to chatbot
    this.chatBot.responses = {
      ...this.chatBot.responses,
      'circle': 'A circle is the set of all points in a plane that are at a fixed distance (called the radius) from a given point (called the center).',
      'radius': 'The radius of a circle is the distance from the center to any point on the circle.',
      'diameter': 'The diameter of a circle is a straight line segment that passes through the center and connects two points on the circle. It equals twice the radius.',
      'pi': 'π (pi) is the ratio of a circle\'s circumference to its diameter, approximately equal to 3.14159.',
      'circumference': 'The circumference of a circle is the distance around it. The formula is C = 2πr, where r is the radius.',
      'area': 'The area of a circle is given by the formula A = πr², where r is the radius.'
    };
  }
  
  /**
   * Initializes notification system
   */
  initNotifications() {
    this.notification = new Notification({
      containerSelector: '#notification-container'
    });
    
    // Show welcome notification
    this.notification.show({
      type: 'info',
      title: 'Course Loaded',
      message: 'Welcome to the Circles and Pi course. Click the chat icon if you need help!',
      duration: 5000
    });
  }
  
  /**
   * Initializes interactive canvas elements
   */
  initInteractives() {
    this.initCircleExplorer();
    this.initCircleTerminology();
  }
  
  /**
   * Initializes the circle explorer interactive
   */
  initCircleExplorer() {
    const canvas = document.getElementById('circle-explorer');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Set up initial circle properties
    const center = new Point(width / 2, height / 2);
    let radius = 100;
    let draggingCenter = false;
    let draggingRadius = false;
    let radiusPoint = new Point(center.x + radius, center.y);
    
    // Draw function
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#1f7aff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw center point
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#1f7aff';
      ctx.fill();
      
      // Draw radius line
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(radiusPoint.x, radiusPoint.y);
      ctx.strokeStyle = '#ff6b1f';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw radius point
      ctx.beginPath();
      ctx.arc(radiusPoint.x, radiusPoint.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b1f';
      ctx.fill();
      
      // Draw radius value
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText(`Radius: ${Math.round(radius)}px`, 20, 30);
      ctx.fillText(`Circumference: ${Math.round(2 * Math.PI * radius)}px`, 20, 55);
      ctx.fillText(`Area: ${Math.round(Math.PI * radius * radius)}px²`, 20, 80);
    };
    
    // Initial draw
    draw();
    
    // Event listeners
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mousePoint = new Point(mouseX, mouseY);
      
      // Check if clicking on center or radius point
      if (center.distance(mousePoint) < 10) {
        draggingCenter = true;
      } else if (radiusPoint.distance(mousePoint) < 10) {
        draggingRadius = true;
      }
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!draggingCenter && !draggingRadius) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      if (draggingCenter) {
        // Move center and radius point
        const dx = mouseX - center.x;
        const dy = mouseY - center.y;
        
        center.x = mouseX;
        center.y = mouseY;
        radiusPoint.x += dx;
        radiusPoint.y += dy;
      } else if (draggingRadius) {
        // Update radius point and recalculate radius
        radiusPoint.x = mouseX;
        radiusPoint.y = mouseY;
        radius = center.distance(radiusPoint);
      }
      
      draw();
    });
    
    canvas.addEventListener('mouseup', () => {
      draggingCenter = false;
      draggingRadius = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
      draggingCenter = false;
      draggingRadius = false;
    });
  }
  
  /**
   * Initializes the circle terminology interactive
   */
  initCircleTerminology() {
    const canvas = document.getElementById('circle-terminology');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Circle parameters
    const center = new Point(width / 2, height / 2);
    const radius = 150;
    
    // Circle parts with regions
    const parts = [
      { name: 'Center', region: { x: center.x - 10, y: center.y - 10, width: 20, height: 20 }, 
        description: 'The point from which all points on the circle are at the same distance.' },
      { name: 'Radius', region: { x: center.x, y: center.y, width: radius, height: 20 }, 
        description: 'A line segment from the center to any point on the circle.' },
      { name: 'Diameter', region: { x: center.x - radius, y: center.y - 10, width: radius * 2, height: 20 }, 
        description: 'A line segment passing through the center, with endpoints on the circle.' },
      { name: 'Circumference', region: null, // Special handling for circumference
        description: 'The distance around the circle. Equal to 2πr or πd.' },
      { name: 'Chord', region: { x: center.x - radius * 0.7, y: center.y + radius * 0.5, width: radius * 1.4, height: 20 }, 
        description: 'A line segment connecting two points on the circle.' },
      { name: 'Arc', region: null, // Special handling for arc
        description: 'A portion of the circumference of the circle.' },
      { name: 'Sector', region: null, // Special handling for sector
        description: 'A region bounded by two radii and the arc between them.' }
    ];
    
    let activePart = null;
    let isCircumferenceActive = false;
    let isArcActive = false;
    let isSectorActive = false;
    
    // Draw function
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isCircumferenceActive ? '#ff6b1f' : '#1f7aff';
      ctx.lineWidth = isCircumferenceActive ? 4 : 2;
      ctx.stroke();
      
      // Draw center
      ctx.beginPath();
      ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = parts[0].name === activePart ? '#ff6b1f' : '#1f7aff';
      ctx.fill();
      
      // Draw radius
      if (parts[1].name === activePart) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + radius, center.y);
        ctx.strokeStyle = '#ff6b1f';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(center.x + radius * 0.5 - 15, center.y - 10);
        ctx.lineTo(center.x + radius * 0.5, center.y);
        ctx.lineTo(center.x + radius * 0.5 - 15, center.y + 10);
        ctx.fillStyle = '#ff6b1f';
        ctx.fill();
      }
      
      // Draw diameter
      if (parts[2].name === activePart) {
        ctx.beginPath();
        ctx.moveTo(center.x - radius, center.y);
        ctx.lineTo(center.x + radius, center.y);
        ctx.strokeStyle = '#ff6b1f';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(center.x - 15, center.y - 10);
        ctx.lineTo(center.x, center.y);
        ctx.lineTo(center.x - 15, center.y + 10);
        ctx.fillStyle = '#ff6b1f';
        ctx.fill();
      }
      
      // Draw chord
      if (parts[4].name === activePart) {
        ctx.beginPath();
        ctx.moveTo(center.x - radius * 0.7, center.y + radius * 0.5);
        ctx.lineTo(center.x + radius * 0.7, center.y + radius * 0.5);
        ctx.strokeStyle = '#ff6b1f';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Draw arc
      if (isArcActive) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, Math.PI * 0.25, Math.PI * 0.75);
        ctx.strokeStyle = '#ff6b1f';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      
      // Draw sector
      if (isSectorActive) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, radius, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 107, 31, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#ff6b1f';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw active part information
      if (activePart) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(20, height - 80, width - 40, 60);
        ctx.strokeStyle = '#1f7aff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, height - 80, width - 40, 60);
        
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#1f7aff';
        ctx.fillText(activePart, 30, height - 55);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#333';
        const description = parts.find(p => p.name === activePart)?.description || '';
        ctx.fillText(description, 30, height - 30);
      }
    };
    
    // Initial draw
    draw();
    
    // Event listeners
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      let foundPart = null;
      isCircumferenceActive = false;
      isArcActive = false;
      isSectorActive = false;
      
      // Check if mouse is over a part
      for (const part of parts) {
        if (part.name === 'Circumference') {
          // Special handling for circumference
          const distFromCircle = Math.abs(center.distance(new Point(mouseX, mouseY)) - radius);
          if (distFromCircle < 10) {
            foundPart = part.name;
            isCircumferenceActive = true;
            break;
          }
        } else if (part.name === 'Arc') {
          // Special handling for arc
          const distFromCenter = center.distance(new Point(mouseX, mouseY));
          const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
          if (Math.abs(distFromCenter - radius) < 10 && angle > Math.PI * 0.25 && angle < Math.PI * 0.75) {
            foundPart = part.name;
            isArcActive = true;
            break;
          }
        } else if (part.name === 'Sector') {
          // Special handling for sector
          const distFromCenter = center.distance(new Point(mouseX, mouseY));
          const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
          if (distFromCenter < radius && angle > -Math.PI * 0.3 && angle < Math.PI * 0.3) {
            foundPart = part.name;
            isSectorActive = true;
            break;
          }
        } else if (part.region) {
          const r = part.region;
          if (mouseX >= r.x && mouseX <= r.x + r.width && 
              mouseY >= r.y && mouseY <= r.y + r.height) {
            foundPart = part.name;
            break;
          }
        }
      }
      
      if (foundPart !== activePart) {
        activePart = foundPart;
        draw();
        
        // Change cursor
        canvas.style.cursor = activePart ? 'pointer' : 'default';
      }
    });
    
    canvas.addEventListener('click', () => {
      if (activePart) {
        this.notification.show({
          type: 'info',
          title: activePart,
          message: parts.find(p => p.name === activePart)?.description || '',
          duration: 3000
        });
      }
    });
  }
}

// Initialize the course page when the DOM is ready
Browser.ready.then(() => {
  new CoursePage();
}); 