import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * GraphPlotter - An interactive function graphing component
 * Allows users to plot mathematical functions and explore their properties
 */
const GraphPlotter = ({ params, courseId }) => {
  const canvasRef = useRef(null);
  const [expression, setExpression] = useState(params.defaultExpression || 'x^2');
  const [error, setError] = useState('');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  
  // Draw the graph on canvas
  useEffect(() => {
    drawGraph();
  }, [expression, xMin, xMax, yMin, yMax]);
  
  // Evaluate an expression with the given value of x
  const evaluateExpression = (expr, x) => {
    try {
      // Replace math functions with Math.function
      const safeExpr = expr
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**'); // Convert ^ to ** for exponentiation
      
      // Create a safe evaluation function
      // eslint-disable-next-line no-new-func
      const evalFunc = new Function('x', `return ${safeExpr};`);
      return evalFunc(x);
    } catch (e) {
      setError('Invalid expression');
      return NaN;
    }
  };
  
  // Draw the graph
  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    // X-axis
    const yAxis = height * (1 - (0 - yMin) / (yMax - yMin));
    ctx.moveTo(0, yAxis);
    ctx.lineTo(width, yAxis);
    
    // Y-axis
    const xAxis = width * ((0 - xMin) / (xMax - xMin));
    ctx.moveTo(xAxis, 0);
    ctx.lineTo(xAxis, height);
    
    ctx.stroke();
    
    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x === 0) continue; // Skip the axis
      const xPos = width * ((x - xMin) / (xMax - xMin));
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, height);
    }
    
    // Horizontal grid lines
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y === 0) continue; // Skip the axis
      const yPos = height * (1 - (y - yMin) / (yMax - yMin));
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
    }
    
    ctx.stroke();
    
    // Draw function
    if (!expression.trim()) return;
    
    try {
      ctx.beginPath();
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 2;
      
      let isFirstPoint = true;
      
      // Plot the function
      for (let i = 0; i < width; i++) {
        const x = xMin + (i / width) * (xMax - xMin);
        const y = evaluateExpression(expression, x);
        
        if (isNaN(y)) continue;
        
        const yPos = height * (1 - (y - yMin) / (yMax - yMin));
        
        if (isFirstPoint) {
          ctx.moveTo(i, yPos);
          isFirstPoint = false;
        } else {
          ctx.lineTo(i, yPos);
        }
      }
      
      ctx.stroke();
      setError('');
    } catch (e) {
      setError('Error drawing graph: ' + e.message);
    }
  };
  
  // Handle expression input change
  const handleExpressionChange = (e) => {
    setExpression(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    drawGraph();
  };
  
  return (
    <div className="graph-plotter">
      <form onSubmit={handleSubmit} className="graph-controls">
        <div className="input-group">
          <label htmlFor="expression">Function: y = </label>
          <input
            type="text"
            id="expression"
            value={expression}
            onChange={handleExpressionChange}
            placeholder="e.g., x^2, sin(x), 2*x+1"
          />
          <motion.button 
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Plot
          </motion.button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="range-controls">
          <div className="input-group">
            <label htmlFor="xMin">x min:</label>
            <input
              type="number"
              id="xMin"
              value={xMin}
              onChange={(e) => setXMin(Number(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="xMax">x max:</label>
            <input
              type="number"
              id="xMax"
              value={xMax}
              onChange={(e) => setXMax(Number(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="yMin">y min:</label>
            <input
              type="number"
              id="yMin"
              value={yMin}
              onChange={(e) => setYMin(Number(e.target.value))}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="yMax">y max:</label>
            <input
              type="number"
              id="yMax"
              value={yMax}
              onChange={(e) => setYMax(Number(e.target.value))}
            />
          </div>
        </div>
      </form>
      
      <div className="graph-container">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400}
          className="graph-canvas"
        />
      </div>
      
      <div className="graph-info">
        <p>{params.description || 'Explore mathematical functions by plotting their graphs.'}</p>
        <p className="graph-tips">
          Available functions: sin, cos, tan, sqrt, log, exp, abs. Constants: pi, e.
        </p>
      </div>
    </div>
  );
};

export default GraphPlotter;
