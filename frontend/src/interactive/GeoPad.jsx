import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * GeoPad - An interactive geometry pad component
 * Allows users to create and manipulate geometric shapes and explore geometric concepts
 */
const GeoPad = ({ params, courseId }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('circle');
  const [shapes, setShapes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  
  // Initialize canvas context and set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 400; // Fixed height
      redraw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // Redraw all shapes on the canvas
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape);
    });
    
    // Draw current shape if drawing
    if (drawing) {
      const tempShape = {
        type: tool,
        start: startPoint,
        end: currentPoint
      };
      drawShape(ctx, tempShape);
    }
  };
  
  // Draw a single shape based on type
  const drawShape = (ctx, shape) => {
    const { type, start, end } = shape;
    
    ctx.beginPath();
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 2;
    
    switch (type) {
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        break;
      case 'line':
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        break;
      case 'rectangle':
        ctx.rect(
          start.x,
          start.y,
          end.x - start.x,
          end.y - start.y
        );
        break;
      default:
        break;
    }
    
    ctx.stroke();
  };
  
  // Handle mouse down event (start drawing)
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
    setDrawing(true);
  };
  
  // Handle mouse move event (update drawing)
  const handleMouseMove = (e) => {
    if (!drawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPoint({ x, y });
    redraw();
  };
  
  // Handle mouse up event (finish drawing)
  const handleMouseUp = () => {
    if (!drawing) return;
    
    // Add new shape
    const newShape = {
      type: tool,
      start: startPoint,
      end: currentPoint
    };
    
    setShapes([...shapes, newShape]);
    setDrawing(false);
    redraw();
  };
  
  // Handle clear button click
  const handleClear = () => {
    setShapes([]);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  
  return (
    <div className="geopad-container">
      <div className="geopad-toolbar">
        <motion.button
          className={`tool-button ${tool === 'circle' ? 'active' : ''}`}
          onClick={() => setTool('circle')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Circle
        </motion.button>
        <motion.button
          className={`tool-button ${tool === 'line' ? 'active' : ''}`}
          onClick={() => setTool('line')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Line
        </motion.button>
        <motion.button
          className={`tool-button ${tool === 'rectangle' ? 'active' : ''}`}
          onClick={() => setTool('rectangle')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Rectangle
        </motion.button>
        <motion.button
          className="clear-button"
          onClick={handleClear}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Clear
        </motion.button>
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      <div className="geopad-info">
        <p>{params.description || 'Use the tools above to create geometric shapes on the canvas.'}</p>
      </div>
    </div>
  );
};

export default GeoPad;
