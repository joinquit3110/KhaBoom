import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Simulation - Component for interactive physics and math simulations
 * Renders interactive demonstrations from the textbooks
 */
const Simulation = ({ params, courseId }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const requestRef = useRef();
  const simulationTypeRef = useRef(params.type || 'particles');
  const simulationStateRef = useRef({
    particles: [],
    time: 0,
    width: 0,
    height: 0
  });
  
  // Initialize simulation based on type
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 400;
      simulationStateRef.current.width = canvas.width;
      simulationStateRef.current.height = canvas.height;
    };
    
    // Initialize appropriate simulation type
    const initializeSimulation = () => {
      resizeCanvas();
      
      switch (simulationTypeRef.current) {
        case 'particles':
          initParticles();
          break;
        case 'pendulum':
          initPendulum();
          break;
        case 'wave':
          initWave();
          break;
        default:
          initParticles();
      }
      
      setInitialized(true);
    };
    
    // Particle system initialization
    const initParticles = () => {
      const state = simulationStateRef.current;
      const particleCount = params.particleCount || 50;
      
      state.particles = [];
      for (let i = 0; i < particleCount; i++) {
        state.particles.push({
          x: Math.random() * state.width,
          y: Math.random() * state.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 4 + 2,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      }
    };
    
    // Pendulum simulation initialization
    const initPendulum = () => {
      const state = simulationStateRef.current;
      state.pendulum = {
        length: 150,
        theta: Math.PI / 4,
        dtheta: 0,
        gravity: 9.8,
        damping: 0.995,
        trailPoints: []
      };
    };
    
    // Wave simulation initialization
    const initWave = () => {
      const state = simulationStateRef.current;
      state.wave = {
        frequency: params.frequency || 0.02,
        amplitude: params.amplitude || 50,
        speed: params.waveSpeed || 0.05,
        points: []
      };
    };
    
    window.addEventListener('resize', resizeCanvas);
    initializeSimulation();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [params]);
  
  // Animation loop
  useEffect(() => {
    if (!initialized) return;
    
    let lastTime = 0;
    
    const animate = (time) => {
      if (!lastTime) lastTime = time;
      const deltaTime = (time - lastTime) * speed / 1000;
      lastTime = time;
      
      updateSimulation(deltaTime);
      renderSimulation();
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    // Update simulation state
    const updateSimulation = (deltaTime) => {
      const state = simulationStateRef.current;
      state.time += deltaTime;
      
      switch (simulationTypeRef.current) {
        case 'particles':
          updateParticles(deltaTime);
          break;
        case 'pendulum':
          updatePendulum(deltaTime);
          break;
        case 'wave':
          updateWave(deltaTime);
          break;
      }
    };
    
    // Update particle positions
    const updateParticles = (deltaTime) => {
      const state = simulationStateRef.current;
      
      state.particles.forEach(particle => {
        // Update position
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;
        
        // Bounce off walls
        if (particle.x < particle.radius) {
          particle.x = particle.radius;
          particle.vx *= -1;
        } else if (particle.x > state.width - particle.radius) {
          particle.x = state.width - particle.radius;
          particle.vx *= -1;
        }
        
        if (particle.y < particle.radius) {
          particle.y = particle.radius;
          particle.vy *= -1;
        } else if (particle.y > state.height - particle.radius) {
          particle.y = state.height - particle.radius;
          particle.vy *= -1;
        }
      });
    };
    
    // Update pendulum state
    const updatePendulum = (deltaTime) => {
      const state = simulationStateRef.current;
      const p = state.pendulum;
      
      // Simple pendulum physics
      const force = -p.gravity / p.length * Math.sin(p.theta);
      p.dtheta += force * deltaTime;
      p.dtheta *= p.damping; // Add damping
      p.theta += p.dtheta * deltaTime;
      
      // Record trail points
      const x = state.width / 2 + Math.sin(p.theta) * p.length;
      const y = state.height / 4 + Math.cos(p.theta) * p.length;
      
      if (state.time % 0.1 < deltaTime) {
        p.trailPoints.push({ x, y });
        if (p.trailPoints.length > 50) {
          p.trailPoints.shift();
        }
      }
    };
    
    // Update wave state
    const updateWave = (deltaTime) => {
      const state = simulationStateRef.current;
      const w = state.wave;
      
      // Calculate wave points
      w.points = [];
      for (let x = 0; x < state.width; x += 5) {
        const y = state.height / 2 + 
                  Math.sin(x * w.frequency + state.time * w.speed) * w.amplitude;
        w.points.push({ x, y });
      }
    };
    
    // Render simulation to canvas
    const renderSimulation = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const state = simulationStateRef.current;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      switch (simulationTypeRef.current) {
        case 'particles':
          renderParticles(ctx);
          break;
        case 'pendulum':
          renderPendulum(ctx);
          break;
        case 'wave':
          renderWave(ctx);
          break;
      }
    };
    
    // Render particles
    const renderParticles = (ctx) => {
      const state = simulationStateRef.current;
      
      state.particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
    };
    
    // Render pendulum
    const renderPendulum = (ctx) => {
      const state = simulationStateRef.current;
      const p = state.pendulum;
      
      // Calculate pendulum position
      const pivotX = state.width / 2;
      const pivotY = state.height / 4;
      const bobX = pivotX + Math.sin(p.theta) * p.length;
      const bobY = pivotY + Math.cos(p.theta) * p.length;
      
      // Draw trail
      if (p.trailPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trailPoints[0].x, p.trailPoints[0].y);
        
        for (let i = 1; i < p.trailPoints.length; i++) {
          ctx.lineTo(p.trailPoints[i].x, p.trailPoints[i].y);
        }
        
        ctx.strokeStyle = 'rgba(75, 0, 130, 0.2)';
        ctx.stroke();
      }
      
      // Draw pendulum rod
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw pivot point
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
      
      // Draw pendulum bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#4B0082';
      ctx.fill();
    };
    
    // Render wave
    const renderWave = (ctx) => {
      const state = simulationStateRef.current;
      const w = state.wave;
      
      if (w.points.length < 2) return;
      
      // Draw wave
      ctx.beginPath();
      ctx.moveTo(w.points[0].x, w.points[0].y);
      
      for (let i = 1; i < w.points.length; i++) {
        ctx.lineTo(w.points[i].x, w.points[i].y);
      }
      
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw dots at peaks and troughs for visual interest
      for (let i = 1; i < w.points.length - 1; i++) {
        const prev = w.points[i - 1].y;
        const curr = w.points[i].y;
        const next = w.points[i + 1].y;
        
        // Check if this point is a local maximum or minimum
        if ((curr < prev && curr < next) || (curr > prev && curr > next)) {
          ctx.beginPath();
          ctx.arc(w.points[i].x, w.points[i].y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#e91e63';
          ctx.fill();
        }
      }
    };
    
    // Start/stop animation based on playing state
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed, initialized]);
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Change simulation speed
  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    const state = simulationStateRef.current;
    state.time = 0;
    
    switch (simulationTypeRef.current) {
      case 'particles':
        const particleCount = params.particleCount || 50;
        state.particles = [];
        for (let i = 0; i < particleCount; i++) {
          state.particles.push({
            x: Math.random() * state.width,
            y: Math.random() * state.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 4 + 2,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
          });
        }
        break;
      
      case 'pendulum':
        state.pendulum.theta = Math.PI / 4;
        state.pendulum.dtheta = 0;
        state.pendulum.trailPoints = [];
        break;
      
      case 'wave':
        state.wave.points = [];
        break;
    }
  };
  
  return (
    <div className="simulation-container">
      <div className="simulation-controls">
        <motion.button
          className={`play-button ${isPlaying ? 'pause' : 'play'}`}
          onClick={togglePlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </motion.button>
        
        <div className="speed-controls">
          <span>Speed:</span>
          <motion.button
            className={speed === 0.5 ? 'active' : ''}
            onClick={() => changeSpeed(0.5)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            0.5x
          </motion.button>
          <motion.button
            className={speed === 1 ? 'active' : ''}
            onClick={() => changeSpeed(1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            1x
          </motion.button>
          <motion.button
            className={speed === 2 ? 'active' : ''}
            onClick={() => changeSpeed(2)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            2x
          </motion.button>
        </div>
        
        <motion.button
          className="reset-button"
          onClick={resetSimulation}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reset
        </motion.button>
      </div>
      
      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
      
      <div className="simulation-info">
        <p>{params.description || 'Interactive simulation demonstrating mathematical and physical principles.'}</p>
      </div>
    </div>
  );
};

export default Simulation;
